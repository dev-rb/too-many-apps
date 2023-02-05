import { batch, createEffect, createMemo, createSignal, For, on, onCleanup, onMount, Show } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import { Match, Switch } from 'solid-js/web';
import { useTree } from '~/apps/TreeProvider';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import type { Size, XYPosition } from '~/types';
import { clamp } from '~/utils/math';
import { ILayoutComponent, useBuilder } from '..';
import LayoutComponent from '../LayoutComponent/LayoutComponent';
import { calculateDistances } from '../snapping';
import { getRelativeTransformedBounds } from '../transform';
import { calculateResize, closestCorner, createNewComponent, getCommonBounds, isLeftClick } from '../utils';
import { Selection } from './Selection';

export type TransformOp = 'draw' | 'resize' | 'drag';

interface LayoutCanvasProps {
  components: { [key: string]: ILayoutComponent };
  selectedComponents: ILayoutComponent[];
}

interface TransformState {
  startMousePos: XYPosition;
  initialComponents: ILayoutComponent[];
  isTransforming: boolean;
  activeHandle: string;
}

export const LayoutCanvas = (props: LayoutCanvasProps) => {
  const [canvasRef, setCanvasRef] = createSignal<SVGSVGElement>();
  const [canvasBounds, setCanvasBounds] = createSignal({ ...ZERO_POS, ...ZERO_SIZE });
  const builder = useBuilder();
  const tree = useTree()!;

  const [transformOp, setTransformOp] = createSignal<TransformOp>('draw');
  const [selectionPosition, setSelectionPosition] = createSignal(ZERO_POS, { equals: false });
  const [selectionSize, setSelectionSize] = createSignal(ZERO_SIZE, { equals: false });

  const [ctrl, setCtrl] = createSignal(false);

  const [transformState, setTransformState] = createStore<TransformState>({
    startMousePos: ZERO_POS,
    initialComponents: [],
    isTransforming: false,
    activeHandle: 'top-left',
  });

  const selected = createMemo(() => props.selectedComponents);

  const positionRelativeToCanvas = (position: XYPosition): XYPosition => {
    return { x: position.x - canvasBounds().x, y: position.y - canvasBounds().y };
  };

  const onResizeStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLeftClick(e)) return;

    if (selected().length) {
      setTransformOp('resize');
      const mousePosition = {
        x: e.clientX,
        y: e.clientY,
      };

      const relativeMousePos = positionRelativeToCanvas(mousePosition);
      const handle = closestCorner(relativeMousePos, {
        left: selectionPosition().x,
        right: selectionPosition().x + selectionSize().width,
        top: selectionPosition().y,
        bottom: selectionPosition().y + selectionSize().height,
      });
      if (handle) {
        setTransformState({
          isTransforming: true,
          startMousePos: mousePosition,
          initialComponents: [...props.selectedComponents.map((v) => ({ ...v }))],
          activeHandle: handle,
        });
        document.addEventListener('pointermove', dragUpdate);
        document.addEventListener('pointerup', onMouseUp);
      }
    }
  };

  const onDrawStart = (e: MouseEvent) => {
    if (!isLeftClick(e)) return;
    if (builder.toolState.activeTool === 'pointer' && selected().length) {
      builder.clearSelection();
    }
    if (builder.toolState.drawItem && builder.toolState.activeTool === 'draw') {
      e.preventDefault();
      e.stopPropagation();
      setTransformOp('draw');

      const drawable = builder.getDrawable(builder.toolState.drawItem!);
      const mousePos = positionRelativeToCanvas({ x: e.clientX, y: e.clientY });

      builder.clearSelection();

      const newComp = createNewComponent({
        name: drawable?.name,
        bounds: {
          top: mousePos.y,
          left: mousePos.x,
          right: mousePos.x,
          bottom: mousePos.y,
        },
        layer: builder.componentState.maxLayer + 1,
        color: drawable?.color,
        css: {
          ...drawable?.css,
        },
      });

      setSelectionPosition({ ...mousePos });
      setSelectionSize(ZERO_SIZE);
      builder.createNewComponent(newComp);
      builder.selectComponent(newComp.id);
      tree.addNewLeaf(newComp.id);
      setTransformState({
        isTransforming: true,
        startMousePos: {
          x: e.clientX,
          y: e.clientY,
        },
        initialComponents: [newComp],
      });
      document.addEventListener('pointermove', dragUpdate);
      document.addEventListener('pointerup', onMouseUp);
    }
  };

  const onDragStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLeftClick(e)) return;

    if (builder.toolState.activeTool === 'pointer' && selected().length) {
      setTransformOp('drag');
      setTransformState({
        isTransforming: true,
        initialComponents: [
          ...props.selectedComponents.map((v) => {
            let copy = { ...v };
            copy.bounds = { ...copy.bounds, left: e.clientX - copy.bounds.left, top: e.clientY - copy.bounds.top };
            return copy;
          }),
        ],
        startMousePos: {
          x: e.clientX - selectionPosition().x,
          y: e.clientY - selectionPosition().y,
        },
      });
      document.addEventListener('pointermove', dragUpdate);
      document.addEventListener('pointerup', onMouseUp);
    }
  };

  const restrictSize = (position: XYPosition, newSize: Size, previousSize: Size) => {
    let newWidth = Math.abs(newSize.width);
    let newHeight = Math.abs(newSize.height);
    if (position.x < 0) {
      newWidth = previousSize.width;
    } else if (Math.floor(canvasBounds().width - (position.x + newWidth)) < 0) {
      newWidth = canvasBounds().width - position.x;
    }
    if (position.y < 0) {
      newHeight = previousSize.height;
    } else if (Math.floor(canvasBounds().height - (position.y + newHeight)) < 0) {
      newHeight = canvasBounds().height - position.y;
    }

    return { width: newWidth, height: newHeight };
  };

  let raf = true;

  const dragUpdate = (e: MouseEvent) => {
    if (transformState.isTransforming && raf) {
      raf = false;
      requestAnimationFrame(() => onDrag(e));
    }
  };

  const onDrag = (e: MouseEvent) => {
    if (transformState.isTransforming) {
      raf = true;
      const { activeHandle, initialComponents, startMousePos } = { ...transformState };

      if (transformOp() === 'draw' || transformOp() === 'resize') {
        const newMousePos = { x: e.clientX - startMousePos.x, y: e.clientY - startMousePos.y };
        if (selected().length > 1) {
          const commonBounds = getCommonBounds(initialComponents.map((v) => v.bounds));

          let { bottom, left, right, top } = calculateResize(commonBounds, newMousePos, activeHandle, false);

          let scaleX = (right - left) / Math.abs(commonBounds.width);
          let scaleY = (bottom - top) / Math.abs(commonBounds.height);
          let flipX = scaleX < 0;
          let flipY = scaleY < 0;

          if (right < left) {
            [left, right] = [right, left];
          }

          if (bottom < top) {
            [top, bottom] = [bottom, top];
          }

          const w = right - left;
          const h = bottom - top;

          scaleX = (w / (Math.abs(commonBounds.width) || 1)) * (flipX ? -1 : 1);
          scaleY = (h / (Math.abs(commonBounds.height) || 1)) * (flipY ? -1 : 1);

          flipX = scaleX < 0;
          flipY = scaleY < 0;

          let index = 0;
          for (const original of initialComponents) {
            const latest = selected()[index];

            let {
              left: x,
              top: y,
              width,
              height,
            } = getRelativeTransformedBounds(
              { bottom, left, right, top, width: w, height: h },
              commonBounds,
              { ...original.bounds, ...original.size },
              flipX,
              flipY
            );

            if (x > canvasBounds().width - width) {
              x = latest.bounds.left;
            }

            if (y > canvasBounds().height - height) {
              y = latest.bounds.top;
            }

            builder.updateComponentPosition(original.id, {
              x: x,
              y: y,
            });
            const restrictedSize = restrictSize({ x: x, y: y }, { width, height }, latest.size);

            builder.updateComponentSize(original.id, restrictedSize);
            index++;
          }
          measureSelection();
        } else {
          const solo = initialComponents[0];
          const latest = selected()[0];
          const {
            left: x,
            top: y,
            width,
            height,
          } = calculateResize({ ...solo.bounds, ...solo.size }, newMousePos, activeHandle, true);
          builder.updateComponentPosition(solo.id, { x, y });
          const restrictedSize = restrictSize({ x, y }, { width, height }, latest.size);
          builder.updateComponentSize(solo.id, restrictedSize);

          setSelectionPosition({
            x: Math.max(0, selected()[0].bounds.left),
            y: Math.max(0, selected()[0].bounds.top),
          });
          setSelectionSize(() => ({ ...selected()[0].size }));
        }
      } else if (transformOp() === 'drag') {
        let newPos = {
          x: clamp(e.clientX - startMousePos.x, 0, canvasBounds().width - selectionSize().width),
          y: clamp(e.clientY - startMousePos.y, 0, canvasBounds().height - selectionSize().height),
        };

        const selectionBounds = {
          left: selectionPosition().x,
          top: selectionPosition().y,
          bottom: selectionPosition().y + selectionSize().height,
          right: selectionPosition().x + selectionSize().width,
        };
        const otherComponents = Object.values(props.components).filter((comp) => !selected().includes(comp));

        const alignDistance = calculateDistances(
          selectionBounds,
          otherComponents.map((v) => v.bounds)
        );
        const xDiff = Math.abs(newPos.x - selectionBounds.left);
        const xLock = Math.abs(xDiff + alignDistance.xAlign - 4) < 4;
        if (xLock) {
          newPos.x = selectionBounds.left + alignDistance.xAlign;
        }

        const yDiff = Math.abs(newPos.y - selectionBounds.top);
        const yLock = Math.abs(yDiff + alignDistance.yAlign - 4) < 4;
        if (yLock) {
          newPos.y = selectionBounds.top + alignDistance.yAlign;
        }

        let index = 0;
        for (const initialComponent of initialComponents) {
          const latest = selected()[index];
          const newElPos = {
            x: clamp(
              e.clientX - initialComponent.bounds.left,
              latest.bounds.left - newPos.x,
              newPos.x + (latest.bounds.left - selectionPosition().x)
            ),
            y: clamp(
              e.clientY - initialComponent.bounds.top,
              latest.bounds.top - newPos.y,
              newPos.y + (latest.bounds.top - selectionPosition().y)
            ),
          };
          builder.updateComponentPosition(initialComponent.id, { ...newElPos });
          index++;
        }

        measureSelection();
      }

      // Instead of updating the tree after moving each and every selected component,
      // we can only update the tree for the most outer elements in the selection that would need to be updated
      // because of their parent status.
      let farthestParents: Set<ILayoutComponent> = new Set();

      for (let i = 0; i < selected().length; i++) {
        const comp = selected()[i];

        let parent: string = comp.id;

        while (parent && builder.componentState.selected.includes(parent)) {
          let grandparent: string | undefined = tree.tree[parent].parent;
          if (grandparent && !builder.componentState.selected.includes(grandparent)) break;
          parent = grandparent!;
        }

        if (parent && builder.componentState.selected.includes(parent)) {
          farthestParents.add(props.components[parent]);
        }

        if (tree.tree[comp.id].parent === undefined) {
          farthestParents.add(comp);
        }
      }

      batch(() => {
        for (const comp of farthestParents) {
          tree.updateTree(comp.id, comp.bounds);
        }
      });
    }
  };

  const onMouseUp = () => {
    setTransformState({
      isTransforming: false,
    });
    setTransformOp('draw');
    raf = true;
    document.removeEventListener('pointermove', dragUpdate);
    document.removeEventListener('pointerup', onMouseUp);
  };

  const selectElement = (id: string) => {
    builder.selectComponent(id);
  };

  const measureSelection = () => {
    const commonBounds = getCommonBounds(selected().map((comp) => comp.bounds));
    setSelectionPosition({ x: commonBounds.left, y: commonBounds.top });
    setSelectionSize({ width: commonBounds.width, height: commonBounds.height });
  };

  createEffect(
    on(selected, (newSelection) => {
      if (!newSelection.length) {
        setSelectionPosition(ZERO_POS);
        setSelectionSize(ZERO_SIZE);
        return;
      }
      measureSelection();
    })
  );

  const setUpCanvasBounds = () => {
    const bounds = canvasRef()!.getBoundingClientRect();
    setCanvasBounds({
      x: bounds.left,
      y: bounds.top,
      width: bounds.width,
      height: bounds.height,
    });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey) {
      setCtrl(true);
    }

    const group = e.ctrlKey && e.key === 'g';

    if (group) {
      e.preventDefault();
      builder.groupSelected();
    }

    const ungroup = e.ctrlKey && e.shiftKey && e.key === 'G' && selected().length;

    if (ungroup) {
      e.preventDefault();
      const groupId = selected()[0].groupId;
      if (groupId) {
        builder.removeGroup(groupId);
      }
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Control') {
      setCtrl(false);
    }
  };

  onMount(() => {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    onCleanup(() => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    });
  });

  createEffect(
    on(canvasRef, () => {
      if (canvasRef()) {
        canvasRef()!.addEventListener('resize', () => {
          setUpCanvasBounds();
        });

        setUpCanvasBounds();
      }
    })
  );

  return (
    <div class="flex flex-col w-6xl h-2xl ">
      {/* Display header */}
      <div class="w-full h-4 bg-dark-5 flex items-center">
        <div class="ml-auto flex gap-2 mr-2">
          <div class="w-2 h-2 bg-green-7 rounded-full" />
          <div class="w-2 h-2 bg-yellow-7 rounded-full" />
          <div class="w-2 h-2 bg-red-7 rounded-full" />
        </div>
      </div>
      {/* Display */}
      <svg id="canvas" ref={setCanvasRef} width="100%" height="100%" class="bg-white" onPointerDown={onDrawStart}>
        <For each={Object.values(props.components).sort((a, b) => a.layer - b.layer)}>
          {(comp) => (
            <LayoutComponent
              {...comp}
              active={builder.componentState.selected?.includes(comp.id)}
              selectElement={selectElement}
              variant="outline"
              onDragStart={onDragStart}
              passThrough={ctrl()}
            />
          )}
        </For>
        <Selection
          active={transformOp() !== 'drag' && props.selectedComponents.length > 0}
          position={selectionPosition()}
          size={selectionSize()}
          onHandleClick={onResizeStart}
        />
      </svg>
    </div>
  );
};
