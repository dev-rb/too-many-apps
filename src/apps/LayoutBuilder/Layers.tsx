import { BiRegularLayerMinus, BiRegularLayerPlus } from 'solid-icons/bi';
import { createSelector, For } from 'solid-js';
import { useBuilderContext } from '.';

const Layers = () => {
  const builder = useBuilderContext();

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

  const isComponentActive = createSelector(() => builder.componentState.selected);
  const anySelected = () => builder.componentState.selected;
  return (
    <div class="flex flex-col bg-dark-5 w-60 p-2 h-full max-h-xl mb-4">
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
      <div class="custom-v-scrollbar flex flex-col gap-2 mt-4 overflow-auto pr-2">
        <For each={Object.values(builder.componentState.components).sort((a, b) => b.layer - a.layer)}>
          {(component) => (
            <div class="flex flex-col">
              <Layer
                id={component.id}
                layerValue={component.layer}
                name={component.name}
                active={isComponentActive(component.id)}
                selectLayer={(id) => builder.selectComponent(id)}
              />
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

interface LayerProps {
  id: string;
  selectLayer: (compId: string) => void;
  name: string;
  layerValue: number;
  active: boolean;
}

const Layer = (props: LayerProps) => {
  return (
    <div
      class="flex items-center justify-between p-2 rounded-sm relative cursor-pointer"
      classList={{
        ['bg-blue-7 hover:bg-blue-6']: props.active,
        ['bg-dark-4 hover:bg-dark-4']: !props.active,
      }}
      onClick={() => props.selectLayer(props.id)}
    >
      <div class="flex-col gap-1">
        <p>{props.name}</p>
        <p class="text-sm">{props.layerValue}</p>
      </div>
      <p> {props.id} </p>
    </div>
  );
};

export default Layers;
