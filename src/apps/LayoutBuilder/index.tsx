import {
  createContext,
  createEffect,
  createSelector,
  createSignal,
  createUniqueId,
  For,
  mergeProps,
  on,
  onMount,
  useContext,
} from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { Size, XYPosition } from '~/types';
import LayoutComponent from './Component';
import { createDrawable } from './createDrawable';
import { createNewComponent } from './utils';

export interface ILayoutComponent {
  id: string;
  name: string;
  color?: string;
  size: Size;
  position: XYPosition;
}

const DEFAULT_COMPONENTS = [
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
  selected: ILayoutComponent | undefined;
  displayBounds: XYPosition & Size;
  components: ILayoutComponent[];
}

const BuilderContext = createContext();

const LayoutBuilder = () => {
  const [toolState, setToolState] = createStore<{ selectedComponent: ILayoutComponent | undefined }>({
    selectedComponent: undefined,
  });

  const [componentState, setComponentState] = createStore<ComponentState>({
    selected: undefined,
    displayBounds: { ...ZERO_SIZE, ...ZERO_POS },
    components: [],
  });

  const [displayRef, setDisplayRef] = createSignal<HTMLDivElement>();

  const updateComponentPosition = (id: string, newPosition: XYPosition | ((previous: XYPosition) => XYPosition)) => {
    setComponentState(
      'components',
      (p) => p.id === id,
      (p) => ({
        ...p,
        position: reconcile(typeof newPosition === 'function' ? newPosition(p.position) : newPosition)(p),
      })
    );
  };

  const updateComponentSize = (id: string, newSize: Size | ((previous: Size) => Size)) => {
    setComponentState(
      'components',
      (p) => p.id === id,
      (p) => ({ ...p, size: reconcile(typeof newSize === 'function' ? newSize(p.size) : newSize)(p) })
    );
  };

  const [elementBounds, { onDrawStart, setParentElement }] = createDrawable(
    () => toolState.selectedComponent !== undefined,
    {
      onDrawStart(startPosition) {
        const newComp = createNewComponent(
          toolState.selectedComponent!.name,
          { ...startPosition },
          toolState.selectedComponent!.color
        );

        setComponentState((p) => {
          let components = [...p.components, newComp];

          return {
            ...p,
            components,
            selected: { ...newComp },
          };
        });
      },
    }
  );

  createEffect(
    on(elementBounds, () => {
      if (componentState.selected) {
        const bounds = elementBounds();
        updateComponentPosition(componentState.selected!.id, { x: bounds.x, y: bounds.y });
        updateComponentSize(componentState.selected!.id, { ...bounds });
      }
    })
  );

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

  const isToolActive = createSelector(() => toolState.selectedComponent?.id);

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
  });

  const assignDisplayRef = (el: HTMLDivElement) => {
    setDisplayRef(el);
    setParentElement(el);
  };

  const contextValues = {
    componentState,
    toolState,
    updateComponentPosition,
    updateComponentSize,
  };

  return (
    <BuilderContext.Provider value={contextValues}>
      <div class="flex flex-col justify-center items-center w-full h-full overflow-y-hidden">
        {/* Visual Display */}
        <div class="flex flex-col w-5xl h-xl mb-20">
          {/* Display header */}
          <div class="w-full h-4 bg-dark-5 flex items-center">
            <div class="ml-auto flex gap-2 mr-2">
              <div class="w-2 h-2 bg-green-7 rounded-full" />
              <div class="w-2 h-2 bg-yellow-7 rounded-full" />
              <div class="w-2 h-2 bg-red-7 rounded-full" />
            </div>
          </div>
          {/* Display */}
          <div ref={assignDisplayRef} class="bg-white w-full h-full" onMouseDown={onDrawStart}>
            <For each={componentState.components}>
              {(comp) => (
                <LayoutComponent
                  {...comp}
                  active={componentState.selected?.id === comp.id}
                  selectElement={selectElement}
                />
              )}
            </For>
          </div>
        </div>
        {/* Components Box */}
        <div class="w-full bg-dark-5 h-xl -mb-44 p-5 flex flex-wrap gap-4 content-start">
          <For each={DEFAULT_COMPONENTS}>
            {(comp) => <ComponentDisplay {...comp} active={isToolActive(comp.id)} toggleActive={toggleActive} />}
          </For>
        </div>
      </div>
    </BuilderContext.Provider>
  );
};

export default LayoutBuilder;

interface BuilderContextValues {
  componentState: ComponentState;
  toolState: {
    selectedComponent: ILayoutComponent | undefined;
  };
  updateComponentPosition: (id: string, newPosition: XYPosition | ((previous: XYPosition) => XYPosition)) => void;
  updateComponentSize: (id: string, newSize: Size | ((previous: Size) => Size)) => void;
}

export const useBuilderContext = () => {
  const ctx = useContext(BuilderContext);

  if (!ctx) {
    throw new Error('BuilderContext can only be used inside a BuilderContext provider.');
  }

  return ctx as BuilderContextValues;
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
