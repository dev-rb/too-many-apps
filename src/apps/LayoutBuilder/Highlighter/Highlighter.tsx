import { createSignal, onCleanup, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { Bounds } from '~/types';
import { useBuilder } from '..';
import { calculateResize, isInside } from '../utils';

export const Highlighter = () => {
  const builder = useBuilder();
  const [ref, setRef] = createSignal<HTMLDivElement>();

  const [position, setPosition] = createSignal(ZERO_POS);
  const [size, setSize] = createSignal(ZERO_SIZE);
  const [visible, setVisible] = createSignal(false);
  const [canvasBounds, setCanvasBounds] = createSignal({ ...ZERO_POS, ...ZERO_SIZE });
  const [initBounds, setInitBounds] = createSignal({ ...ZERO_POS, ...ZERO_SIZE });

  const [dragState, setDragState] = createStore({
    isDragging: false,
    startMousePos: ZERO_POS,
    startElPos: ZERO_POS,
    size: ZERO_SIZE,
  });

  const onMouseDown = (e: MouseEvent) => {
    if (e.defaultPrevented) return;
    e.preventDefault();
    e.stopPropagation();
    console.log('highlighter');
    setDragState({
      isDragging: true,
      startMousePos: {
        x: e.clientX,
        y: e.clientY,
      },
      startElPos: {
        x: e.clientX - ref()!.getBoundingClientRect().left,
        y: e.clientY - ref()!.getBoundingClientRect().top,
      },
      size: ZERO_SIZE,
    });
    setPosition({
      x: e.clientX - ref()!.getBoundingClientRect().left,
      y: e.clientY - ref()!.getBoundingClientRect().top,
    });
    setVisible(true);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    e.stopPropagation();
    if (dragState.isDragging) {
      const newMousePos = { x: e.clientX - dragState.startMousePos.x, y: e.clientY - dragState.startMousePos.y };

      const { updatedPos, updatedSize } = calculateResize(
        dragState.size,
        dragState.startElPos,
        newMousePos,
        'top-left'
      );

      setPosition({ ...updatedPos });
      setSize({ width: Math.abs(updatedSize.width), height: Math.abs(updatedSize.height) });

      const bounds: Bounds = {
        top: updatedPos.y - canvasBounds().y,
        left: updatedPos.x - canvasBounds().x + initBounds().x,
        right: dragState.startMousePos.x + Math.abs(updatedSize.width) - canvasBounds().x,
        bottom: dragState.startMousePos.y + Math.abs(updatedSize.height) - canvasBounds().y,
      };

      const insideComponents = Object.values(builder.componentState.components).reduce((acc, comp) => {
        if (isInside(comp.bounds, bounds)) {
          acc.push(comp.id);
        }
        return acc;
      }, [] as string[]);

      builder.selectMultipleComponents(insideComponents);
    }
  };

  const reset = () => {
    setDragState({
      isDragging: false,
      startMousePos: ZERO_POS,
      startElPos: ZERO_POS,
      size: ZERO_SIZE,
    });
    setPosition(ZERO_POS);
    setSize(ZERO_SIZE);
    setVisible(false);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  const onMouseUp = () => {
    reset();
  };

  onMount(() => {
    const canvasBounds = document.getElementById('canvas')!.getBoundingClientRect();
    setCanvasBounds({
      x: canvasBounds.left,
      y: canvasBounds.top,
      width: canvasBounds.width,
      height: canvasBounds.height,
    });
    const bounds = ref()!.getBoundingClientRect();
    setInitBounds({
      x: bounds.left,
      y: bounds.top,
      width: bounds.width,
      height: bounds.height,
    });

    document.addEventListener('mousedown', onMouseDown);

    onCleanup(() => {
      document.removeEventListener('mousedown', onMouseDown);
    });
  });

  const translate = () => {
    return `translate(${position().x}px, ${position().y}px)`;
  };

  return (
    <div
      ref={setRef}
      class="bg-blue-7/40 border-blue-5 border-1 fixed"
      classList={{
        'opacity-0': !visible(),
      }}
      style={{
        transform: translate(),
        width: `${size().width}px`,
        height: `${size().height}px`,
      }}
    ></div>
  );
};
