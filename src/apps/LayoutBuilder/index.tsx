import {
  Accessor,
  createContext,
  createSelector,
  createSignal,
  createUniqueId,
  For,
  JSX,
  mergeProps,
  onMount,
  useContext,
} from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { Bounds, Size, XYPosition } from '~/types';
import { access, removeFromObject } from '~/utils/common';
import Preview from './Preview/Preview';
import LayoutCanvas from './Canvas';
import Layers from './Layers/Layers';
import Toolbar, { Tools } from './Toolbar';
import { getCommonBounds } from './utils';
import { MenuProvider } from '~/components/Menu/MenuProvider';
import { Menu } from '~/components/Menu/Menu';
import { Highlighter } from './Highlighter';
import { CssEditor } from './CssEditor';
import { TreeProvider } from '../TreeProvider';

export const MIN_LAYER = 4;

type ComponentID = string;
type DrawableID = string;

export interface ILayoutComponent {
  type: 'component';
  id: ComponentID;
  name: string;
  color?: string;
  bounds: Bounds;
  size: Size;
  css?: JSX.CSSProperties;
  layer: number;
  groupId?: string;
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

export interface Group {
  type: 'group';
  id: string;
  name?: string;
  bounds: Bounds;
  size: Size;
  components: string[];
}

interface GroupList {
  [key: string]: Group;
}

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
  const [canvasBounds, setCanvasBounds] = createSignal({ ...ZERO_POS, ...ZERO_SIZE });
  const [toolState, setToolState] = createStore<ToolState>({
    activeTool: 'pointer',
    drawItem: undefined,
  });

  const [groups, setGroups] = createStore<GroupList>({});

  const [componentState, setComponentState] = createStore<ComponentState>({
    selected: [],
    displayBounds: { ...ZERO_SIZE, ...ZERO_POS },
    components: {},
    maxLayer: MIN_LAYER,
    get selectedComponent() {
      return this.selected.map((id: string) => this.components[id]);
    },
  });

  /** COMPONENT STATE  */
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
    const resolvedNewPos = {
      ...access(newPosition, { x: Math.floor(currentBounds.left), y: Math.floor(currentBounds.top) }),
    };

    setComponentState('components', id, (p) => ({
      ...p,
      bounds: {
        ...p.bounds,
        left: Math.floor(Math.max(0, resolvedNewPos.x)),
        top: Math.floor(Math.max(0, resolvedNewPos.y)),
        right: Math.floor(Math.max(0, resolvedNewPos.x) + p.size.width),
        bottom: Math.floor(Math.max(0, resolvedNewPos.y) + p.size.height),
      },
    }));
  };

  const updateComponentSize = (id: ComponentID, newSize: Size | ((previous: Size) => Size)) => {
    setComponentState('components', id, (p) => ({
      ...p,
      size: { width: access(newSize, p.size).width, height: access(newSize, p.size).height },
    }));

    const currentBounds = getComponent(id).bounds;
    setComponentState('components', id, (p) => ({
      ...p,
      bounds: {
        ...currentBounds,
        right: currentBounds.left + access(newSize, p.size).width,
        bottom: currentBounds.top + access(newSize, p.size).height,
      },
    }));
  };

  const updateComponentName = (id: ComponentID, newName: ComponentID) => {
    setComponentState('components', id, 'name', newName);
  };

  /** LAYERS  */
  const getComponentWithLayer = (layer: number) => {
    return Object.values(componentState.components).find((v) => v.layer === layer);
  };

  const bringToFront = (id: ComponentID) => {
    const currentMaxLayer = Object.values(componentState.components).reduce(
      (maxLayer, current) => (current.layer > maxLayer.layer ? current : maxLayer),
      componentState.components[id]
    );
    setComponentState('components', id, 'layer', currentMaxLayer.layer + 1);
    setComponentState('maxLayer', currentMaxLayer.layer + 1);
  };

  const sendToBack = (id: ComponentID) => {
    const currentMinLayer = Object.values(componentState.components).reduce(
      (minLayer, current) => (current.layer < minLayer.layer ? current : minLayer),
      componentState.components[id]
    );
    for (const component of Object.values(componentState.components)) {
      if (component.layer >= currentMinLayer.layer && component.id !== id) {
        setComponentState('components', component.id, 'layer', (p) => p + 1);
      }
    }
    setComponentState('components', id, 'layer', currentMinLayer.layer - 1);
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

  /** DRAWABLE  */
  const getDrawable = (id: DrawableID) => {
    return DEFAULT_COMPONENTS.find((v) => v.id === id);
  };

  const selectDrawItem = (id: DrawableID) => {
    const selected = DEFAULT_COMPONENTS.find((v) => v.id === id);
    if (selected) {
      setToolState('drawItem', selected.id);
    }
  };

  const isDrawItemActive = createSelector(() => toolState.drawItem);

  /** SELECTION */

  /**
   * @param ids - Id(s) for components to select
   * @description
   * When an array of ids is passed, they will be selected. They can not be all unselected.
   *
   * If single id is passed, if the component is already selected it will remove it from the selection.
   * Otherwise, it will add it to the selection.
   */
  const toggleSelect = (ids: ComponentID | ComponentID[]) => {
    if (Array.isArray(ids)) {
      setComponentState('selected', ids);
    } else {
      setComponentState('selected', (p) => {
        if (p.includes(ids)) {
          return p.filter((v) => v !== ids);
        }

        return [...p, ids];
      });
    }
  };

  const selectComponent = (id: ComponentID) => {
    setComponentState('selected', (p) => [id]);
  };

  const selectMultipleComponents = (ids: ComponentID[]) => {
    if (ids.length === 0 && componentState.selected.length === 0) return;
    setComponentState('selected', ids);
  };

  const unselectComponent = (id: ComponentID) => {
    setComponentState('selected', (p) => p.filter((selected) => selected !== id));
  };

  const groupSelected = () => {
    const newGroupId = createUniqueId();
    const commonBounds = getCommonBounds(componentState.selectedComponent.map((v) => v.bounds));
    setGroups(newGroupId, {
      id: newGroupId,
      bounds: { left: commonBounds.x, top: commonBounds.y, right: commonBounds.right, bottom: commonBounds.bottom },
      size: { width: commonBounds.right - commonBounds.x, height: commonBounds.bottom - commonBounds.y },
      components: [...componentState.selected],
    });
    for (const selectedId of componentState.selected) {
      setComponentState('components', selectedId, 'groupId', newGroupId);
      // updateComponentPosition(selectedId, (p) => ({
      //   x: p.x - commonBounds.x,
      //   y: p.y - commonBounds.y,
      // }));
    }
  };

  const removeGroup = (groupId: string) => {
    const newGroupState = removeFromObject({ ...groups }, groupId);

    const groupBounds = groups[groupId].bounds;
    const groupPosition = { x: groupBounds.left, y: groupBounds.top };

    for (const component of groups[groupId].components) {
      setComponentState('components', component, 'groupId', undefined);
      updateComponentPosition(component, (p) => ({
        x: p.x + groupPosition.x,
        y: p.y + groupPosition.y,
      }));
    }

    setGroups(newGroupState);
  };

  const getComponentsInGroup = (groupId: string) => {
    return groups[groupId].components;
  };

  const deleteComponent = (toRemove: ComponentID) => {
    let newState = removeFromObject({ ...componentState.components }, toRemove);

    setComponentState('selected', (p) => p.filter((id) => id !== toRemove));
    setComponentState('components', reconcile(newState));
  };

  const clearSelection = () => setComponentState('selected', []);

  const createNewComponent = (component: ILayoutComponent) => {
    setComponentState('maxLayer', component.layer);
    setComponentState('components', (p) => ({
      ...p,
      [component.id]: { ...component },
    }));
  };

  onMount(() => {
    const canvasBounds = document.getElementById('canvas')!.getBoundingClientRect();

    setCanvasBounds({
      x: canvasBounds.left,
      y: canvasBounds.top,
      width: canvasBounds.width,
      height: canvasBounds.height,
    });
  });

  const contextValues = {
    // States
    canvasBounds,
    componentState,
    groups,
    toolState,

    // Component updates
    updateComponentPosition,
    updateComponentSize,
    updateComponentName,

    // Selection
    toggleSelect,
    selectComponent,
    unselectComponent,
    selectMultipleComponents,
    clearSelection,

    // Groups
    getComponentsInGroup,
    groupSelected,
    removeGroup,

    // Delete/Create component
    deleteComponent,
    createNewComponent,

    // Drawable
    getDrawable,

    // Layers
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
        <TreeProvider>
          <div class="flex flex-col justify-center w-full h-full overflow-y-hidden gap-4">
            <Menu />
            <Toolbar activeTool={toolState.activeTool} setActiveTool={(tool) => setToolState('activeTool', tool)} />
            <div class="flex items-start justify-evenly max-h-2xl">
              <Layers components={componentState.components} selectedComponents={componentState.selectedComponent} />
              <LayoutCanvas
                components={componentState.components}
                selectedComponents={componentState.selectedComponent}
              />
              <Preview components={componentState.components} selectedComponent={componentState.selectedComponent} />
              <CssEditor />
            </div>
            <div
              class="w-fit bg-dark-5 h-fit p-5 flex flex-wrap gap-4 content-start self-center rounded-md"
              onMouseDown={(e) => e.preventDefault()}
            >
              <For each={DEFAULT_COMPONENTS}>
                {(comp) => (
                  <ComponentDisplay {...comp} active={isDrawItemActive(comp.id)} selectTool={selectDrawItem} />
                )}
              </For>
            </div>
          </div>
        </TreeProvider>
      </BuilderContext.Provider>
    </MenuProvider>
  );
};

export default LayoutBuilder;

interface BuilderContextValues {
  // States
  canvasBounds: Accessor<{
    width: number;
    height: number;
    x: number;
    y: number;
  }>;
  componentState: ComponentState;
  groups: GroupList;
  toolState: ToolState;

  // Component updates
  updateComponentPosition: (id: ComponentID, newPosition: XYPosition | ((previous: XYPosition) => XYPosition)) => void;
  updateComponentSize: (id: ComponentID, newSize: Size | ((previous: Size) => Size)) => void;
  updateComponentName: (id: ComponentID, newName: ComponentID) => void;

  // Selection
  toggleSelect: (ids: ComponentID | ComponentID[]) => void;
  selectComponent: (id: ComponentID) => void;
  unselectComponent: (id: ComponentID) => void;
  selectMultipleComponents: (ids: ComponentID[]) => void;
  clearSelection: () => void;

  // Groups
  getComponentsInGroup: (groupId: string) => string[];
  groupSelected: () => void;
  removeGroup: (groupId: string) => void;

  // Delete/Create component
  deleteComponent: (id: ComponentID) => void;
  createNewComponent: (component: ILayoutComponent) => void;

  // Drawable
  getDrawable: (id: DrawableID) => Pick<ILayoutComponent, 'id' | 'name' | 'color' | 'css'> | undefined;

  // Layers
  layerControls: {
    sendBackward: (id: ComponentID) => void;
    sendToBack: (id: ComponentID) => void;
    bringForward: (id: ComponentID) => void;
    bringToFront: (id: ComponentID) => void;
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

  return (
    <div
      class={`comp-lined-${
        props.color
      }-30 flex items-center rounded-sm  justify-center cursor-pointer select-none w-24 h-10 ${
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
