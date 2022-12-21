import { createEffect, createSignal, on, onCleanup, onMount } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { Size, XYPosition } from '~/types';
import { calculateResize, isLeftClick, isPointInBounds } from './utils';

interface TransformableToggles {
  canTransform?: boolean | (() => boolean);
}

export const createTransformable = (canTransform?: boolean | (() => boolean)) => {
  const [element, setElement] = createSignal<HTMLElement>();

  const [elementBounds, setElementBounds] = createSignal({ x: 0, y: 0, width: 0, height: 0 });

  const [dragState, setDragState] = createStore({
    startPos: ZERO_POS,
    startElPos: ZERO_POS,
    startSize: ZERO_SIZE,
    isDragging: false,
    activeHandle: 'top-left',
  });

  onMount(() => {
    document.addEventListener('mouseup', onMouseUp);
    onCleanup(() => {
      document.removeEventListener('mousemove', onResize);
      document.removeEventListener('mouseup', onMouseUp);
    });
  });

  const getBounds = () => {
    const bounds = element()!.getBoundingClientRect();
    return bounds;
  };

  const onResizeStart = (e: MouseEvent, offset: XYPosition = ZERO_POS) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLeftClick(e)) return;
    const canResize = canTransform ? (typeof canTransform === 'function' ? canTransform() : canTransform) : true;
    if (canResize) {
      const currentElementBounds = getBounds();
      const currentPosition = { x: currentElementBounds.x - offset.x, y: currentElementBounds.y - offset.y };
      const currentSize = { width: currentElementBounds.width, height: currentElementBounds.height };

      const clickX = e.clientX - offset.x - currentPosition.x;
      const clickY = e.clientY - offset.y - currentPosition.y;

      let handle = 'top-left';

      if (Math.abs(clickX) < 10 && Math.abs(clickY) < 10) {
        handle = 'top-left';
      } else if (Math.abs(currentSize.width - clickX) < 10 && Math.abs(clickY) < 10) {
        handle = 'top-right';
      } else if (Math.abs(clickX) < 10 && Math.abs(currentSize.height - clickY) < 10) {
        handle = 'bottom-left';
      } else if (Math.abs(currentSize.width - clickX) < 10 && Math.abs(currentSize.height - clickY) < 10) {
        handle = 'bottom-right';
      }
      setDragState({
        isDragging: true,
        startElPos: currentPosition,
        startPos: {
          x: e.clientX,
          y: e.clientY,
        },
        startSize: currentSize,
        activeHandle: handle,
      });

      document.addEventListener('mousemove', onResize);
      document.addEventListener('mouseup', onMouseUp);
    }
  };

  const onResize = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragState.isDragging) {
      const { activeHandle, startElPos, startPos, startSize } = unwrap(dragState);
      const newMousePos = { x: e.clientX - startPos.x, y: e.clientY - startPos.y };

      const { updatedPos, updatedSize } = calculateResize(startSize, startElPos, newMousePos, activeHandle);
      setElementBounds({
        x: updatedPos.x,
        y: updatedPos.y,
        width: updatedSize.width,
        height: updatedSize.height,
      });
    }
  };

  const onMouseUp = () => {
    setDragState({
      isDragging: false,
    });
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', onMouseUp);
  };

  return [elementBounds, { onResizeStart, setElement }] as const;
};
