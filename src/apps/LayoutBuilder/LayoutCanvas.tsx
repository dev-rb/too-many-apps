import { createEffect, createSignal, For, on, onCleanup, onMount } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import type { Size, XYPosition } from '~/types';
import { clamp } from '~/utils/math';
import { ILayoutComponent, useBuilder } from '.';
import LayoutComponent from './Component';
import { calculateDistances } from './snapping';
import { calculateResize, closestCorner, createNewComponent, isLeftClick } from './utils';

export type TransformOp = 'draw' | 'resize' | 'drag';

interface LayoutCanvasProps {
  components: { [key: string]: ILayoutComponent };
  selectedComponent: ILayoutComponent | undefined;
}

const LayoutCanvas = (props: LayoutCanvasProps) => {
  const [canvasRef, setCanvasRef] = createSignal<HTMLDivElement>();
  const [canvasBounds, setCanvasBounds] = createSignal({ ...ZERO_POS, ...ZERO_SIZE });
  const builder = useBuilder();

  const [transformOp, setTransformOp] = createSignal<TransformOp>('draw');

  const [transformState, setTransformState] = createStore({
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

    const selected = props.selectedComponent;

    if (selected) {
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
    }
  };

  const onDrawStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLeftClick(e)) return;
    if (builder.toolState.activeTool === 'pointer' && props.selectedComponent) {
      builder.clearSelection();
    }
    if (builder.toolState.drawItem && builder.toolState.activeTool === 'draw') {
      setTransformOp('draw');
      const drawable = builder.getDrawable(builder.toolState.drawItem!);
      const mousePos = positionRelativeToCanvas({ x: e.clientX, y: e.clientY });
      const newComp = createNewComponent({
        name: drawable?.name,
        bounds: {
          top: mousePos.y,
          left: mousePos.x,
          right: mousePos.x,
          bottom: mousePos.y,
        },
        color: drawable?.color,
        layer: props.selectedComponent ? props.selectedComponent!.layer + 1 : undefined,
      });

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

    const selected = props.selectedComponent;
    if (builder.toolState.activeTool === 'pointer' && selected) {
      setTransformOp('drag');
      setTransformState({
        isTransforming: true,

        startMousePos: {
          x: e.clientX - selected.bounds.left,
          y: e.clientY - selected.bounds.top,
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
    const selected = props.selectedComponent;
    if (transformState.isTransforming && selected) {
      const { activeHandle, startElPos, startMousePos, startSize } = unwrap(transformState);
      const newMousePos = { x: e.clientX - startMousePos.x, y: e.clientY - startMousePos.y };

      if (transformOp() === 'draw' || transformOp() === 'resize') {
        const { updatedPos, updatedSize } = calculateResize(startSize, startElPos, newMousePos, activeHandle);

        builder.updateComponentPosition(selected.id, updatedPos);

        builder.updateComponentSize(selected.id, (p) => {
          const restrictedSize = restrictSize(updatedPos, updatedSize, p);
          return { width: restrictedSize.width, height: restrictedSize.height };
        });
      } else if (transformOp() === 'drag' && selected) {
        let newPos = {
          x: clamp(e.clientX - transformState.startMousePos.x, 0, canvasBounds().width - selected.size.width),
          y: clamp(e.clientY - transformState.startMousePos.y, 0, canvasBounds().height - selected.size.height),
        };

        const currentBounds = selected.bounds;
        const otherComponents = Object.values(props.components).filter((comp) => comp.id !== selected.id);

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
        builder.updateComponentPosition(selected.id, newPos);
      }
    }
  };

  const onMouseUp = () => {
    setTransformState({
      isTransforming: false,
    });
    setTransformOp('draw');
  };

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
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onMouseUp);
    onCleanup(() => {
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', onMouseUp);
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
      <div ref={setCanvasRef} class="bg-white w-full h-full " onMouseDown={onDrawStart}>
        {/* <div
          class="absolute bg-violet-7 w-4 h-4 rounded-full"
          style={{ top: canvasBounds().y + 'px', left: canvasBounds().x + 'px' }}
        /> */}
        <For each={Object.values(props.components)}>
          {(comp) => (
            <LayoutComponent
              {...comp}
              active={builder.componentState.selected === comp.id}
              selectElement={builder.selectComponent}
              variant="outline"
              onResizeStart={onResizeStart}
              onDragStart={onDragStart}
            />
          )}
        </For>
      </div>
    </div>
  );
};

export default LayoutCanvas;
