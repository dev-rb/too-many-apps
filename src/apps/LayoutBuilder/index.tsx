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

  const updateParent = (childId: string, newParentId: string | undefined) => {
    setComponentState('components', childId, 'parent', newParentId);
  };

  const addChild = (parentId: string, childId: string) => {
    setComponentState('components', parentId, 'children', (p) => {
      // If the child already exists, we can skip adding it.
      if (p.includes(childId)) {
        return p;
      }
      updateParent(childId, parentId);
      return [...p, childId];
    });
  };

  const removeChild = (parentId: string, childId: string) => {
    setComponentState('components', parentId, 'children', (p) => p.filter((child) => child !== childId));
  };

  /**
   * Case 1: Updated component is inside another component now.
   * [Solution]: Add component to children of other component. Set parent of component to other component.
   * Case 2: Updated component is partially outside its parent.
   * [Solution]: Set parent to grandparent up the tree. Add component to children of grandparent
   * Case 3: Updated component is not capturing all children
   * [Solution]: Recursively resolve all children as well with the same cases.
   * Case 4: Another component is inside the updated component
   * [Solution]: Move the
   *
   */

  const resolveChildren = (id: string, position: XYPosition, size: Size) => {
    const childrenOfComponent = componentState.components[id].children;

    if (!childrenOfComponent.length) return;

    for (const child of childrenOfComponent) {
      const childPos = componentState.components[child].position;
      const childSize = componentState.components[child].size;

      // If any side of the child is outside the current element
      if (
        childPos.x < position.x ||
        childPos.y < position.y ||
        childPos.x + childSize.width > position.x + size.width ||
        childPos.y + childSize.height > position.y + size.height
      ) {
        removeChild(id, child);
        // Resolve tree of child
        resolveTree(child, childPos, childSize);
      }
    }
  };

  const checkInsideParent = (id: string, position: XYPosition, size: Size) => {
    const parent = componentState.components[id].parent;
    if (!parent) return;
    if (parent) {
      const parentComponent = componentState.components[parent];

      if (
        position.x < parentComponent.position.x ||
        position.y < parentComponent.position.y ||
        position.x + size.width > parentComponent.position.x + parentComponent.size.width ||
        position.y + size.height > parentComponent.position.y + parentComponent.size.height
      ) {
        // Remove this element from it's parent since it's outside it
        removeChild(parent, id);
        // Set elements' parent to grandparent
        updateParent(id, parentComponent.parent);
      }
    }
  };

  const isComponentInside = (component: ILayoutComponent, other: ILayoutComponent) => {
    return (
      other.position.x <= component.position.x &&
      other.position.y <= component.position.y &&
      other.position.x + other.size.width >= component.position.x + component.size.width &&
      other.position.y + other.size.height >= component.position.y + component.size.height
    );
  };

  const resolveTree = (id: string, position: XYPosition, size: Size) => {
    checkInsideParent(id, position, size);
    resolveChildren(id, position, size);
    let currentMin = {
      x: 99999,
      y: 99999,
    };
    let closestParent: string | undefined = '';
    for (const component of Object.values(componentState.components)) {
      if (component.id === id) {
        continue;
      }
      let minDistance = {
        x: component.position.x - position.x,
        y: component.position.y - position.y,
      };
      // Inside check. Are all sides of the selected/changed component inside the current component?
      if (isComponentInside(componentState.components[id], component)) {
        // Change parents. Remove the selected/changed component from it's current parent.
        // Then, add the selected/changed component to the children of the current component.
        if (Math.abs(minDistance.x) < currentMin.x && Math.abs(minDistance.y) < currentMin.y) {
          currentMin.x = Math.abs(minDistance.x);
          currentMin.y = Math.abs(minDistance.y);
          closestParent = component.id;
        }
      }
      // Outside check. Are all sides of the selected/changed component outside the current component?
      if (isComponentInside(component, componentState.components[id])) {
        // If component already has a parent, we don't need to change it's parent.
        if (!component.parent) {
          resolveTree(component.id, component.position, component.size);
        }
      }
    }

    if (closestParent) {
      if (componentState.components[id].parent) {
        removeChild(componentState.components[id].parent!, id);
      }
      addChild(closestParent, id);
      // resolveChildren(
      //   closestParent,
      //   componentState.components[closestParent].position,
      //   componentState.components[closestParent].size
      // );
    }
  };

  const updateComponentPosition = (id: string, newPosition: XYPosition | ((previous: XYPosition) => XYPosition)) => {
    resolveTree(id, access(newPosition, componentState.components[id].position), componentState.components[id].size);
    setComponentState('components', id, (p) => ({
      ...p,
      position: {
        x: Math.max(0, access(newPosition, p.position).x),
        y: Math.max(0, access(newPosition, p.position).y),
      },
    }));
  };

  const updateComponentSize = (id: string, newSize: Size | ((previous: Size) => Size)) => {
    resolveTree(id, componentState.components[id].position, access(newSize, componentState.components[id].size));
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
