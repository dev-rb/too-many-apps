import { createEffect, createSignal, on, onCleanup, onMount } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { Size, XYPosition } from '~/types';
import { calculateResize, isLeftClick, isPointInBounds } from './utils';

interface TransformableToggles {
  canTransform?: boolean | (() => boolean);
}

export const createTransformable = (parentBounds: Size & XYPosition, canTransform?: boolean | (() => boolean)) => {
  const [element, setElement] = createSignal<HTMLElement>();

  const [elementBounds, setElementBounds] = createSignal({ x: 0, y: 0, width: 0, height: 0 }, { equals: false });

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

  const updateElementBounds = () => {
    if (element()) {
      const bounds = element()!.getBoundingClientRect();
      setElementBounds({
        x: bounds.left - parentBounds.x,
        y: bounds.top - parentBounds.y,
        width: bounds.width,
        height: bounds.height,
      });
    }
  };

  createEffect(
    on(element, () => {
      updateElementBounds();
    })
  );

  const startResize = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLeftClick(e)) return;
    const canResize = canTransform ? (typeof canTransform === 'function' ? canTransform() : canTransform) : true;
    if (canResize) {
      updateElementBounds();
      const currentPosition = { x: elementBounds().x, y: elementBounds().y };
      const currentSize = { width: elementBounds().width, height: elementBounds().height };

      const clickX = e.clientX - parentBounds.x - currentPosition.x;
      const clickY = e.clientY - parentBounds.y - currentPosition.y;

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

      let newWidth = Math.abs(updatedSize.width);
      let newHeight = Math.abs(updatedSize.height);

      const previousSize = { width: elementBounds().width, height: elementBounds().height };
      if (updatedPos.x < 0) {
        newWidth = previousSize.width;
      } else if (Math.floor(parentBounds.width - (updatedPos.x + newWidth)) < 0) {
        newWidth = parentBounds.width - updatedPos.x;
      }
      if (updatedPos.y < 0) {
        newHeight = previousSize.height;
      } else if (Math.floor(parentBounds.height - (updatedPos.y + newHeight)) < 0) {
        newHeight = parentBounds.height - updatedPos.y;
      }

      setElementBounds({
        x: Math.max(0, Math.round(updatedPos.x)),
        y: Math.max(0, Math.round(updatedPos.y)),
        width: Math.round(newWidth),
        height: Math.round(newHeight),
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

  return [elementBounds, { startResize, setElement }] as const;
};
