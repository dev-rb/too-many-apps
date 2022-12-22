import { createEffect, createSignal, For, on, onMount } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { Size, XYPosition } from '~/types';
import { clamp } from '~/utils/math';
import { useBuilderContext } from '.';
import LayoutComponent from './Component';
import { calculateResize, createNewComponent, isLeftClick, isPointInBounds } from './utils';

export type TransformOp = 'draw' | 'resize' | 'drag';

const LayoutCanvas = () => {
  const [canvasRef, setCanvasRef] = createSignal<HTMLDivElement>();
  const [canvasBounds, setCanvasBounds] = createSignal({ ...ZERO_POS, ...ZERO_SIZE });
  const builder = useBuilderContext();

  const selectedElement = builder.getSelectedComponent;

  const [transformOp, setTransformOp] = createSignal<TransformOp>('draw');

  const [dragState, setDragState] = createStore({
    startPos: ZERO_POS,
    startElPos: ZERO_POS,
    startSize: ZERO_SIZE,
    isDragging: false,
    activeHandle: 'top-left',
  });

  const positionRelativeToCanvas = (position: XYPosition): XYPosition => {
    return { x: position.x - canvasBounds().x, y: position.y - canvasBounds().y };
  };

  const getActiveHandleByClick = (mousePos: XYPosition, elPosition: XYPosition, elSize: Size) => {
    const distance = {
      top: mousePos.y - elPosition.y,
      left: mousePos.x - elPosition.x,
      right: mousePos.x - elSize.width - elPosition.x,
      bottom: mousePos.y - elSize.height - elPosition.y,
    };

    if (distance.top < 10 && distance.left < 10) {
      return 'top-left';
    } else if (distance.top < 10 && distance.right < 10) {
      return 'top-right';
    } else if (distance.bottom < 10 && distance.left < 10) {
      return 'bottom-left';
    } else if (distance.bottom < 10 && distance.right < 10) {
      return 'bottom-right';
    }
    return 'top-left';
  };

  const onDragStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLeftClick(e)) return;

    if (builder.componentState.selected || builder.toolState.selectedComponent) {
      setDragState({
        isDragging: true,
        startPos: {
          x: e.clientX,
          y: e.clientY,
        },
      });
      if (transformOp() === 'draw' || transformOp() === 'resize') {
        let currentPos = selectedElement()?.position ?? ZERO_POS;
        let currentSize = selectedElement()?.size ?? ZERO_SIZE;
        const startPosition = positionRelativeToCanvas({ x: e.clientX, y: e.clientY });
        let handle = 'top-left';
        if (transformOp() === 'draw') {
          const newComp = createNewComponent(
            builder.toolState.selectedComponent!.name,
            { ...startPosition },
            builder.toolState.selectedComponent!.color,
            undefined,
            selectedElement() ? selectedElement()!.layer + 1 : undefined
          );

          builder.createNewComponent(newComp);
          builder.selectComponent(newComp.id);
          currentPos = startPosition;
          currentSize = ZERO_SIZE;
        }

        if (transformOp() === 'resize') {
          handle = getActiveHandleByClick(startPosition, currentPos, currentSize);
        }

        setDragState((p) => ({
          ...p,
          startElPos: currentPos,
          startSize: currentSize,
          startPos: {
            x: e.clientX,
            y: e.clientY,
          },
          activeHandle: handle,
        }));
        // setDragState((p) => ({ ...p, startElPos: startPosition }));
      } else if (transformOp() === 'drag' && selectedElement()) {
        setDragState((p) => ({
          ...p,
          startPos: { x: e.clientX - selectedElement()!.position.x, y: e.clientY - selectedElement()!.position.y },
        }));
      }
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
    if (dragState.isDragging) {
      const { activeHandle, startElPos, startPos, startSize } = unwrap(dragState);
      const newMousePos = { x: e.clientX - startPos.x, y: e.clientY - startPos.y };
      if (transformOp() === 'draw' || transformOp() === 'resize') {
        const { updatedPos, updatedSize } = calculateResize(startSize, startElPos, newMousePos, activeHandle);

        builder.updateComponentPosition(builder.componentState.selected!, updatedPos);
        builder.updateComponentSize(builder.componentState.selected!, (p) => {
          const restrictedSize = restrictSize(updatedPos, updatedSize, p);
          return { width: restrictedSize.width, height: restrictedSize.height };
        });
      } else if (transformOp() === 'drag' && selectedElement()!) {
        const newPos = {
          x: clamp(e.clientX - dragState.startPos.x, 0, canvasBounds().width - selectedElement()!.size.width),
          y: clamp(e.clientY - dragState.startPos.y, 0, canvasBounds().height - selectedElement()!.size.height),
        };
        builder.updateComponentPosition(selectedElement()!.id, newPos);
      }
    }
  };

  const onMouseUp = () => {
    setDragState({
      isDragging: false,
    });
    setTransformOp('draw');
    // document.removeEventListener('mousemove', onDrag);
    // document.removeEventListener('mouseup', onMouseUp);
  };

  onMount(() => {
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onMouseUp);
  });

  createEffect(
    on(canvasRef, () => {
      if (canvasRef()) {
        const bounds = canvasRef()!.getBoundingClientRect();
        setCanvasBounds({
          x: bounds.left,
          y: bounds.top,
          width: bounds.width,
          height: bounds.height,
        });
      }
    })
  );

  return (
    <div class="flex flex-col w-5xl h-xl mb-20 mx-auto">
      {/* Display header */}
      <div class="w-full h-4 bg-dark-5 flex items-center">
        <div class="ml-auto flex gap-2 mr-2">
          <div class="w-2 h-2 bg-green-7 rounded-full" />
          <div class="w-2 h-2 bg-yellow-7 rounded-full" />
          <div class="w-2 h-2 bg-red-7 rounded-full" />
        </div>
      </div>
      {/* Display */}
      <div ref={setCanvasRef} class="bg-white w-full h-full " onMouseDown={onDragStart}>
        {/* <div
          class="absolute bg-violet-7 w-4 h-4 rounded-full"
          style={{ top: canvasBounds().y + 'px', left: canvasBounds().x + 'px' }}
        /> */}
        <For each={Object.values(builder.componentState.components)}>
          {(comp) => (
            <LayoutComponent
              {...comp}
              active={builder.componentState.selected === comp.id}
              selectElement={builder.selectComponent}
              setTransformOp={setTransformOp}
              currentTransformOp={transformOp()}
              variant="outline"
            />
          )}
        </For>
      </div>
    </div>
  );
};

export default LayoutCanvas;
