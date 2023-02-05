import { createMemo, createSignal, JSX, onCleanup, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { Bounds } from '~/types';
import { useBuilder } from '.';
import { calculateResize, isInside } from './utils';

const excludeNodes = ['#css-editor'];

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
    if (
      e.defaultPrevented ||
      excludeNodes.some((node) => {
        const nodeEl = document.querySelector(node);
        return nodeEl && e.composedPath().includes(nodeEl);
      })
    )
      return;
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

    document.addEventListener('mousemove', (e) =>
      requestAnimationFrame(() => {
        if (raf() && dragState.isDragging) {
          onMouseMove(e);
        }
      })
    );
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    e.stopPropagation();
    if (dragState.isDragging) {
      setRaf(true);
      const newMousePos = { x: e.clientX - dragState.startMousePos.x, y: e.clientY - dragState.startMousePos.y };

      const {
        left: x,
        top: y,
        width,
        height,
      } = calculateResize(
        {
          ...dragState.size,
          left: dragState.startElPos.x,
          top: dragState.startElPos.y,
          right: dragState.startElPos.x + dragState.size.width,
          bottom: dragState.startElPos.y + dragState.size.height,
        },
        newMousePos,
        'top-left'
      );
      setSelfState((p) => ({
        ...p,
        position: { x, y },
        size: { width: Math.abs(width), height: Math.abs(height) },
      }));
      const bounds: Bounds = {
        top: y - canvasBounds().y,
        left: x - canvasBounds().x + selfState.offsetPosition.x,
        right: x - canvasBounds().x + selfState.offsetPosition.x + Math.abs(width),
        bottom: y - canvasBounds().y + Math.abs(height),
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

  const [raf, setRaf] = createSignal(true);

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
    document.removeEventListener('mousemove', (e) =>
      requestAnimationFrame(() => {
        if (raf() && dragState.isDragging) {
          setRaf(false);
          onMouseMove(e);
        }
      })
    );
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

  const translate = createMemo(() => {
    return `translate3d(${selfState.position.x}px, ${selfState.position.y}px, 0) scale3d(${
      selfState.size.width / window.outerWidth
    }, ${selfState.size.height / window.outerHeight}, 1)`;
  });

  return (
    <div
      ref={setRef}
      class="bg-blue-7/40 border-blue-5 border-1 fixed"
      classList={{
        'opacity-0': !selfState.visible,
      }}
      style={{
        transform: translate(),
        width: `${window.outerWidth}px`,
        height: `${window.outerHeight}px`,
        'transform-origin': 'top left',
      }}
    ></div>
  );
};
