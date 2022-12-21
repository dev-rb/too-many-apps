import { createSignal, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { ZERO_POS } from '~/constants';

export const createDrag = (target?: HTMLElement) => {
  const [position, setPosition] = createSignal({ x: 0, y: 0 });

  const [dragState, setDragState] = createStore({
    startPos: ZERO_POS,
    isDragging: false,
  });

  onMount(() => {
    if (target) {
      const bounds = target.getBoundingClientRect();
      setPosition({ x: bounds.x, y: bounds.y });
    }
  });

  const onDragStart = (e: MouseEvent) => {
    setDragState({
      isDragging: true,
      startPos: {
        x: e.clientX - position().x,
        y: e.clientY - position().y,
      },
    });
  };

  const onDrag = (e: MouseEvent) => {
    const newPosX = e.clientX - dragState.startPos.x;
    const newPosY = e.clientY - dragState.startPos.y;

    setPosition({ x: newPosX, y: newPosY });
  };

  const onDragEnd = () => {
    setDragState({
      isDragging: false,
    });
  };

  return [position, { onDrag, onDragStart, onDragEnd }] as const;
};
