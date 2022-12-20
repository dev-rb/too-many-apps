import {
  createEffect,
  createSelector,
  createSignal,
  createUniqueId,
  For,
  mergeProps,
  onCleanup,
  onMount,
} from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import { Size, XYPosition } from '~/types';
import { calculateResize } from './utils';

interface LayoutComponent {
  id: string;
  name: string;
  color?: string;
  size?: Size;
  position?: XYPosition;
}

const ZERO_SIZE: Size = { width: 0, height: 0 };
const ZERO_POS: XYPosition = { x: 0, y: 0 };

const DEFAULT_COMPONENTS: LayoutComponent[] = [
  {
    id: createUniqueId(),
    name: 'Row',
    color: 'pink',
  },
  {
    id: createUniqueId(),
    name: 'Column',
    color: 'blue',
  },
];

interface ComponentState {
  selected: LayoutComponent | undefined;
  displayBounds: XYPosition & Size;
  components: LayoutComponent[];
}

const LayoutBuilder = () => {
  const [toolState, setToolState] = createStore<{ selectedComponent: LayoutComponent | undefined }>({
    selectedComponent: undefined,
  });

  const [componentState, setComponentState] = createStore<ComponentState>({
    selected: undefined,
    displayBounds: { ...ZERO_SIZE, ...ZERO_POS },
    components: [],
  });

  const [displayRef, setDisplayRef] = createSignal<HTMLDivElement>();

  const [dragState, setDragState] = createStore({
    startPos: ZERO_POS,
    startElPos: ZERO_POS,
    startSize: ZERO_SIZE,
    isDragging: false,
    activeHandle: 'top-left',
  });

  const createNewComponent = (name: string, color?: string, startPos?: XYPosition, startSize: Size = ZERO_SIZE) => {
    const newId = createUniqueId();
    return {
      id: newId,
      name: name,
      color: color,
      position: startPos,
      size: startSize,
    };
  };

  const startResize = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (componentState.selected) {
      const currentPosition = componentState.selected.position ?? ZERO_POS;
      const currentSize = componentState.selected.size ?? ZERO_SIZE;

      const clickX = e.clientX - componentState.displayBounds.x - currentPosition.x;
      const clickY = e.clientY - componentState.displayBounds.y - currentPosition.y;

      const xDiff = Math.abs(clickX);
      const yDiff = Math.abs(clickY);

      let handle = 'top-left';

      if (xDiff < 10 && yDiff < 10) {
        handle = 'top-left';
      } else if (Math.abs(currentSize.width - clickX) < 10 && yDiff < 10) {
        handle = 'top-right';
      } else if (xDiff < 10 && Math.abs(currentSize.height - clickY) < 10) {
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

    if (dragState.isDragging && componentState.selected) {
      const { activeHandle, startElPos, startPos, startSize } = unwrap(dragState);

      const xEdgeDist = e.clientX - componentState.displayBounds.x;
      const yEdgeDist = e.clientY - componentState.displayBounds.y;

      const isInXDisplayBound = xEdgeDist > 0 && xEdgeDist < componentState.displayBounds.width;
      const isInYDisplayBound = yEdgeDist > 0 && yEdgeDist < componentState.displayBounds.height;

      const newMousePos = { x: e.clientX - startPos.x, y: e.clientY - startPos.y };

      if (isInXDisplayBound || isInYDisplayBound) {
        const { updatedPos, updatedSize } = calculateResize(startSize, startElPos, newMousePos, activeHandle);
        setComponentState(
          'components',
          (p) => p.id === componentState.selected?.id,
          (p) => {
            let newPos = p.position ?? ZERO_POS;
            let newSize = p.size ?? ZERO_SIZE;

            if (isInXDisplayBound) {
              newSize.width = updatedSize.width;

              newPos.x = updatedPos.x;
            }

            if (isInYDisplayBound) {
              newSize.height = updatedSize.height;

              newPos.y = updatedPos.y;
            }
            return {
              ...p,
              position: {
                ...newPos,
              },
              size: {
                ...newSize,
              },
            };
          }
        );
      }
    }
  };

  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (toolState.selectedComponent) {
      setDragState({
        isDragging: true,
        startPos: {
          x: e.clientX,
          y: e.clientY,
        },
      });

      const newComp = createNewComponent(toolState.selectedComponent.name, toolState.selectedComponent.color, {
        x: e.clientX - componentState.displayBounds.x,
        y: e.clientY - componentState.displayBounds.y,
      });

      setComponentState((p) => {
        let components = [...p.components, newComp];

        return {
          ...p,
          components,
          selected: { ...newComp },
        };
      });
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    e.preventDefault();

    if (dragState.isDragging) {
      const startPos = dragState.startPos;

      const newWidth = e.clientX - startPos.x;
      const newHeight = e.clientY - startPos.y;

      const xEdgeDist = e.clientX - componentState.displayBounds.x;
      const yEdgeDist = e.clientY - componentState.displayBounds.y;

      setComponentState(
        'components',
        (p) => p.id === componentState.selected?.id,
        (p) => {
          let newPos = p.position ?? ZERO_POS;
          let newSize = p.size ?? ZERO_SIZE;

          const isInXDisplayBound = xEdgeDist > 0 && xEdgeDist < componentState.displayBounds.width;

          const isInYDisplayBound = yEdgeDist > 0 && yEdgeDist < componentState.displayBounds.height;

          if (isInXDisplayBound) {
            newSize.width = Math.abs(newWidth);
            if (newWidth < 0) {
              newPos.x = newWidth + startPos.x - componentState.displayBounds.x;
            }
          }

          if (isInYDisplayBound) {
            newSize.height = Math.abs(newHeight);
            if (newHeight < 0) {
              newPos.y = newHeight + startPos.y - componentState.displayBounds.y;
            }
          }

          return {
            ...p,
            position: {
              ...newPos,
            },
            size: {
              ...newSize,
            },
          };
        }
      );
    }
  };

  const onMouseUp = (e: MouseEvent) => {
    setDragState({
      isDragging: false,
    });
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', onMouseUp);
  };

  const toggleActive = (name: string) => {
    const selected = DEFAULT_COMPONENTS.find((v) => v.id === name);
    if (selected) {
      setToolState('selectedComponent', { ...selected });
    }
  };

  const selectElement = (id: string) => {
    const comp = componentState.components.find((comp) => comp.id === id);
    setComponentState('selected', { ...comp });
  };

  const active = createSelector(() => toolState.selectedComponent?.id);

  onMount(() => {
    if (displayRef()) {
      const bounds = displayRef()!.getBoundingClientRect();
      setComponentState('displayBounds', {
        x: bounds.left,
        y: bounds.top,
        height: bounds.height,
        width: bounds.width,
      });
    }

    onCleanup(() => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousemove', onResize);
      document.removeEventListener('mouseup', onMouseUp);
    });
  });

  return (
    <div class="flex flex-col justify-center items-center w-full h-full overflow-y-hidden">
      {/* Visual Display */}
      <div class="flex flex-col w-3xl h-md mb-20">
        {/* Display header */}
        <div class="w-full h-4 bg-dark-5 flex items-center">
          <div class="ml-auto flex gap-2 mr-2">
            <div class="w-2 h-2 bg-green-7 rounded-full" />
            <div class="w-2 h-2 bg-yellow-7 rounded-full" />
            <div class="w-2 h-2 bg-red-7 rounded-full" />
          </div>
        </div>
        {/* Display */}
        <div ref={setDisplayRef} class="bg-white w-full h-full" onMouseDown={onMouseDown}>
          <For each={componentState.components}>
            {(comp) => (
              <LayoutComponent
                {...comp}
                active={componentState.selected?.id === comp.id}
                resize={startResize}
                selectElement={selectElement}
              />
            )}
          </For>
        </div>
      </div>
      {/* Components Box */}
      <div class="w-full bg-dark-5 h-xl -mb-44 p-5 flex flex-wrap gap-4 content-start">
        <For each={DEFAULT_COMPONENTS}>
          {(comp) => <ComponentDisplay {...comp} active={active(comp.id)} toggleActive={toggleActive} />}
        </For>
      </div>
    </div>
  );
};

export default LayoutBuilder;

interface LayoutComponentProps extends LayoutComponent {
  resize: (e: MouseEvent) => void;
  selectElement: (id: string) => void;
  active: boolean;
}

const LayoutComponent = (props: LayoutComponentProps) => {
  props = mergeProps({ color: 'white', size: { width: 96, height: 40 } }, props);

  const [compRef, setCompRef] = createSignal<HTMLDivElement>();

  const [position, setPosition] = createSignal(props.position ?? ZERO_POS, {
    equals: false,
  });

  const selectElement = () => props.selectElement(props.id);
  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    selectElement();
  };

  const onHandleMouseDown = (e: MouseEvent) => {
    selectElement();
    props.resize?.(e);
  };

  createEffect(() => {
    setPosition(props.position ?? ZERO_POS);
  });

  const colorOpacity = () => (props.active ? 50 : 30);

  const getBackgroundStyles = () =>
    `bg-${props.color}/${colorOpacity()} border-${props.color}-4 border-1 rounded-sm lines-gradient to-${
      props.color
    }-4/50`;

  return (
    <div
      ref={setCompRef}
      class={`${getBackgroundStyles()} flex items-center justify-center cursor-pointer select-none `}
      style={{
        position: props.position ? 'fixed' : 'relative',
        transform: `translate(${position().x}px, ${position().y}px)`,
        width: `${props.size!.width}px`,
        height: `${props.size!.height}px`,
      }}
      onMouseDown={onMouseDown}
    >
      <div
        class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -top-1.5 -left-1.5 cursor-nw-resize hover:(border-white border-2) active:(border-white border-2)`}
        onMouseDown={onHandleMouseDown}
      />
      <div
        class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -top-1.5 -right-1.5 cursor-ne-resize hover:(border-white border-2) active:(border-white border-2)`}
        onMouseDown={onHandleMouseDown}
      />
      <div
        class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -bottom-1.5 -left-1.5 cursor-sw-resize hover:(border-white border-2) active:(border-white border-2)`}
        onMouseDown={onHandleMouseDown}
      />
      <div
        class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -bottom-1.5 -right-1.5 cursor-se-resize hover:(border-white border-2) active:(border-white border-2)`}
        onMouseDown={onHandleMouseDown}
      />
      <p class="font-600 color-white"> {props.name} </p>
    </div>
  );
};

interface ComponentDisplayProps {
  id: string;
  color?: string;
  name: string;
  active: boolean;
  toggleActive: (name: string) => void;
}

const ComponentDisplay = (props: ComponentDisplayProps) => {
  props = mergeProps({ color: 'white' }, props);

  const [compRef, setCompRef] = createSignal<HTMLDivElement>();

  const getBackgroundStyles = () =>
    `bg-${props.color}/30 border-${props.color}-4 border-1 rounded-sm lines-gradient to-${props.color}-4/50`;

  return (
    <div
      ref={setCompRef}
      class={`${getBackgroundStyles()} flex items-center justify-center cursor-pointer select-none w-24 h-10 ${
        props.active ? 'ring-blue-7 ring-4' : ''
      }`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        props.toggleActive(props.id);
      }}
    >
      <p class="font-600 color-white"> {props.name} </p>
    </div>
  );
};
