import { createSignal, onCleanup, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { Bounds } from '~/types';
import { useBuilder } from '.';
import { calculateResize, isInside } from './utils';

export const Highlighter = () => {
  const builder = useBuilder();
  const [ref, setRef] = createSignal<HTMLDivElement>();

  const [selfState, setSelfState] = createStore({
    visible: false,
    position: ZERO_POS,
    size: ZERO_SIZE,
    offsetPosition: ZERO_POS,
  });

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

    setDragState({
      isDragging: true,
      startMousePos: {
        x: e.clientX,
        y: e.clientY,
      },
      startElPos: {
        x: e.clientX - selfState.offsetPosition.x,
        y: e.clientY - selfState.offsetPosition.y,
      },
      size: ZERO_SIZE,
    });

    setSelfState({
      visible: true,
      position: {
        x: e.clientX - selfState.offsetPosition.x,
        y: e.clientY - selfState.offsetPosition.y,
      },
    });

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

      setSelfState((p) => ({
        ...p,
        position: updatedPos,
        size: { width: Math.abs(updatedSize.width), height: Math.abs(updatedSize.height) },
      }));

      const bounds: Bounds = {
        top: updatedPos.y - canvasBounds().y,
        left: updatedPos.x - canvasBounds().x + selfState.offsetPosition.x,
        right: dragState.startMousePos.x + Math.abs(updatedSize.width) - canvasBounds().x,
        bottom: dragState.startMousePos.y + Math.abs(updatedSize.height) - canvasBounds().y,
      };

      const insideComponents = Object.values(builder.componentState.components).reduce((acc, comp) => {
        let compBounds = document.getElementById(comp.id)!.getBoundingClientRect();
        compBounds = {
          ...compBounds,
          left: compBounds.left - canvasBounds().x,
          top: compBounds.top - canvasBounds().y,
          right: comp.size.width + (compBounds.left - canvasBounds().x),
          bottom: comp.size.height + (compBounds.top - canvasBounds().y),
        };
        if (isInside({ ...compBounds }, bounds)) {
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
    setSelfState({
      position: ZERO_POS,
      size: ZERO_SIZE,
      visible: false,
    });
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

    if (ref()) {
      const bounds = ref()!.getBoundingClientRect();
      setSelfState('offsetPosition', {
        x: bounds.left,
        y: bounds.top,
      });
    }

    document.addEventListener('mousedown', onMouseDown);

    onCleanup(() => {
      document.removeEventListener('mousedown', onMouseDown);
    });
  });

  const translate = () => {
    return `translate(${selfState.position.x}px, ${selfState.position.y}px)`;
  };

  return (
    <div
      ref={setRef}
      class="bg-blue-7/40 border-blue-5 border-1 fixed"
      classList={{
        'opacity-0': !selfState.visible,
      }}
      style={{
        transform: translate(),
        width: `${selfState.size.width}px`,
        height: `${selfState.size.height}px`,
      }}
    ></div>
  );
};
