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

export const MIN_LAYER = 4;

export interface ILayoutComponent {
  id: string;
  name: string;
  color?: string;
  size: Size;
  position: XYPosition;
  css?: string;
  layer: number;
  children: string[];
  parent?: string;
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
  maxLayer: number;
}

const BuilderContext = createContext();

const LayoutBuilder = () => {
  const [toolState, setToolState] = createStore<{
    selectedComponent: ILayoutComponent | undefined;
  }>({
    selectedComponent: undefined,
  });

  const [componentState, setComponentState] = createStore<ComponentState>({
    selected: undefined,
    displayBounds: { ...ZERO_SIZE, ...ZERO_POS },
    components: {},
    maxLayer: MIN_LAYER,
  });

  const addChild = (parentId: string, childId: string) => {
    setComponentState('components', parentId, 'children', (p) => {
      if (p.includes(childId)) {
        return p;
      }
      setComponentState('components', childId, 'parent', parentId);
      return [...p, childId];
    });
  };

  const moveChildFromOther = (childId: string, toParent: string) => {
    for (const component of Object.values(componentState.components)) {
      if (component.id === childId || component.id === toParent) continue;

      removeChild(component.id, childId);
    }
  };

  const removeChild = (parentId: string, childId: string) => {
    setComponentState('components', parentId, 'children', (p) => p.filter((child) => child !== childId));
  };

  const checkParent = (id: string, position: XYPosition, size: Size) => {
    let currentMin = {
      x: 99999,
      y: 99999,
    };
    let parent = '';

    for (const component of Object.values(componentState.components)) {
      let minDistance = {
        x: component.position.x - position.x,
        y: component.position.y - position.y,
      };

      if (component.id === id) {
        // Check if any of the children of the selected element are now outside it.
        for (const child of component.children) {
          const childPos = componentState.components[child].position;
          const childSize = componentState.components[child].size;
          if (
            childPos.x <= component.position.x ||
            childPos.y <= component.position.y ||
            childPos.x + childSize.width >= component.position.x + component.size.width ||
            childPos.y + childSize.height >= component.position.y + component.size.height
          ) {
            removeChild(id, child);
            if (component.parent) {
              addChild(component.parent, child);
              setComponentState('components', child, 'parent', component.parent);
            }
          }
        }
        continue;
      }

      // Check if any point of the selected/changed component is outside parent.
      if (componentState.components[id].parent && componentState.components[id].parent === component.id) {
        if (
          position.x <= component.position.x ||
          position.y <= component.position.y ||
          position.x + size.width >= component.position.x + component.size.width ||
          position.y + size.height >= component.position.y + component.size.height
        ) {
          setComponentState('components', id, 'parent', component.parent);
          removeChild(component.id, id);
        }
      }

      // Inside check. Are all sides of the selected/changed component inside the current component?
      if (
        position.x >= component.position.x &&
        position.y >= component.position.y &&
        position.x + size.width <= component.position.x + component.size.width &&
        position.y + size.height <= component.position.y + component.size.height
      ) {
        if (componentState.components[id].parent && component.id === componentState.components[id].parent) {
          if (componentState.components[componentState.components[id].parent!].parent === id) {
            setComponentState('components', componentState.components[id].parent!, 'parent', undefined);
          }
        }
        if (Math.abs(minDistance.x) < currentMin.x && Math.abs(minDistance.y) < currentMin.y) {
          currentMin.x = Math.abs(minDistance.x);
          currentMin.y = Math.abs(minDistance.y);
          parent = component.id;
        }
      }
      // Outside check. Are all sides of the selected/changed component outside the current component?
      else if (
        position.x <= component.position.x &&
        position.y <= component.position.y &&
        position.x + size.width >= component.position.x + component.size.width &&
        position.y + size.height >= component.position.y + component.size.height
      ) {
        checkParent(component.id, component.position, component.size);
      }
    }
    if (parent.length) {
      addChild(parent, id);
      moveChildFromOther(id, parent);
    }
  };

  const updateComponentPosition = (id: string, newPosition: XYPosition | ((previous: XYPosition) => XYPosition)) => {
    checkParent(id, access(newPosition, componentState.components[id].position), componentState.components[id].size);
    setComponentState('components', (p) => ({
      ...p,
      [id]: {
        ...p[id],
        position: {
          ...p.position,
          x: Math.max(0, access(newPosition, p.position).x),
          y: Math.max(0, access(newPosition, p.position).y),
        },
      },
    }));
  };

  const updateComponentSize = (id: string, newSize: Size | ((previous: Size) => Size)) => {
    checkParent(id, componentState.components[id].position, access(newSize, componentState.components[id].size));
    setComponentState('components', id, (p) => ({
      ...p,
      size: { width: access(newSize, p.size).width, height: access(newSize, p.size).height },
    }));
  };

  const bringToFront = (id: string) => {
    const currentMaxLayer = componentState.maxLayer;
    setComponentState('components', id, 'layer', currentMaxLayer + 1);
    setComponentState('maxLayer', currentMaxLayer + 1);
  };

  const sendToBack = (id: string) => {
    setComponentState('components', id, 'layer', MIN_LAYER - 1);
  };

  const bringForward = (id: string) => {
    setComponentState('components', id, 'layer', (p) => p + 1);
  };

  const sendBackward = (id: string) => {
    setComponentState('components', id, 'layer', (p) => p - 1);
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
    getSelectedComponent,
    layerControls: {
      sendBackward,
      sendToBack,
      bringForward,
      bringToFront,
    },
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
  };
  updateComponentPosition: (id: string, newPosition: XYPosition | ((previous: XYPosition) => XYPosition)) => void;
  updateComponentSize: (id: string, newSize: Size | ((previous: Size) => Size)) => void;
  selectComponent: (id: string) => void;
  createNewComponent: (component: ILayoutComponent) => void;
  getSelectedComponent: Accessor<ILayoutComponent | undefined>;
  layerControls: {
    sendBackward: (id: string) => void;
    sendToBack: (id: string) => void;
    bringForward: (id: string) => void;
    bringToFront: (id: string) => void;
  };
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
