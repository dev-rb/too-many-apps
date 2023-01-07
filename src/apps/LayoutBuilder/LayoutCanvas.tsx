import { createEffect, createSignal, For, on, onCleanup, onMount, Show } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import type { Bounds, Size, XYPosition } from '~/types';
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
  startElPos: XYPosition[];
  startSize: Size[];
  startSelectionSize: Size;
  startSelectionPos: XYPosition;
  isTransforming: boolean;
  activeHandle: string;
}

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

const LayoutCanvas = (props: LayoutCanvasProps) => {
  const [canvasRef, setCanvasRef] = createSignal<SVGSVGElement>();
  const [selectionRef, setSelectionRef] = createSignal<SVGGElement>();
  const [canvasBounds, setCanvasBounds] = createSignal({ ...ZERO_POS, ...ZERO_SIZE });
  const builder = useBuilder();

  const [transformOp, setTransformOp] = createSignal<TransformOp>('draw');
  const [selectionPosition, setSelectionPosition] = createSignal(ZERO_POS, { equals: false });
  const [selectionSize, setSelectionSize] = createSignal(ZERO_SIZE, { equals: false });

  const [mutationObserver, setMutationObserver] = createSignal<MutationObserver>();

  const [ctrl, setCtrl] = createSignal(false);

  const [transformState, setTransformState] = createStore<TransformState>({
    startMousePos: ZERO_POS,
    startElPos: [ZERO_POS],
    startSelectionPos: ZERO_POS,
    startSize: [ZERO_SIZE],
    startSelectionSize: ZERO_SIZE,
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

    if (selected) {
      setTransformOp('resize');
      let currentElementPosition = selectionPosition();

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
          startSelectionPos: currentElementPosition,
          startElPos: props.selectedComponents.map((v) => {
            const bounds = document.getElementById(v.id)!.getBoundingClientRect();
            return { x: bounds.left - canvasBounds().x, y: bounds.top - canvasBounds().y };
          }),
          startSize: props.selectedComponents.map((v) => v.size),
          startSelectionSize: selectionSize(),
          activeHandle: handle,
        });
      }
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
        startSelectionPos: mousePos,
        startSize: [ZERO_SIZE],
        startSelectionSize: ZERO_SIZE,
      });
    }
  };

  const onDragStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLeftClick(e)) return;

    const selected = props.selectedComponents.length > 1 ? props.selectedComponents : props.selectedComponents[0];
    if (builder.toolState.activeTool === 'pointer' && selected) {
      const mousePos = positionRelativeToCanvas({ x: e.clientX, y: e.clientY });
      setTransformOp('drag');
      setTransformState({
        isTransforming: true,
        startElPos: props.selectedComponents.map((v) => {
          return { x: e.clientX - v.bounds.left, y: e.clientY - v.bounds.top };
        }),
        startMousePos: {
          x: e.clientX - selectionPosition().x,
          y: e.clientY - selectionPosition().y,
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
      worker.postMessage({
        mouseDrag: true,
        mousePos: JSON.parse(JSON.stringify({ clientX: e.clientX, clientY: e.clientY })),
        transformState: JSON.parse(JSON.stringify(unwrap(transformState))),
        transformOp: transformOp(),
        selectedComponents: JSON.parse(JSON.stringify([...props.selectedComponents])),
        currentSelection: JSON.parse(JSON.stringify({ position: selectionPosition(), size: selectionSize() })),
        canvasBounds: JSON.parse(JSON.stringify(canvasBounds())),
      });
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

  const evaluteSelection = () => {
    const newBounds = props.selectedComponents.reduce(
      (acc, curr) => {
        if (curr.bounds.left < acc.x) {
          acc.x = curr.bounds.left;
        }

        if (curr.bounds.top < acc.y) {
          acc.y = curr.bounds.top;
        }

        if (curr.bounds.right > acc.right) {
          acc.right = curr.bounds.right;
        }

        if (curr.bounds.bottom > acc.bottom) {
          acc.bottom = curr.bounds.bottom;
        }

        return acc;
      },
      { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER, right: 0, bottom: 0 }
    );

    setSelectionPosition({ x: newBounds.x, y: newBounds.y });
    setSelectionSize({ width: newBounds.right - newBounds.x, height: newBounds.bottom - newBounds.y });
  };

  const mutationUpdate: MutationCallback = (mutations, observer) => {
    for (const mutation of mutations) {
      // evaluteSelection();
      // builder.updateTree(
      //   (mutation.target as Element).id,
      //   builder.componentState.components[(mutation.target as Element).id].bounds
      // );
    }
  };

  createEffect(
    on(
      () => props.selectedComponents,
      (newSelection) => {
        if (!newSelection.length) {
          setSelectionPosition(ZERO_POS);
          setSelectionSize(ZERO_SIZE);
          return;
        }
        evaluteSelection();
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
    worker.addEventListener('message', (ev) => {
      if (Object.hasOwn(ev.data, 'copy')) {
        // console.log(ev.data);
        if (ev.data.selection) {
          setSelectionPosition({ x: ev.data.selection.x, y: ev.data.selection.y });
          setSelectionSize({ width: ev.data.selection.width, height: ev.data.selection.height });
        }

        for (const comp of ev.data.copy) {
          // builder.updateTree(comp.id, {
          //   left: comp.bounds.left,
          //   top: comp.bounds.top,
          //   right: comp.bounds.left + comp.size.width,
          //   bottom: comp.bounds.top + comp.size.height,
          // });
          builder.updateComponentPosition(comp.id, { x: comp.bounds.left, y: comp.bounds.top });
          builder.updateComponentSize(comp.id, { width: comp.size.width, height: comp.size.height });
        }
      }
    });
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Control') {
        setCtrl(false);
      }
    });

    // setMutationObserver(new MutationObserver(mutationUpdate));

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

  const observeComponent = (element: Element) => {
    mutationObserver()?.observe(element, { attributes: true });
  };

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
        <svg
          ref={setSelectionRef}
          x={selectionPosition().x}
          y={selectionPosition().y}
          width={selectionSize().width}
          height={selectionSize().height}
          style={{ overflow: 'visible' }}
        >
          <g>
            <Show when={props.selectedComponents.length}>
              <rect x={0} y={0} width="100%" height="100%" class="outline-blue-6 outline-1 outline-solid" fill="none" />
              <circle
                cx={0}
                cy={0}
                r={6}
                class={`comp-handle-blue-40 stroke-white/50 stroke-1 cursor-nw-resize hover:(fill-blue-6)`}
                onPointerDown={onResizeStart}
              />
              <circle
                cx={'100%'}
                cy={0}
                r={6}
                class={`comp-handle-blue-40 stroke-white/50 stroke-1 cursor-ne-resize hover:(fill-blue-6)`}
                onPointerDown={onResizeStart}
              />
              <circle
                cx={0}
                cy={'100%'}
                r={6}
                class={`comp-handle-blue-40 stroke-white/50 stroke-1 cursor-sw-resize hover:(fill-blue-6)`}
                onPointerDown={onResizeStart}
              />
              <circle
                cx={'100%'}
                cy={'100%'}
                r={6}
                class={`comp-handle-blue-40 stroke-white/50 stroke-1 cursor-se-resize hover:(fill-blue-6)`}
                onPointerDown={onResizeStart}
              />
            </Show>
          </g>
        </svg>

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
              observe={observeComponent}
            />
          )}
        </For>
      </svg>
    </div>
  );
};

export default LayoutCanvas;
