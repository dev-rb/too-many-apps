import {
  Accessor,
  createContext,
  createMemo,
  createSelector,
  createUniqueId,
  For,
  mergeProps,
  useContext,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { Size, XYPosition } from '~/types';
import { access } from '~/utils/common';
import Layers from './Layers';
import LayoutCanvas from './LayoutCanvas';

export interface ILayoutComponent {
  id: string;
  name: string;
  color?: string;
  size: Size;
  position: XYPosition;
  css?: string;
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
  selected: string | undefined;
  displayBounds: XYPosition & Size;
  components: { [key: string]: ILayoutComponent };
}

const BuilderContext = createContext();

const LayoutBuilder = () => {
  const [toolState, setToolState] = createStore<{
    selectedComponent: ILayoutComponent | undefined;
    isDragging: boolean;
  }>({
    selectedComponent: undefined,
    isDragging: false,
  });

  const [componentState, setComponentState] = createStore<ComponentState>({
    selected: undefined,
    displayBounds: { ...ZERO_SIZE, ...ZERO_POS },
    components: {},
  });

  // const transformBounds = (bounds: Size & XYPosition) => {
  //   let newWidth = Math.abs(bounds.width);
  //   let newHeight = Math.abs(bounds.height);

  //   const previousSize = { width: props.size.width, height: props.size.height };
  //   if (bounds.x < 0) {
  //     newWidth = previousSize.width;
  //   } else if (Math.floor(builder.componentState.displayBounds.width - (bounds.x + newWidth)) < 0) {
  //     newWidth = builder.componentState.displayBounds.width - bounds.x;
  //   }
  //   if (bounds.y < 0) {
  //     newHeight = previousSize.height;
  //   } else if (Math.floor(builder.componentState.displayBounds.height - (bounds.y + newHeight)) < 0) {
  //     newHeight = builder.componentState.displayBounds.height - bounds.y;
  //   }

  //   return {
  //     x: Math.max(0, Math.round(bounds.x)),
  //     y: Math.max(0, Math.round(bounds.y)),
  //     width: Math.round(newWidth),
  //     height: Math.round(newHeight),
  //   };
  // };

  const updateComponentPosition = (id: string, newPosition: XYPosition | ((previous: XYPosition) => XYPosition)) => {
    setComponentState('components', id, (p) => ({
      ...p,
      position: {
        ...p.position,
        x: Math.max(0, access(newPosition, p.position).x),
        y: Math.max(0, access(newPosition, p.position).y),
      },
    }));
  };

  const updateComponentSize = (id: string, newSize: Size | ((previous: Size) => Size)) => {
    let restrictedSize = { ...newSize };

    setComponentState('components', id, (p) => ({
      ...p,
      size: { width: access(newSize, p.size).width, height: access(newSize, p.size).height },
    }));
  };

  const getSelectedComponent = createMemo(() => {
    if (componentState.selected) {
      return componentState.components[componentState.selected];
    }
  });

  const selectTool = (id: string) => {
    const selected = DEFAULT_COMPONENTS.find((v) => v.id === id);
    if (selected) {
      setToolState('selectedComponent', { ...selected });
    }
  };

  const selectComponent = (id: string) => {
    setComponentState('selected', id);
  };

  const setIsDragging = (val: boolean) => setToolState('isDragging', val);

  const isToolActive = createSelector(() => toolState.selectedComponent?.id);

  const createNewComponent = (component: ILayoutComponent) => {
    setComponentState('components', (p) => ({
      ...p,
      [component.id]: { ...component },
    }));
  };

  const contextValues = {
    componentState,
    toolState,
    updateComponentPosition,
    updateComponentSize,
    selectComponent,
    createNewComponent,
    setIsDragging,
    getSelectedComponent,
  };

  return (
    <BuilderContext.Provider value={contextValues}>
      <div class="flex flex-col justify-center  w-full h-full overflow-y-hidden gap-4">
        <div class="flex items-start">
          <Layers />
          <LayoutCanvas />
        </div>
        <div class="w-full bg-dark-5 h-xl -mb-44 p-5 flex flex-wrap gap-4 content-start">
          <For each={DEFAULT_COMPONENTS}>
            {(comp) => <ComponentDisplay {...comp} active={isToolActive(comp.id)} selectTool={selectTool} />}
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
    isDragging: boolean;
  };
  updateComponentPosition: (id: string, newPosition: XYPosition | ((previous: XYPosition) => XYPosition)) => void;
  updateComponentSize: (id: string, newSize: Size | ((previous: Size) => Size)) => void;
  selectComponent: (id: string) => void;
  createNewComponent: (component: ILayoutComponent) => void;
  setIsDragging: (val: boolean) => void;
  getSelectedComponent: Accessor<ILayoutComponent | undefined>;
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
  selectTool: (id: string) => void;
}

const ComponentDisplay = (props: ComponentDisplayProps) => {
  props = mergeProps({ color: 'white' }, props);

  const getBackgroundStyles = () =>
    `bg-${props.color}/30 border-${props.color}-4 border-1 rounded-sm lines-gradient to-${props.color}-4/50`;

  return (
    <div
      class={`${getBackgroundStyles()} flex items-center justify-center cursor-pointer select-none w-24 h-10 ${
        props.active ? 'ring-blue-7 ring-4' : ''
      }`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        props.selectTool(props.id);
      }}
    >
      <p class="font-600 color-white"> {props.name} </p>
    </div>
  );
};
