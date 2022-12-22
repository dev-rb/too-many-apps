import { createEffect, createSignal, For, on, onMount } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { XYPosition } from '~/types';
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
      if (transformOp() === 'draw') {
        const startPosition = positionRelativeToCanvas({ x: e.clientX, y: e.clientY });
        const newComp = createNewComponent(
          builder.toolState.selectedComponent!.name,
          { ...startPosition },
          builder.toolState.selectedComponent!.color,
          undefined,
          selectedElement() ? selectedElement()!.layer + 1 : undefined
        );

        builder.createNewComponent(newComp);
        builder.selectComponent(newComp.id);
      } else if (transformOp() === 'resize' && selectedElement()) {
        const currentPos = selectedElement()!.position;
        const currentSize = selectedElement()!.size;

        const clickX = e.clientX - canvasBounds().x;
        const clickY = e.clientY - canvasBounds().y;

        const distance = {
          top: clickY - currentPos.y,
          left: clickX - currentPos.x,
          right: clickX - currentSize.width - currentPos.x,
          bottom: clickY - currentSize.height - currentPos.y,
        };

        let handle = 'top-left';

        if (distance.top < 10 && distance.left < 10) {
          handle = 'top-left';
        } else if (distance.top < 10 && distance.right < 10) {
          handle = 'top-right';
        } else if (distance.bottom < 10 && distance.left < 10) {
          handle = 'bottom-left';
        } else if (distance.bottom < 10 && distance.right < 10) {
          handle = 'bottom-right';
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
      } else if (transformOp() === 'drag' && selectedElement()) {
        setDragState((p) => ({
          ...p,
          startPos: { x: e.clientX - selectedElement()!.position.x, y: e.clientY - selectedElement()!.position.y },
        }));
      }
    }
  };

  const onDrag = (e: MouseEvent) => {
    if (dragState.isDragging) {
      const { activeHandle, startElPos, startPos, startSize } = unwrap(dragState);
      const newMousePos = { x: e.clientX - startPos.x, y: e.clientY - startPos.y };
      if (transformOp() === 'draw') {
        const newSize = positionRelativeToCanvas({ x: e.clientX, y: e.clientY });
        const inBounds = isPointInBounds(newSize, { x: canvasBounds().width, y: canvasBounds().height });

        builder.updateComponentPosition(builder.componentState.selected!, (p) => ({
          x: inBounds.x && newMousePos.x < 0 ? newSize.x : p.x,
          y: inBounds.y && newMousePos.y < 0 ? newSize.y : p.y,
        }));
        builder.updateComponentSize(builder.componentState.selected!, (p) => ({
          width: inBounds.x ? Math.abs(newMousePos.x) : p.width,
          height: inBounds.y ? Math.abs(newMousePos.y) : p.height,
        }));
      } else if (transformOp() === 'resize' && selectedElement()) {
        const { updatedPos, updatedSize } = calculateResize(startSize, startElPos, newMousePos, activeHandle);
        let newWidth = Math.abs(updatedSize.width);
        let newHeight = Math.abs(updatedSize.height);

        builder.updateComponentSize(selectedElement()!.id, (p) => {
          if (updatedPos.x < 0) {
            newWidth = p.width;
          } else if (Math.floor(canvasBounds().width - (updatedPos.x + newWidth)) < 0) {
            newWidth = canvasBounds().width - updatedPos.x;
          }
          if (updatedPos.y < 0) {
            newHeight = p.height;
          } else if (Math.floor(canvasBounds().height - (updatedPos.y + newHeight)) < 0) {
            newHeight = canvasBounds().height - updatedPos.y;
          }
          return { width: newWidth, height: newHeight };
        });
        builder.updateComponentPosition(selectedElement()!.id, updatedPos);
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
