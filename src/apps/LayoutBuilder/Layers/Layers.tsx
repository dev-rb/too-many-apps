import { BiRegularLayerMinus, BiRegularLayerPlus } from 'solid-icons/bi';
import { createMemo, For } from 'solid-js';
import { ILayoutComponent, useBuilder } from '..';
import Layer from './LayerItem';

interface LayersProps {
  components: { [key: string]: ILayoutComponent };
  selectedComponents: ILayoutComponent[];
}

const Layers = (props: LayersProps) => {
  const builder = useBuilder();

  const sendBackward = () => {
    if (props.selectedComponents?.length === 1) {
      builder.layerControls.sendBackward(props.selectedComponents[0].id);
    }
  };

  const bringForward = () => {
    if (props.selectedComponents) {
      builder.layerControls.bringForward(props.selectedComponents[0].id);
    }
  };

  const isComponentActive = (id: string) => builder.componentState.selected?.includes(id);
  const anySelected = () => props.selectedComponents;

  const sortedComponents = createMemo(() => Object.values(props.components).sort((a, b) => b.layer - a.layer));

  return (
    <div class="flex flex-col bg-dark-5 w-72 p-2 h-full mb-4">
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
      <div class="custom-v-scrollbar flex flex-col gap-2 mt-4 overflow-auto">
        <For each={sortedComponents()}>
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

export default Layers;
