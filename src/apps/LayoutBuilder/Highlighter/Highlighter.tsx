import { createSignal, onCleanup, onMount, ParentComponent } from 'solid-js';
import { createStore } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { Bounds } from '~/types';
import { ILayoutComponent, useBuilder } from '..';
import { calculateResize, isInside } from '../utils';

export const Highlighter = () => {
  const builder = useBuilder();
  const [ref, setRef] = createSignal<HTMLDivElement>();

  const [position, setPosition] = createSignal(ZERO_POS);
  const [size, setSize] = createSignal(ZERO_SIZE);
  const [visible, setVisible] = createSignal(false);
  const [canvasBounds, setCanvasBounds] = createSignal({ ...ZERO_POS, ...ZERO_SIZE });

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
      const canvasRight = canvasBounds().x + canvasBounds().width;
      const canvasBottom = canvasBounds().y + canvasBounds().height;
      const selfRight = e.clientX - canvasBounds().x;
      const selfBottom = e.clientY - canvasBounds().y;
      // const bounds: Bounds = {
      //   top: dragState.startMousePos.y - canvasBounds().y,
      //   left: dragState.startMousePos.x - canvasBounds().x,
      //   right: e.clientX - canvasRight,
      //   bottom: e.clientY - canvasBottom,
      // };
      const bounds: Bounds = {
        top: updatedPos.y - canvasBounds().y,
        left: updatedPos.x - canvasBounds().x,
        right: selfRight + Math.abs(updatedSize.width),
        bottom: selfBottom + Math.abs(updatedSize.height),
      };
      const insideComponents = Object.values(builder.componentState.components).reduce((acc, comp) => {
        console.log(comp.bounds, bounds);
        if (isInside(comp.bounds, bounds)) {
          console.log('inside');
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
    const bounds = document.getElementById('canvas')!.getBoundingClientRect();
    console.log(bounds);
    setCanvasBounds({
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
