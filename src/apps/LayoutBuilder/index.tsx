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
import { Bounds, Size, XYPosition } from '~/types';
import { access } from '~/utils/common';
import Preview from './Preview';
import LayoutCanvas from './LayoutCanvas';
import Layers from './Layers';
import { calculateDistances } from './snapping';

export const MIN_LAYER = 4;

export interface ILayoutComponent {
  id: string;
  name: string;
  color?: string;
  bounds: Bounds;
  size: Size;
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

  const resolveChildren = (id: string, bounds: Bounds) => {
    const childrenOfComponent = componentState.components[id].children;

    if (!childrenOfComponent.length) return;

    for (const child of childrenOfComponent) {
      const childBounds = componentState.components[child].bounds;

      // If any side of the child is outside the current element
      if (
        childBounds.left < bounds.left ||
        childBounds.top < bounds.top ||
        childBounds.right > bounds.right ||
        childBounds.bottom > bounds.bottom
      ) {
        // Update parent of child to grandparent.
        updateParent(child, getComponent(id).parent);
        removeChild(id, child);
        // Resolve tree for child changes
        updateTree(child, childBounds);
      }
    }
  };

  const checkInsideParent = (id: string, bounds: Bounds) => {
    const parent = componentState.components[id].parent;
    if (!parent) return;
    if (parent) {
      const parentComponent = componentState.components[parent];

      const outTop = bounds.top < parentComponent.bounds.top && bounds.bottom < parentComponent.bounds.top;
      const outLeft = bounds.left < parentComponent.bounds.left && bounds.right < parentComponent.bounds.left;
      const outRight = bounds.left > parentComponent.bounds.right && bounds.right > parentComponent.bounds.right;
      const outBottom = bounds.top > parentComponent.bounds.bottom && bounds.bottom > parentComponent.bounds.bottom;

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
      outer.bounds.left <= inner.bounds.left &&
      outer.bounds.top <= inner.bounds.top &&
      outer.bounds.right >= inner.bounds.right &&
      outer.bounds.bottom >= inner.bounds.bottom
    );
  };

  const updateTree = (updatedComponentId: string, bounds: Bounds) => {
    checkInsideParent(updatedComponentId, bounds);
    resolveChildren(updatedComponentId, bounds);
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
        x: component.bounds.left - bounds.left,
        y: component.bounds.top - bounds.top,
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
          updateTree(component.id, component.bounds);
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
    const currentBounds = getComponent(id).bounds;
    let resolvedNewPos = { ...access(newPosition, { x: currentBounds.left, y: currentBounds.top }) };

    const otherComponents = Object.values(componentState.components).filter(
      (comp) => comp.id !== id && comp.parent === getComponent(id).parent
    );

    const alignDistance = calculateDistances(
      currentBounds,
      otherComponents.map((v) => v.bounds)
    );
    const xDiff = Math.abs(resolvedNewPos.x - currentBounds.left);
    if (Math.abs(xDiff + alignDistance.xAlign - 4) < 4) {
      resolvedNewPos.x = currentBounds.left + alignDistance.xAlign;
    }

    const yDiff = Math.abs(resolvedNewPos.y - currentBounds.top);
    if (Math.abs(yDiff + alignDistance.yAlign - 4) < 4) {
      resolvedNewPos.y = currentBounds.top + alignDistance.yAlign;
    }

    updateTree(id, { ...currentBounds, top: resolvedNewPos.y, left: resolvedNewPos.x });
    setComponentState('components', id, (p) => ({
      ...p,
      bounds: {
        ...p.bounds,
        left: Math.max(0, resolvedNewPos.x),
        top: Math.max(0, resolvedNewPos.y),
        right: Math.max(0, resolvedNewPos.x) + p.size.width,
        bottom: Math.max(0, resolvedNewPos.y) + p.size.height,
      },
    }));
  };

  const updateComponentSize = (id: string, newSize: Size | ((previous: Size) => Size)) => {
    updateTree(id, getComponent(id).bounds);
    setComponentState('components', id, (p) => ({
      ...p,
      size: { width: access(newSize, p.size).width, height: access(newSize, p.size).height },
    }));
  };

  const getComponentWithLayer = (layer: number) => {
    return Object.values(componentState.components).find((v) => v.layer === layer);
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
    const current = getComponent(id);
    const oneAhead = getComponentWithLayer(current.layer + 1);
    // Swap layers with component that has layer one larger layer
    if (oneAhead) {
      setComponentState('components', oneAhead.id, 'layer', current.layer);
      setComponentState('components', id, 'layer', (p) => p + 1);
    }
  };

  const sendBackward = (id: string) => {
    const current = getComponent(id);
    const oneBefore = getComponentWithLayer(current.layer - 1);
    // Swap layers with component that has layer one less
    if (oneBefore) {
      setComponentState('components', oneBefore.id, 'layer', current.layer);
      setComponentState('components', id, 'layer', (p) => p - 1);
    }
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
        <div class="flex items-start justify-evenly">
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
