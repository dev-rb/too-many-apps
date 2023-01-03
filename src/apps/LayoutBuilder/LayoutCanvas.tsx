import { createEffect, createSignal, For, on, onCleanup, onMount, Show } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import type { Size, XYPosition } from '~/types';
import { clamp } from '~/utils/math';
import { ILayoutComponent, useBuilder } from '.';
import LayoutComponent from './LayoutComponent/LayoutComponent';
import { calculateDistances } from './snapping';
import { calculateResize, closestCorner, createNewComponent, isLeftClick, screenToSVG } from './utils';

export type TransformOp = 'draw' | 'resize' | 'drag';

interface LayoutCanvasProps {
  components: { [key: string]: ILayoutComponent };
  selectedComponents: ILayoutComponent[];
}

interface TransformState {
  startMousePos: XYPosition;
  startElPos: XYPosition;
  startSize: Size;
  isTransforming: boolean;
  activeHandle: string;
}

const LayoutCanvas = (props: LayoutCanvasProps) => {
  const [canvasRef, setCanvasRef] = createSignal<SVGSVGElement>();
  const [selectionRef, setSelectionRef] = createSignal<SVGGElement>();
  const [canvasBounds, setCanvasBounds] = createSignal({ ...ZERO_POS, ...ZERO_SIZE });
  const builder = useBuilder();

  const [transformOp, setTransformOp] = createSignal<TransformOp>('draw');
  const [selectionPosition, setSelectionPosition] = createSignal(ZERO_POS, { equals: false });
  const [selectionSize, setSelectionSize] = createSignal(ZERO_SIZE, { equals: false });

  const [ctrl, setCtrl] = createSignal(false);

  const [transformState, setTransformState] = createStore<TransformState>({
    startMousePos: ZERO_POS,
    startElPos: ZERO_POS,
    startSize: ZERO_SIZE,
    isTransforming: false,
    activeHandle: 'top-left',
  });

  const positionRelativeToCanvas = (position: XYPosition): XYPosition => {
    return { x: position.x - canvasBounds().x, y: position.y - canvasBounds().y };
  };

  const onResizeStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLeftClick(e)) return;

    const selected = props.selectedComponents.length > 1 ? props.selectedComponents : props.selectedComponents[0];

    if (!Array.isArray(selected)) {
      setTransformOp('resize');
      let currentElementPosition = { x: selected.bounds.left, y: selected.bounds.top };

      const mousePos = positionRelativeToCanvas({ x: e.clientX, y: e.clientY });
      const handle = closestCorner(mousePos, selected.bounds);
      if (handle) {
        setTransformState({
          isTransforming: true,
          startMousePos: {
            x: e.clientX,
            y: e.clientY,
          },
          startElPos: currentElementPosition,
          startSize: selected.size,
          activeHandle: handle,
        });
      }
    } else {
    }
  };

  const onDrawStart = (e: MouseEvent) => {
    if (!isLeftClick(e)) return;
    if (builder.toolState.activeTool === 'pointer' && props.selectedComponents) {
      builder.clearSelection();
      if (selectionRef()) {
        for (const child of Array.from(selectionRef()!.children)) {
          if (child.id) {
            canvasRef()!.appendChild(child);
          }
        }
      }
    }
    if (builder.toolState.drawItem && builder.toolState.activeTool === 'draw') {
      e.preventDefault();
      e.stopPropagation();
      setTransformOp('draw');
      const selected = props.selectedComponents.length > 1 ? props.selectedComponents : props.selectedComponents[0];
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

      setSelectionPosition({ ...screenToSVG(mousePos.x, mousePos.y, canvasRef()!) });
      builder.createNewComponent(newComp);
      builder.selectComponent(newComp.id);
      setTransformState({
        isTransforming: true,
        startMousePos: {
          x: e.clientX,
          y: e.clientY,
        },
        startElPos: mousePos,
        startSize: ZERO_SIZE,
      });
    }
  };

  const onDragStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLeftClick(e)) return;

    const selected = props.selectedComponents.length > 1 ? props.selectedComponents : props.selectedComponents[0];
    if (builder.toolState.activeTool === 'pointer' && selected) {
      setTransformOp('drag');
      setTransformState({
        isTransforming: true,

        startMousePos: {
          x: e.clientX - (selectionRef()?.getBoundingClientRect().x ?? 0),
          y: e.clientY - (selectionRef()?.getBoundingClientRect().y ?? 0),
        },
      });
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

  const onDrag = (e: MouseEvent) => {
    const selected = props.selectedComponents.length > 1 ? props.selectedComponents : props.selectedComponents[0];

    if (transformState.isTransforming) {
      const { activeHandle, startElPos, startMousePos, startSize } = unwrap(transformState);

      if (
        (transformOp() === 'draw' || transformOp() === 'resize') &&
        !Array.isArray(selected) &&
        !Array.isArray(startMousePos)
      ) {
        const newMousePos = { x: e.clientX - startMousePos.x, y: e.clientY - startMousePos.y };
        const { updatedPos, updatedSize } = calculateResize(startSize, startElPos, newMousePos, activeHandle);

        setSelectionPosition({ ...updatedPos });
        builder.updateComponentPosition(selected.id, updatedPos);

        builder.updateComponentSize(selected.id, (p) => {
          const restrictedSize = restrictSize(updatedPos, updatedSize, p);
          setSelectionSize({ ...restrictedSize });
          return { width: restrictedSize.width, height: restrictedSize.height };
        });
      } else if (transformOp() === 'drag' && selected) {
        let newPoint = screenToSVG(e.clientX - startMousePos.x, e.clientY - startMousePos.y, canvasRef()!);
        let newPos = {
          x: clamp(newPoint.x, 0, canvasBounds().width - selectionSize().width),
          y: clamp(newPoint.y, 0, canvasBounds().height - selectionSize().height),
        };

        const currentBounds = {
          left: selectionPosition().x,
          top: selectionPosition().y,
          bottom: selectionPosition().y + selectionSize().height,
          right: selectionPosition().x + selectionSize().width,
        };
        const otherComponents = Object.values(props.components).filter((comp) =>
          Array.isArray(selected) ? selected.includes(comp) : selected.id !== comp.id
        );

        const alignDistance = calculateDistances(
          currentBounds,
          otherComponents.map((v) => v.bounds)
        );
        const xDiff = Math.abs(newPos.x - currentBounds.left);
        if (Math.abs(xDiff + alignDistance.xAlign - 2) < 2) {
          newPos.x = currentBounds.left + alignDistance.xAlign;
        }

        const yDiff = Math.abs(newPos.y - currentBounds.top);
        if (Math.abs(yDiff + alignDistance.yAlign - 2) < 2) {
          newPos.y = currentBounds.top + alignDistance.yAlign;
        }

        setSelectionPosition(newPos);
        if (Array.isArray(selected)) {
          for (const comp of selected) {
            builder.updateComponentPosition(comp.id, newPos);
          }
        } else {
          builder.updateComponentPosition(selected.id, newPos);
        }
      }
    }
  };

  const onMouseUp = () => {
    setTransformState({
      isTransforming: false,
    });
    setTransformOp('draw');
  };

  const selectElement = (id: string) => {
    builder.selectComponent(id);
  };

  createEffect(
    on(
      () => props.selectedComponents,
      (newSelection, oldSelection) => {
        if (selectionRef()) {
          const selected = newSelection.length > 1 ? newSelection : newSelection[0];
          if (Array.isArray(selected)) {
            const newBounds = selected.reduce(
              (acc, curr) => {
                if (curr.bounds.left < acc.x) {
                  acc.x = curr.bounds.left;
                }

                if (curr.bounds.top < acc.y) {
                  acc.y = curr.bounds.top;
                }

                if (curr.size.width > acc.width) {
                  acc.width = curr.size.width;
                }

                if (curr.size.height > acc.height) {
                  acc.height = curr.size.height;
                }

                return acc;
              },
              { ...selectionPosition(), ...ZERO_SIZE }
            );
            setSelectionPosition({ x: newBounds.x, y: newBounds.y });
            setSelectionSize({ width: newBounds.width, height: newBounds.height });
          } else if (selected && !Array.isArray(selected)) {
            setSelectionPosition({ x: selected.bounds.left, y: selected.bounds.top });
            setSelectionSize({ width: selected.size.width, height: selected.size.height });
          }
          for (const comp of newSelection) {
            const id = comp.id;
            const canvasElement = canvasRef()!.getElementById(id);
            if (canvasElement) {
              selectionRef()!.appendChild(canvasElement);
            }
          }

          if (oldSelection) {
            for (const comp of oldSelection) {
              const id = comp.id;

              if (!newSelection.find((v) => v.id === id)) {
                const selectionElement = selectionRef()!.querySelector(`#${id}`);
                if (selectionElement) {
                  canvasRef()?.appendChild(selectionElement);
                }
              }
            }
          }
        }
      }
    )
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
    document.addEventListener('pointermove', onDrag);
    document.addEventListener('pointerup', onMouseUp);
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey) {
        setCtrl(true);
      }
    });
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Control') {
        setCtrl(false);
      }
    });
    onCleanup(() => {
      document.removeEventListener('pointermove', onDrag);
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
        <g ref={setSelectionRef} transform={`translate(${selectionPosition().x} ${selectionPosition().y})`}>
          <g>
            <Show when={props.selectedComponents.length}>
              <rect
                x={0}
                y={0}
                width={selectionSize().width}
                height={selectionSize().height}
                class="outline-blue-6 outline-1 outline-solid"
                fill="none"
              />
              <circle
                cx={0}
                cy={0}
                r={6}
                class={`comp-handle-blue-40 border-white/50 border-1 cursor-nw-resize hover:(border-white border-2) active:(border-white border-2)`}
                onPointerDown={onResizeStart}
              />
              <circle
                cx={selectionSize().width}
                cy={0}
                r={6}
                class={`comp-handle-blue-40 border-white/50 border-1 cursor-ne-resize hover:(border-white border-2) active:(border-white border-2)`}
                onPointerDown={onResizeStart}
              />
              <circle
                cx={0}
                cy={selectionSize().height}
                r={6}
                class={`comp-handle-blue-40 stroke-white/50 stroke-1 cursor-sw-resize hover:(stroke-white stroke-2) active:(stroke-white stroke-2)`}
                onPointerDown={onResizeStart}
              />
              <circle
                cx={selectionSize().width}
                cy={selectionSize().height}
                r={6}
                class={`comp-handle-blue-40 w-3 h-3border-white/50 border-1 cursor-se-resize hover:(border-white border-2) active:(border-white border-2)`}
                onPointerDown={onResizeStart}
              />
            </Show>
          </g>
        </g>

        <For each={Object.values(props.components)}>
          {(comp) => (
            <LayoutComponent
              {...comp}
              active={builder.componentState.selected?.includes(comp.id)}
              selectElement={selectElement}
              variant="outline"
              onResizeStart={onResizeStart}
              onDragStart={onDragStart}
              passThrough={ctrl()}
            />
          )}
        </For>
      </svg>
    </div>
  );
};

export default LayoutCanvas;
