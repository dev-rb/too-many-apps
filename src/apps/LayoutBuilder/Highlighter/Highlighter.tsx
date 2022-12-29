import { createSignal, onCleanup, onMount, ParentComponent } from 'solid-js';
import { createStore } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { calculateResize } from '../utils';
import { useHighlighter } from './HighlighterProvider';

export const Highlighter = () => {
  const highlighter = useHighlighter();

  const [ref, setRef] = createSignal<HTMLDivElement>();

  const [position, setPosition] = createSignal(ZERO_POS);
  const [size, setSize] = createSignal(ZERO_SIZE);
  const [visible, setVisible] = createSignal(false);

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
      const { updatedPos, updatedSize } = calculateResize(
        dragState.size,
        dragState.startElPos,
        { x: e.clientX - dragState.startMousePos.x, y: e.clientY - dragState.startMousePos.y },
        'bottom-right'
      );
      setPosition({ ...updatedPos });
      setSize({ width: Math.abs(updatedSize.width), height: Math.abs(updatedSize.height) });
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
    if (ref()) {
      highlighter.createObserver(ref()!);
    }

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
