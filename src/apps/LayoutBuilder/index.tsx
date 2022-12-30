import { createContext, createSelector, createUniqueId, For, JSX, mergeProps, useContext } from 'solid-js';
import { createStore, reconcile, unwrap } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { Bounds, Size, XYPosition } from '~/types';
import { access } from '~/utils/common';
import Preview from './Preview/Preview';
import LayoutCanvas from './LayoutCanvas';
import Layers from './Layers/Layers';
import Toolbar, { Tools } from './Toolbar';
import { isInside } from './utils';
import { MenuProvider } from '~/components/Menu/MenuProvider';
import { Menu } from '~/components/Menu/Menu';
import { Highlighter } from './Highlighter';

export const MIN_LAYER = 4;

type ComponentID = string;
type DrawableID = string;

export interface ILayoutComponent {
  id: ComponentID;
  name: string;
  color?: string;
  bounds: Bounds;
  size: Size;
  css?: JSX.CSSProperties;
  layer: number;
  children: string[];
  parent?: string;
}

const DEFAULT_COMPONENTS: Pick<ILayoutComponent, 'color' | 'id' | 'name' | 'css'>[] = [
  {
    id: createUniqueId(),
    name: 'Row',
    color: 'pink',
    css: {
      display: 'flex',
      'flex-direction': 'row',
    },
  },
  {
    id: createUniqueId(),
    name: 'Column',
    color: 'blue',
    css: {
      display: 'flex',
      'flex-direction': 'column',
    },
  },
];

interface ComponentState {
  selected: ComponentID[];
  displayBounds: XYPosition & Size;
  components: { [key: ComponentID]: ILayoutComponent };
  maxLayer: number;
  selectedComponent: ILayoutComponent[];
}

interface ToolState {
  activeTool: Tools;
  drawItem: DrawableID | undefined;
}

const BuilderContext = createContext();

const LayoutBuilder = () => {
  const [toolState, setToolState] = createStore<ToolState>({
    activeTool: 'pointer',
    drawItem: undefined,
  });

  const [componentState, setComponentState] = createStore<ComponentState>({
    selected: [],
    displayBounds: { ...ZERO_SIZE, ...ZERO_POS },
    components: {},
    maxLayer: MIN_LAYER,
    get selectedComponent() {
      return (Object.values(this.components) as ILayoutComponent[]).filter((comp: ILayoutComponent) =>
        this.selected.includes(comp.id)
      );
    },
  });

  const updateParent = (childId: ComponentID, newParentId: ComponentID | undefined) => {
    setComponentState('components', childId, 'parent', newParentId);
  };

  const addChild = (parentId: ComponentID, childId: ComponentID) => {
    setComponentState('components', parentId, 'children', (p) => {
      // If the child already exists, we can skip adding it.
      if (p.includes(childId)) {
        return p;
      }
      updateParent(childId, parentId);
      return [...p, childId];
    });
  };

  const removeChild = (parentId: ComponentID, childId: ComponentID) => {
    setComponentState('components', parentId, 'children', (p) => p.filter((child) => child !== childId));
  };

  const areChildrenOutside = (id: ComponentID, bounds: Bounds) => {
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

  const isOutsideParent = (id: ComponentID, bounds: Bounds) => {
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

  const updateTree = (updatedComponentId: ComponentID, bounds: Bounds) => {
    isOutsideParent(updatedComponentId, bounds);
    areChildrenOutside(updatedComponentId, bounds);
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
      if (isInside(bounds, component.bounds)) {
        // Find the closest parent by distance
        if (Math.abs(minDistance.x) < currentMin.x && Math.abs(minDistance.y) < currentMin.y) {
          currentMin.x = Math.abs(minDistance.x);
          currentMin.y = Math.abs(minDistance.y);
          closestParent = component.id;
        }
      }
      // Outside check. Is the current component inside the selected/changed component?
      if (isInside(component.bounds, bounds)) {
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
        if (isInside(childComponent.bounds, bounds)) {
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

  const getComponent = (id: ComponentID) => {
    if (!componentState.components.hasOwnProperty(id)) {
      throw new Error(`Component with id [${id}] does not exist in the component state.`);
    }
    return componentState.components[id];
  };

  const updateComponentPosition = (
    id: ComponentID,
    newPosition: XYPosition | ((previous: XYPosition) => XYPosition)
  ) => {
    const currentBounds = getComponent(id).bounds;
    const resolvedNewPos = { ...access(newPosition, { x: currentBounds.left, y: currentBounds.top }) };

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

  const updateComponentSize = (id: ComponentID, newSize: Size | ((previous: Size) => Size)) => {
    updateTree(id, getComponent(id).bounds);
    setComponentState('components', id, (p) => ({
      ...p,
      size: { width: access(newSize, p.size).width, height: access(newSize, p.size).height },
    }));
  };

  const updateComponentName = (id: ComponentID, newName: ComponentID) => {
    setComponentState('components', id, 'name', newName);
  };

  const getComponentWithLayer = (layer: number) => {
    return Object.values(componentState.components).find((v) => v.layer === layer);
  };

  const bringToFront = (id: ComponentID) => {
    const currentMaxLayer = componentState.maxLayer;
    setComponentState('components', id, 'layer', currentMaxLayer + 1);
    setComponentState('maxLayer', currentMaxLayer + 1);
  };

  const sendToBack = (id: ComponentID) => {
    setComponentState('components', id, 'layer', MIN_LAYER - 1);
  };

  const bringForward = (id: ComponentID) => {
    const current = getComponent(id);
    const oneAhead = getComponentWithLayer(current.layer + 1);
    // Swap layers with component that has layer one larger layer
    if (oneAhead) {
      setComponentState('components', oneAhead.id, 'layer', current.layer);
      setComponentState('components', id, 'layer', (p) => p + 1);
    }
  };

  const sendBackward = (id: ComponentID) => {
    const current = getComponent(id);
    const oneBefore = getComponentWithLayer(current.layer - 1);
    // Swap layers with component that has layer one less
    if (oneBefore) {
      setComponentState('components', oneBefore.id, 'layer', current.layer);
      setComponentState('components', id, 'layer', (p) => p - 1);
    }
  };

  const getDrawable = (id: DrawableID) => {
    return DEFAULT_COMPONENTS.find((v) => v.id === id);
  };

  const selectDrawItem = (id: DrawableID) => {
    const selected = DEFAULT_COMPONENTS.find((v) => v.id === id);
    if (selected) {
      setToolState('drawItem', selected.id);
    }
  };

  const selectComponent = (id: ComponentID) => {
    setComponentState('selected', (p) => [id]);
  };

  const selectMultipleComponents = (ids: ComponentID[]) => {
    setComponentState('selected', ids);
  };

  const unselectComponent = (id: ComponentID) => {
    setComponentState('selected', (p) => p.filter((selected) => selected !== id));
  };

  const deleteComponent = (id: ComponentID) => {
    let newState = Object.fromEntries(
      Object.entries(unwrap(componentState.components)).filter(([compId]) => compId !== id)
    );

    const selfParent = componentState.components[id].parent;
    const selfChildren = componentState.components[id].children;

    if (selfParent) {
      removeChild(selfParent, id);
    }

    for (const child of selfChildren) {
      updateParent(child, selfParent);
      if (selfParent) {
        addChild(selfParent, child);
      }
    }

    setComponentState('components', reconcile(newState));
  };

  const clearSelection = () => setComponentState('selected', []);

  const isDrawItemActive = createSelector(() => toolState.drawItem);

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
    updateComponentName,
    selectComponent,
    unselectComponent,
    selectMultipleComponents,
    deleteComponent,
    createNewComponent,
    getDrawable,
    clearSelection,
    layerControls: {
      sendBackward,
      sendToBack,
      bringForward,
      bringToFront,
    },
  };

  return (
    <MenuProvider>
      <BuilderContext.Provider value={contextValues}>
        <Highlighter />
        <div class="flex flex-col justify-center w-full h-full overflow-y-hidden gap-4">
          <Menu />
          <Toolbar activeTool={toolState.activeTool} setActiveTool={(tool) => setToolState('activeTool', tool)} />
          <div class="flex items-start justify-evenly">
            <Layers components={componentState.components} selectedComponents={componentState.selectedComponent} />
            <LayoutCanvas
              components={componentState.components}
              selectedComponents={componentState.selectedComponent}
            />
            <Preview components={componentState.components} selectedComponent={componentState.selectedComponent} />
          </div>
          <div
            class="w-fit bg-dark-5 h-fit p-5 flex flex-wrap gap-4 content-start self-center rounded-md"
            onMouseDown={(e) => e.preventDefault()}
          >
            <For each={DEFAULT_COMPONENTS}>
              {(comp) => <ComponentDisplay {...comp} active={isDrawItemActive(comp.id)} selectTool={selectDrawItem} />}
            </For>
          </div>
        </div>
      </BuilderContext.Provider>
    </MenuProvider>
  );
};

export default LayoutBuilder;

interface BuilderContextValues {
  componentState: ComponentState;
  toolState: ToolState;
  updateComponentPosition: (id: string, newPosition: XYPosition | ((previous: XYPosition) => XYPosition)) => void;
  updateComponentSize: (id: string, newSize: Size | ((previous: Size) => Size)) => void;
  updateComponentName: (id: string, newName: string) => void;
  selectComponent: (id: string) => void;
  unselectComponent: (id: string) => void;
  selectMultipleComponents: (ids: string[]) => void;
  deleteComponent: (id: string) => void;
  createNewComponent: (component: ILayoutComponent) => void;
  clearSelection: () => void;
  getDrawable: (id: string) => Pick<ILayoutComponent, 'id' | 'name' | 'color' | 'css'> | undefined;
  layerControls: {
    sendBackward: (id: string) => void;
    sendToBack: (id: string) => void;
    bringForward: (id: string) => void;
    bringToFront: (id: string) => void;
  };
}

export const useBuilder = () => {
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
