import { batch, createEffect, createMemo, createSignal, For, on, onCleanup, onMount, Show } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import { Match, Switch } from 'solid-js/web';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import type { Size, XYPosition } from '~/types';
import { clamp } from '~/utils/math';
import { ILayoutComponent, useBuilder } from '..';
import LayoutComponent from '../LayoutComponent/LayoutComponent';
import { calculateDistances } from '../snapping';
import { calculateResize, closestCorner, createNewComponent, getCommonBounds, isLeftClick } from '../utils';
import { Selection } from './Selection';

export type TransformOp = 'draw' | 'resize' | 'drag';

interface LayoutCanvasProps {
  components: { [key: string]: ILayoutComponent };
  selectedComponents: ILayoutComponent[];
}

interface TransformState {
  startMousePos: XYPosition;
  startElPos: XYPosition[];
  startSize: Size[];
  isTransforming: boolean;
  activeHandle: string;
}

export const LayoutCanvas = (props: LayoutCanvasProps) => {
  const [canvasRef, setCanvasRef] = createSignal<SVGSVGElement>();
  const [canvasBounds, setCanvasBounds] = createSignal({ ...ZERO_POS, ...ZERO_SIZE });
  const builder = useBuilder();

  const [transformOp, setTransformOp] = createSignal<TransformOp>('draw');
  const [selectionPosition, setSelectionPosition] = createSignal(ZERO_POS, { equals: false });
  const [selectionSize, setSelectionSize] = createSignal(ZERO_SIZE, { equals: false });

  const [ctrl, setCtrl] = createSignal(false);

  const [transformState, setTransformState] = createStore<TransformState>({
    startMousePos: ZERO_POS,
    startElPos: [ZERO_POS],
    startSize: [ZERO_SIZE],
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

      const mousePos = positionRelativeToCanvas({ x: e.clientX, y: e.clientY });
      const handle = closestCorner(mousePos, {
        left: selectionPosition().x,
        right: selectionPosition().x + selectionSize().width,
        top: selectionPosition().y,
        bottom: selectionPosition().y + selectionSize().height,
      });
      if (handle) {
        setTransformState({
          isTransforming: true,
          startMousePos: {
            x: e.clientX,
            y: e.clientY,
          },
          startElPos: selected().map((v) => {
            return { x: v.bounds.left, y: v.bounds.top };
          }),
          startSize: selected().map((v) => v.size),
          activeHandle: handle,
        });
        document.addEventListener('pointermove', dragUpdate);
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
      setTransformState({
        isTransforming: true,
        startMousePos: {
          x: e.clientX,
          y: e.clientY,
        },
        startElPos: [mousePos],
        startSize: [ZERO_SIZE],
      });
      document.addEventListener('pointermove', dragUpdate);
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
        startElPos: selected().map((v) => ({ x: e.clientX - v.bounds.left, y: e.clientY - v.bounds.top })),
        startMousePos: {
          x: e.clientX - selectionPosition().x,
          y: e.clientY - selectionPosition().y,
        },
      });
      document.addEventListener('pointermove', dragUpdate);
    }
  };

  const onDragGroupStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLeftClick(e)) return;

    if (builder.toolState.activeTool === 'pointer' && selected().length) {
      const group = builder.groups[selected()[0].groupId!];
      setTransformOp('drag');
      setTransformState({
        isTransforming: true,
        startElPos: [{ x: e.clientX - group.bounds.left, y: e.clientY - group.bounds.top }],
        startMousePos: {
          x: e.clientX - group.bounds.left,
          y: e.clientY - group.bounds.top,
        },
      });
      setSelectionPosition({
        x: Math.max(0, group.bounds.left),
        y: Math.max(0, group.bounds.top),
      });
      setSelectionSize(() => ({ ...group.size }));
      document.addEventListener('pointermove', onDragGroup);
      document.addEventListener('pointerup', onDragGroupStop);
    }
  };

  const onDragGroup = (e: MouseEvent) => {
    const { startMousePos } = { ...transformState };
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
    const groupId = selected()[0].groupId;
    if (groupId) {
      builder.updateGroupPosition(groupId, newPos);
      setSelectionPosition({
        x: Math.max(0, builder.groups[groupId].bounds.left),
        y: Math.max(0, builder.groups[groupId].bounds.top),
      });
      setSelectionSize(() => ({ ...builder.groups[groupId].size }));
    }
  };

  const onDragGroupStop = () => {
    setTransformState({
      isTransforming: false,
    });
    document.removeEventListener('pointermove', onDragGroup);
    document.removeEventListener('pointerup', onDragGroupStop);
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
      const { activeHandle, startElPos, startMousePos, startSize } = { ...transformState };

      if (transformOp() === 'draw' || transformOp() === 'resize') {
        const newMousePos = { x: e.clientX - startMousePos.x, y: e.clientY - startMousePos.y };

        for (let i = 0; i < startSize.length; i++) {
          const comp = selected()[i];
          let { updatedPos, updatedSize } = calculateResize(
            startSize[i],
            startElPos[i],
            newMousePos,
            activeHandle,
            true
          );
          builder.updateComponentPosition(comp.id, updatedPos);
          const restrictedSize = restrictSize(updatedPos, updatedSize, comp.size);
          builder.updateComponentSize(comp.id, restrictedSize);
        }

        // If we have multiple selected components being resized, we can use the measureSelection function for better measurements.
        // Otherwise, setting the size and position manually is fine.
        if (selected().length > 1) {
          measureSelection();
        } else {
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

        for (let i = 0; i < startElPos.length; i++) {
          const comp = selected()[i];
          const newElPos = {
            x: clamp(
              e.clientX - startElPos[i].x,
              comp.bounds.left - newPos.x,
              newPos.x + (comp.bounds.left - selectionPosition().x)
            ),
            y: clamp(
              e.clientY - startElPos[i].y,
              comp.bounds.top - newPos.y,
              newPos.y + (comp.bounds.top - selectionPosition().y)
            ),
          };
          if (comp.groupId) {
            builder.updateGroupPosition(comp.groupId, newElPos);
          } else {
            builder.updateComponentPosition(comp.id, newElPos);
          }
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
          let grandparent: string | undefined = props.components[parent].parent;
          if (grandparent && !builder.componentState.selected.includes(grandparent)) break;
          parent = grandparent!;
        }

        if (parent && builder.componentState.selected.includes(parent)) {
          farthestParents.add(props.components[parent]);
        }

        if (comp.parent === undefined) {
          farthestParents.add(comp);
        }
      }

      batch(() => {
        for (const comp of farthestParents) {
          builder.updateTree(comp.id, comp.bounds);
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
  };

  const selectElement = (id: string) => {
    builder.selectComponent(id);
  };

  const measureSelection = () => {
    const newBounds = getCommonBounds(selected());

    setSelectionPosition({ x: newBounds.x, y: newBounds.y });
    setSelectionSize({ width: newBounds.right - newBounds.x, height: newBounds.bottom - newBounds.y });
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

  onMount(() => {
    document.addEventListener('pointerup', onMouseUp);
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey) {
        setCtrl(true);
      }

      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        builder.groupSelected();
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'Control') {
        setCtrl(false);
      }
    });

    onCleanup(() => {
      document.removeEventListener('pointerup', onMouseUp);
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

  const comps = createMemo(() => {
    let allComponents = Object.values(props.components);

    // Remove duplicates
    for (const comp of allComponents) {
      const findSame = allComponents.findIndex((c) => {
        if (c.groupId && comp.groupId && c.groupId === comp.groupId) {
          return true;
        }

        return false;
      });

      if (findSame !== -1) {
        allComponents.splice(findSame, 1);
      }
    }

    const sortedComponents = Object.values(allComponents).sort((a, b) => a.layer - b.layer);

    return sortedComponents;
  });

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
        <For each={comps()}>
          {(comp) => (
            <Switch>
              <Match when={comp.groupId}>
                <g>
                  <g
                    style={{
                      transform: `translate(${builder.groups[comp.groupId!].bounds.left}px, ${
                        builder.groups[comp.groupId!].bounds.top
                      }px)`,
                    }}
                  >
                    <For each={builder.getComponentsInGroup(comp.groupId!)}>
                      {(member) => (
                        <LayoutComponent
                          {...props.components[member]}
                          active={builder.componentState.selected?.includes(member)}
                          selectElement={selectElement}
                          variant="outline"
                          onDragStart={onDragStart}
                          onDragGroup={onDragGroupStart}
                          passThrough={false}
                        />
                      )}
                    </For>
                  </g>
                </g>
              </Match>
              <Match when={!comp.groupId}>
                <LayoutComponent
                  {...comp}
                  active={builder.componentState.selected?.includes(comp.id)}
                  selectElement={selectElement}
                  variant="outline"
                  onDragStart={onDragStart}
                  passThrough={ctrl()}
                />
              </Match>
            </Switch>
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
