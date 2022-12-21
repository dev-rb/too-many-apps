import { createEffect, createSignal, on } from 'solid-js';
import { createStore } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { XYPosition } from '~/types';
import { isLeftClick, isPointInBounds } from './utils';
interface TransformableHandlers {
  onDrawStart: (startPosition: XYPosition) => void;
}

export const createDrawable = (canDraw?: boolean | (() => boolean), handlers?: TransformableHandlers) => {
  const [parentElement, setParentElement] = createSignal<HTMLElement>();
  const [dragState, setDragState] = createStore({
    startPos: ZERO_POS,
    isDragging: false,
  });
  const [elementBounds, setElementBounds] = createSignal({ x: 0, y: 0, width: 0, height: 0 }, { equals: false });
  const [parentBounds, setParentBounds] = createSignal({ x: 0, y: 0, width: 0, height: 0 }, { equals: false });

  createEffect(
    on(parentElement, () => {
      if (parentElement()) {
        const bounds = parentElement()!.getBoundingClientRect();
        setParentBounds({ x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height });
      }
    })
  );

  const onDrawStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLeftClick(e)) return;
    const canStart = canDraw ? (typeof canDraw === 'function' ? canDraw() : canDraw) : true;
    if (canStart) {
      setDragState({
        isDragging: true,
        startPos: {
          x: e.clientX,
          y: e.clientY,
        },
      });
      handlers?.onDrawStart({ x: e.clientX - parentBounds().x, y: e.clientY - parentBounds().y });
      setElementBounds({
        ...ZERO_SIZE,
        x: e.clientX - parentBounds().x,
        y: e.clientY - parentBounds().y,
      });

      document.addEventListener('mousemove', onDraw);
      document.addEventListener('mouseup', onMouseUp);
    }
  };

  const onDraw = (e: MouseEvent) => {
    e.preventDefault();

    if (dragState.isDragging) {
      const startPos = dragState.startPos;
      const newWidth = e.clientX - startPos.x;
      const newHeight = e.clientY - startPos.y;

      const distanceToLeft = e.clientX - parentBounds().x;
      const distanceToTop = e.clientY - parentBounds().y;

      const inBounds = isPointInBounds(
        { x: distanceToLeft, y: distanceToTop },
        { x: parentBounds().width, y: parentBounds().height }
      );

      setElementBounds((p) => ({
        ...p,
        x: inBounds.x && newWidth < 0 ? distanceToLeft : p.x,
        y: inBounds.y && newHeight < 0 ? distanceToTop : p.y,
        width: inBounds.x ? Math.abs(newWidth) : p.width,
        height: inBounds.y ? Math.abs(newHeight) : p.height,
      }));
    }
  };
  const onMouseUp = () => {
    setDragState({
      isDragging: false,
    });
    document.removeEventListener('mousemove', onDraw);
    document.removeEventListener('mouseup', onMouseUp);
  };

  return [elementBounds, { onDrawStart, setParentElement }] as const;
};
