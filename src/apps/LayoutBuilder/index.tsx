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
import Preview from './Preview';
import LayoutCanvas from './LayoutCanvas';
import Layers from './Layers';

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
        // Update parent of child to grandparent.
        updateParent(child, getComponent(id).parent);
        removeChild(id, child);
        // Resolve tree for child changes
        updateTree(child, childPos, childSize);
      }
    }
  };

  const checkInsideParent = (id: string, position: XYPosition, size: Size) => {
    const parent = componentState.components[id].parent;
    if (!parent) return;
    if (parent) {
      const parentComponent = componentState.components[parent];

      const componentBounds = {
        top: position.y,
        left: position.x,
        right: position.x + size.width,
        bottom: position.y + size.height,
      };

      const outTop =
        componentBounds.top < parentComponent.position.y && componentBounds.bottom < parentComponent.position.y;
      const outLeft =
        componentBounds.left < parentComponent.position.x && componentBounds.right < parentComponent.position.x;
      const outRight =
        componentBounds.left > parentComponent.position.x + parentComponent.size.width &&
        componentBounds.right > parentComponent.position.x + parentComponent.size.width;
      const outBottom =
        componentBounds.top > parentComponent.position.y + parentComponent.size.height &&
        componentBounds.bottom > parentComponent.position.y + parentComponent.size.height;

      if (outTop || outLeft || outRight || outBottom) {
        // Remove this element from it's parent since it's outside it
        removeChild(parent, id);
        // Set elements' parent to grandparent
        updateParent(id, parentComponent.parent);
      }
    }
  };

  const isComponentInside = (innerId: string, outerId: string) => {
    const inner = getComponent(innerId);
    const outer = getComponent(outerId);
    return (
      outer.position.x <= inner.position.x &&
      outer.position.y <= inner.position.y &&
      outer.position.x + outer.size.width >= inner.position.x + inner.size.width &&
      outer.position.y + outer.size.height >= inner.position.y + inner.size.height
    );
  };

  const updateTree = (updatedComponentId: string, position: XYPosition, size: Size) => {
    checkInsideParent(updatedComponentId, position, size);
    resolveChildren(updatedComponentId, position, size);
    let currentMin = {
      x: 99999,
      y: 99999,
    };
    let closestParent: string | undefined = '';
    for (const component of Object.values(componentState.components)) {
      if (component.id === updatedComponentId) {
        continue;
      }
      let minDistance = {
        x: component.position.x - position.x,
        y: component.position.y - position.y,
      };
      // Inside check. Are all sides of the selected/changed component inside the current component?
      if (isComponentInside(updatedComponentId, component.id)) {
        // Find the closest parent by distance
        if (Math.abs(minDistance.x) < currentMin.x && Math.abs(minDistance.y) < currentMin.y) {
          currentMin.x = Math.abs(minDistance.x);
          currentMin.y = Math.abs(minDistance.y);
          closestParent = component.id;
        }
      }
      // Outside check. Is the current component inside the selected/changed component?
      if (isComponentInside(component.id, updatedComponentId)) {
        // If component already has a parent, we don't need to change it's parent.
        // If there is no parent, the component is a "root" component that the selected/changed component is covering/surrounding.
        if (!component.parent) {
          updateTree(component.id, component.position, component.size);
        }
      }
    }

    if (closestParent) {
      // If we have found the closest parent for this component, check if this component also covers any of the found parents children.
      // Move the covered children to be children on this component and remove them from the previous parent.
      for (const child of componentState.components[closestParent].children) {
        const childComponent = getComponent(child);
        if (isComponentInside(child, updatedComponentId)) {
          if (childComponent.parent) {
            removeChild(childComponent.parent, child);
          }
          addChild(updatedComponentId, child);
        }
      }
      if (getComponent(updatedComponentId).parent) {
        removeChild(getComponent(updatedComponentId).parent!, updatedComponentId);
      }
      addChild(closestParent, updatedComponentId);
    }
  };

  const getComponent = (id: string) => {
    if (!componentState.components.hasOwnProperty(id)) {
      throw new Error(`Component with id [${id}] does not exist in the component state.`);
    }
    return componentState.components[id];
  };

  const updateComponentPosition = (id: string, newPosition: XYPosition | ((previous: XYPosition) => XYPosition)) => {
    updateTree(id, access(newPosition, getComponent(id).position), getComponent(id).size);
    setComponentState('components', id, (p) => ({
      ...p,
      position: {
        x: Math.max(0, access(newPosition, p.position).x),
        y: Math.max(0, access(newPosition, p.position).y),
      },
    }));
  };

  const updateComponentSize = (id: string, newSize: Size | ((previous: Size) => Size)) => {
    updateTree(id, getComponent(id).position, access(newSize, getComponent(id).size));
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
          <Preview />
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
