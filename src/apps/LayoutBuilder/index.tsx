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
import { clamp } from '~/utils/math';

interface LayoutComponent {
  id: string;
  name: string;
  color?: string;
  size?: { width: number; height: number };
  position?: { x: number; y: number };
}

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
  displayBounds: { x: number; y: number; height: number; width: number };
  components: LayoutComponent[];
}

const LayoutBuilder = () => {
  const [state, setState] = createStore<State>({
    selected: undefined,
    displayBounds: { x: 0, y: 0, height: 0, width: 0 },
    components: [],
  });

  const [displayRef, setDisplayRef] = createSignal<HTMLDivElement>();

  const [startPosition, setStartPosition] = createSignal(
    { x: 0, y: 0 },
    { equals: false }
  );
  const [isDragging, setIsDragging] = createSignal(false);

  const onMouseDown = (e: MouseEvent) => {
    if (state.selected) {
      setIsDragging(true);
      setStartPosition({
        x: e.clientX,
        y: e.clientY,
      });
      const newId = createUniqueId();
      const newComp = {
        id: newId,
        name: state.selected.name,
        color: state.selected.color,
        position: {
          x: e.clientX - state.displayBounds.x,
          y: e.clientY - state.displayBounds.y,
        },
        size: { width: 0, height: 0 },
      };
      setState('components', (p) => [...p, newComp]);

      setState('selected', { ...newComp });
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    e.preventDefault();

    if (isDragging()) {
      setState(
        'components',
        (p) => p.id === state.selected?.id,
        'size',
        (p) => ({
          width: clamp(
            e.clientX - startPosition().x,
            0,
            state.displayBounds.width -
              (startPosition().x - state.displayBounds.x)
          ),
          height: clamp(
            e.clientY - startPosition().y,
            0,
            state.displayBounds.height -
              (startPosition().y - state.displayBounds.y)
          ),
        })
      );
    }
  };

  const onMouseUp = (e: MouseEvent) => {
    setIsDragging(false);
    setStartPosition({ x: 0, y: 0 });
  };

  const toggleActive = (name: string) => {
    const selected = DEFAULT_COMPONENTS.find((v) => v.id === name);
    console.log(selected);
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
        <div
          ref={setDisplayRef}
          class="bg-white w-full h-full"
          onMouseDown={onMouseDown}
        >
          <For each={state.components}>
            {(comp) => (
              <LayoutComponent
                {...comp}
                active={active(comp.id)}
                toggleActive={toggleActive}
              />
            )}
          </For>
        </div>
      </div>
      {/* Components Box */}
      <div class="w-full bg-dark-5 h-xl -mb-44 p-5 flex flex-wrap gap-4 content-start">
        <For each={DEFAULT_COMPONENTS}>
          {(comp) => (
            <LayoutComponent
              {...comp}
              active={active(comp.id)}
              toggleActive={toggleActive}
            />
          )}
        </For>
      </div>
    </div>
  );
};

export default LayoutBuilder;

interface LayoutComponentProps extends LayoutComponent {
  position?: { x: number; y: number };
  active: boolean;
  toggleActive: (name: string) => void;
}

const LayoutComponent = (props: LayoutComponentProps) => {
  props = mergeProps(
    { color: 'white', size: { width: 96, height: 40 } },
    props
  );

  const [compRef, setCompRef] = createSignal<HTMLDivElement>();

  const [position, setPosition] = createSignal(
    props.position ?? { x: 0, y: 0 },
    { equals: false }
  );

  createEffect(() => {
    setPosition(props.position ?? { x: 0, y: 0 });
  });

  return (
    <div
      ref={setCompRef}
      class={`flex items-center justify-center bg-${props.color}/30 border-${
        props.color
      }-4 border-1 rounded-sm lines-gradient to-${
        props.color
      }-4/50 cursor-pointer select-none ${
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
