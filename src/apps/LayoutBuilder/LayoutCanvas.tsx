import { createEffect, createSignal, For, on, onMount } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { XYPosition } from '~/types';
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
      console.log(transformOp());
      if (transformOp() === 'draw') {
        const startPosition = positionRelativeToCanvas({ x: e.clientX, y: e.clientY });
        const newComp = createNewComponent(
          builder.toolState.selectedComponent!.name,
          { ...startPosition },
          builder.toolState.selectedComponent!.color
        );

        builder.createNewComponent(newComp);
        builder.selectComponent(newComp.id);
      } else if (transformOp() === 'resize' && selectedElement()) {
        const currentPos = positionRelativeToCanvas(selectedElement()!.position);
        const currentSize = selectedElement()!.size;
        let handle = 'top-left';
        console.log(
          currentSize.width - (e.clientX - canvasBounds().x - currentSize.width),
          e.clientX,
          e.clientX - (canvasBounds().x + canvasBounds().width) + selectedElement()!.position.x
        );
        const clickX = e.clientX - currentSize.width;
        const clickY = e.clientY - canvasBounds().y - currentSize.height;

        console.log(e.clientX - currentSize.width, canvasBounds().x);

        if (Math.abs(clickX) < 40 && Math.abs(clickY) < 40) {
          handle = 'top-left';
        } else if (Math.abs(currentSize.width - clickX) < 40 && Math.abs(clickY) < 40) {
          handle = 'top-right';
        } else if (Math.abs(clickX) < 40 && Math.abs(currentSize.height - clickY) < 40) {
          handle = 'bottom-left';
        } else if (
          Math.abs(canvasBounds().width - (currentSize.width - e.clientX)) < 40 &&
          Math.abs(currentSize.height - clickY) < 40
        ) {
          handle = 'bottom-right';
        }
        console.log(handle);
        setDragState((p) => ({ ...p, startPos: currentPos, startSize: currentSize, activeHandle: handle }));
      } else if (transformOp() === 'drag' && selectedElement()) {
        console.log('drag state');
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

        const previousSize = startSize;
        if (updatedPos.x < 0) {
          newWidth = previousSize.width;
        } else if (Math.floor(builder.componentState.displayBounds.width - (updatedPos.x + newWidth)) < 0) {
          newWidth = builder.componentState.displayBounds.width - updatedPos.x;
        }
        if (updatedPos.y < 0) {
          newHeight = previousSize.height;
        } else if (Math.floor(builder.componentState.displayBounds.height - (updatedPos.y + newHeight)) < 0) {
          newHeight = builder.componentState.displayBounds.height - updatedPos.y;
        }
        builder.updateComponentSize(selectedElement()!.id, { width: newWidth, height: newHeight });
        builder.updateComponentPosition(selectedElement()!.id, updatedPos);
      } else if (transformOp() === 'drag' && selectedElement()!) {
        builder.updateComponentPosition(selectedElement()!.id, newMousePos);
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
      <div ref={setCanvasRef} class="bg-white w-full h-full" onMouseDown={onDragStart}>
        <For each={Object.values(builder.componentState.components)}>
          {(comp) => (
            <LayoutComponent
              {...comp}
              active={builder.componentState.selected === comp.id}
              selectElement={builder.selectComponent}
              setTransformOp={setTransformOp}
              currentTransformOp={transformOp()}
            />
          )}
        </For>
      </div>
    </div>
  );
};

export default LayoutCanvas;
