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
  return (
    <div class="flex flex-col mt-2" style={{ 'margin-left': `${12 * props.index}px` }}>
      <div
        class="flex items-center justify-between p-2 rounded-sm relative cursor-pointer after:(content-empty w-full absolute -bottom-2 left-0 mt-2 h-[1px] border-t-dark-4 border-t-1)"
        classList={{
          ['bg-blue-7 hover:bg-blue-6']: isComponentActive(props.id),
          ['bg-dark-4 hover:bg-dark-4']: !isComponentActive(props.id),
          ['before:(content-empty h-full absolute -left-2 top-0 w-[1px] border-l-dark-4 border-l-1 mt-1)']:
            props.index > 0,
        }}
        onClick={() => props.selectLayer(props.id)}
      >
        <div class="flex-col gap-1">
          {/* <p>{props.name}</p> */}
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
