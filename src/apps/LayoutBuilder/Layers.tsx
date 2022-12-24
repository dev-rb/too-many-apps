import { BiRegularLayerMinus, BiRegularLayerPlus } from 'solid-icons/bi';
import { createEffect, createMemo, createSelector, For, Index, on } from 'solid-js';
import { ILayoutComponent, useBuilderContext } from '.';

interface NestedComponents extends Omit<ILayoutComponent, 'children'> {
  children: ILayoutComponent[];
}

const Layers = () => {
  const builder = useBuilderContext();
  const isComponentActive = createSelector(() => builder.componentState.selected);

  const sendBackward = () => {
    if (builder.componentState.selected) {
      builder.layerControls.sendBackward(builder.componentState.selected);
    }
  };

  const bringForward = () => {
    if (builder.componentState.selected) {
      builder.layerControls.bringForward(builder.componentState.selected);
    }
  };

  const anySelected = () => builder.componentState.selected;

  return (
    <div class="flex flex-col bg-dark-5 min-w-60 p-2 h-full mb-4">
      <div class="flex justify-between items-center">
        <h1 class="text-lg color-dark-2"> Layers </h1>
        <div class="flex gap-2 items-center">
          <button
            class="appearance-none rounded-md w-8 h-8 bg-dark-3 border-none outline-none color-white cursor-pointer disabled:(cursor-not-allowed bg-dark-4 color-dark-2)"
            disabled={!anySelected()}
            title="Send layer backward"
            onClick={sendBackward}
          >
            <BiRegularLayerMinus size={20} />
          </button>
          <button
            class="appearance-none rounded-md w-8 h-8 bg-dark-3 border-none outline-none color-white cursor-pointer disabled:(cursor-not-allowed bg-dark-4 color-dark-2)"
            disabled={!anySelected()}
            title="Bring layer forward"
            onClick={bringForward}
          >
            <BiRegularLayerPlus size={20} />
          </button>
        </div>
      </div>
      <div class="w-full h-[1px] border-t-dark-3 border-t-1 mt-2" />
      <div class="flex flex-col gap-4 mt-4">
        <Index each={Object.values(builder.componentState.components).filter((v) => v.parent === undefined)}>
          {(component) => (
            <div class="flex flex-col">
              <Layer
                allLayers={builder.componentState.components}
                children={component().children}
                id={component().id}
                index={0}
                layerValue={component().layer}
                name={component().name}
                selectLayer={(id) => builder.selectComponent(id)}
              />
            </div>
          )}
        </Index>
      </div>
    </div>
  );
};

export default Layers;

interface LayerProps {
  id: string;
  selectLayer: (compId: string) => void;
  name: string;
  layerValue: number;
  allLayers: Record<string, ILayoutComponent>;
  children: string[];
  index: number;
}

const Layer = (props: LayerProps) => {
  const getChildrenLayers = () => props.children.map((val) => props.allLayers[val]);
  const builder = useBuilderContext();
  const isComponentActive = createSelector(() => builder.componentState.selected);

  const lineHeight = createMemo(() => (props.children.length > 0 ? '8px' : '-50%'));

  const depthMargin = 10 * props.index;

  return (
    <div
      class="flex flex-col mt-2 relative"
      classList={{
        [`before:(content-empty h-[calc(100%)] absolute left-[${depthMargin}px] top-0 w-[1px] border-l-dark-2 border-l-1)`]:
          true,
      }}
      style={{ 'margin-left': `${depthMargin - 2}px` }}
    >
      <div
        class="flex items-center justify-between p-2 rounded-sm relative cursor-pointer"
        classList={{
          ['bg-blue-7 hover:bg-blue-6']: isComponentActive(props.id),
          ['bg-dark-4 hover:bg-dark-4']: !isComponentActive(props.id),
          ['before:(content-empty h-50% absolute -left-2 top-0 w-[1px] border-l-dark-2 border-l-1) after:(content-empty w-[8px] absolute top-50% -translate-y-50% -left-2 h-[1px] border-t-dark-2 border-t-1)']:
            props.index > 0,
        }}
        onClick={() => props.selectLayer(props.id)}
      >
        <div class="flex-col gap-1">
          <p>{props.name}</p>
          <p class="text-sm">{props.layerValue}</p>
        </div>
        <p> {props.id} </p>
      </div>
      <For each={getChildrenLayers()}>
        {(layer, index) => (
          <Layer
            allLayers={props.allLayers}
            children={layer.children}
            id={layer.id}
            index={props.index + 1}
            layerValue={layer.layer}
            name={layer.name}
            selectLayer={props.selectLayer}
          />
        )}
      </For>
    </div>
  );
};
