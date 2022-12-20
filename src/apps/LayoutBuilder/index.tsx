import {
  createContext,
  createEffect,
  createSelector,
  createSignal,
  createUniqueId,
  For,
  mergeProps,
  onCleanup,
  onMount,
  useContext,
} from 'solid-js';
import { createStore, reconcile, unwrap } from 'solid-js/store';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
import { Size, XYPosition } from '~/types';
import LayoutComponent from './Component';
import { calculateResize, createNewComponent, isPointInBounds } from './utils';

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

  const [dragState, setDragState] = createStore({
    startPos: ZERO_POS,
    startElPos: ZERO_POS,
    startSize: ZERO_SIZE,
    isDragging: false,
    activeHandle: 'top-left',
  });

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

  const startResize = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (componentState.selected) {
      const currentPosition = componentState.selected.position;
      const currentSize = componentState.selected.size;

      const clickX = e.clientX - componentState.displayBounds.x - currentPosition.x;
      const clickY = e.clientY - componentState.displayBounds.y - currentPosition.y;

      let handle = 'top-left';

      if (Math.abs(clickX) < 10 && Math.abs(clickY) < 10) {
        handle = 'top-left';
      } else if (Math.abs(currentSize.width - clickX) < 10 && Math.abs(clickY) < 10) {
        handle = 'top-right';
      } else if (Math.abs(clickX) < 10 && Math.abs(currentSize.height - clickY) < 10) {
        handle = 'bottom-left';
      } else if (Math.abs(currentSize.width - clickX) < 10 && Math.abs(currentSize.height - clickY) < 10) {
        handle = 'bottom-right';
      }

      setDragState({
        isDragging: true,
        startElPos: currentPosition,
        startPos: {
          x: e.clientX,
          y: e.clientY,
        },
        startSize: currentSize,
        activeHandle: handle,
      });

      document.addEventListener('mousemove', onResize);
      document.addEventListener('mouseup', onMouseUp);
    }
  };

  const onResize = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragState.isDragging && componentState.selected) {
      const { activeHandle, startElPos, startPos, startSize } = unwrap(dragState);

      const distanceToLeft = e.clientX - componentState.displayBounds.x;
      const distanceToTop = e.clientY - componentState.displayBounds.y;

      const newMousePos = { x: e.clientX - startPos.x, y: e.clientY - startPos.y };

      const inBounds = isPointInBounds(
        { x: Math.floor(distanceToLeft), y: Math.floor(distanceToTop) },
        { x: componentState.displayBounds.width, y: componentState.displayBounds.height }
      );

      if (inBounds.x || inBounds.y) {
        const { updatedPos, updatedSize } = calculateResize(startSize, startElPos, newMousePos, activeHandle);
        updateComponentPosition(componentState.selected?.id, (p) => ({
          x: inBounds.x ? updatedPos.x : p.x,
          y: inBounds.y ? updatedPos.y : p.y,
        }));
        updateComponentSize(componentState.selected?.id, (p) => ({
          width: inBounds.x ? updatedSize.width : p.width ?? 0,
          height: inBounds.y ? updatedSize.height : p.height ?? 0,
        }));
      }
    }
  };

  const onDrawStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (toolState.selectedComponent) {
      setDragState({
        isDragging: true,
        startPos: {
          x: e.clientX,
          y: e.clientY,
        },
      });

      const newComp = createNewComponent(
        toolState.selectedComponent.name,
        {
          x: e.clientX - componentState.displayBounds.x,
          y: e.clientY - componentState.displayBounds.y,
        },
        toolState.selectedComponent.color
      );

      setComponentState((p) => {
        let components = [...p.components, newComp];

        return {
          ...p,
          components,
          selected: { ...newComp },
        };
      });
      document.addEventListener('mousemove', onDraw);
      document.addEventListener('mouseup', onMouseUp);
    }
  };

  const onDraw = (e: MouseEvent) => {
    e.preventDefault();

    if (dragState.isDragging) {
      const startPos = dragState.startPos;

      const newWidth = e.clientX - startPos.x;
      const newHeight = e.clientY - startPos.y;

      const distanceToLeft = e.clientX - componentState.displayBounds.x;
      const distanceToTop = e.clientY - componentState.displayBounds.y;

      const inBounds = isPointInBounds(
        { x: distanceToLeft, y: distanceToTop },
        { x: componentState.displayBounds.width, y: componentState.displayBounds.height }
      );

      setComponentState(
        'components',
        (p) => p.id === componentState.selected?.id,
        (p) => ({
          ...p,
          position: {
            x: inBounds.x && newWidth < 0 ? newWidth + startPos.x - componentState.displayBounds.x : p.position?.x ?? 0,
            y:
              inBounds.y && newHeight < 0
                ? newHeight + startPos.y - componentState.displayBounds.y
                : p.position?.y ?? 0,
          },
          size: {
            width: inBounds.x ? Math.abs(newWidth) : p.size?.width ?? 0,
            height: inBounds.y ? Math.abs(newHeight) : p.size?.height ?? 0,
          },
        })
      );
    }
  };

  const onMouseUp = () => {
    setDragState({
      isDragging: false,
    });
    document.removeEventListener('mousemove', onDraw);
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', onMouseUp);
  };

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

    onCleanup(() => {
      document.removeEventListener('mousemove', onDraw);
      document.removeEventListener('mousemove', onResize);
      document.removeEventListener('mouseup', onMouseUp);
    });
  });

  const contextValues = {
    componentState,
    toolState,
    updateComponentPosition,
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
          <div ref={setDisplayRef} class="bg-white w-full h-full" onMouseDown={onDrawStart}>
            <For each={componentState.components}>
              {(comp) => (
                <LayoutComponent
                  {...comp}
                  active={componentState.selected?.id === comp.id}
                  resize={startResize}
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
