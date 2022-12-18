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
import { createStore } from 'solid-js/store';
import { Size, XYPosition } from '~/types';

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

interface State {
  selected: LayoutComponent | undefined;
  displayBounds: XYPosition & Size;
  components: LayoutComponent[];
}

const LayoutBuilder = () => {
  const [state, setState] = createStore<State>({
    selected: undefined,
    displayBounds: { ...ZERO_SIZE, ...ZERO_POS },
    components: [],
  });

  const [displayRef, setDisplayRef] = createSignal<HTMLDivElement>();

  const [startPosition, setStartPosition] = createSignal(ZERO_POS, {
    equals: false,
  });
  const [isDragging, setIsDragging] = createSignal(false);

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

  const onMouseDown = (e: MouseEvent) => {
    if (state.selected) {
      setIsDragging(true);
      setStartPosition({
        x: e.clientX - state.displayBounds.x,
        y: e.clientY - state.displayBounds.y,
      });
      const newComp = createNewComponent(state.selected.name, state.selected.color, {
        x: e.clientX - state.displayBounds.x,
        y: e.clientY - state.displayBounds.y,
      });

      setState((p) => {
        let components = [...p.components, newComp];

        return {
          ...p,
          components,
          selected: { ...newComp },
        };
      });
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    e.preventDefault();

    if (isDragging()) {
      const newWidth = e.clientX - (startPosition().x + state.displayBounds.x);
      const newHeight = e.clientY - (startPosition().y + state.displayBounds.y);

      const xEdgeDist = e.clientX - state.displayBounds.x;
      const yEdgeDist = e.clientY - state.displayBounds.y;

      setState(
        'components',
        (p) => p.id === state.selected?.id,
        (p) => {
          let newPos = p.position ?? ZERO_POS;
          let newSize = p.size ?? ZERO_SIZE;

          const isInXDisplayBound = xEdgeDist > 0 && xEdgeDist < state.displayBounds.width;

          const isInYDisplayBound = yEdgeDist > 0 && yEdgeDist < state.displayBounds.height;

          if (isInXDisplayBound) {
            newSize.width = Math.abs(newWidth);
            if (newWidth < 0) {
              newPos.x = newWidth + startPosition().x;
            }
          }

          if (isInYDisplayBound) {
            newSize.height = Math.abs(newHeight);
            if (newHeight < 0) {
              newPos.y = newHeight + startPosition().y;
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
    setIsDragging(false);
    setStartPosition(ZERO_POS);
  };

  const toggleActive = (name: string) => {
    const selected = DEFAULT_COMPONENTS.find((v) => v.id === name);
    if (selected) {
      setState('selected', { ...selected });
    }
  };

  const active = createSelector(() => state.selected?.id);

  onMount(() => {
    if (displayRef()) {
      const bounds = displayRef()!.getBoundingClientRect();
      setState('displayBounds', {
        x: bounds.left,
        y: bounds.top,
        height: bounds.height,
        width: bounds.width,
      });
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    onCleanup(() => {
      document.removeEventListener('mousemove', onMouseMove);
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
          <For each={state.components}>
            {(comp) => <LayoutComponent {...comp} active={active(comp.id)} toggleActive={toggleActive} />}
          </For>
        </div>
      </div>
      {/* Components Box */}
      <div class="w-full bg-dark-5 h-xl -mb-44 p-5 flex flex-wrap gap-4 content-start">
        <For each={DEFAULT_COMPONENTS}>
          {(comp) => <LayoutComponent {...comp} active={active(comp.id)} toggleActive={toggleActive} />}
        </For>
      </div>
    </div>
  );
};

export default LayoutBuilder;

interface LayoutComponentProps extends LayoutComponent {
  position?: XYPosition;
  active: boolean;
  toggleActive: (name: string) => void;
}

const LayoutComponent = (props: LayoutComponentProps) => {
  props = mergeProps({ color: 'white', size: { width: 96, height: 40 } }, props);

  const [compRef, setCompRef] = createSignal<HTMLDivElement>();

  const [position, setPosition] = createSignal(props.position ?? ZERO_POS, {
    equals: false,
  });

  createEffect(() => {
    setPosition(props.position ?? ZERO_POS);
  });

  const getBackgroundStyles = () =>
    `bg-${props.color}/30 border-${props.color}-4 border-1 rounded-sm lines-gradient to-${props.color}-4/50`;

  return (
    <div
      ref={setCompRef}
      class={`${getBackgroundStyles()} flex items-center justify-center cursor-pointer select-none ${
        props.active ? 'ring-blue-7 ring-4' : ''
      }`}
      style={{
        position: props.position ? 'fixed' : 'relative',
        transform: `translate(${position().x}px, ${position().y}px)`,
        width: `${props.size!.width}px`,
        height: `${props.size!.height}px`,
      }}
      data-id={props.id}
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
