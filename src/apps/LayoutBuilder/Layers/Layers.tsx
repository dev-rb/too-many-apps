import { BiRegularLayerMinus, BiRegularLayerPlus } from 'solid-icons/bi';
import { createMemo, For, Show } from 'solid-js';
import { useTree } from '~/apps/TreeProvider';
import { ILayoutComponent, useBuilder } from '..';
import Layer from './LayerItem';

interface LayersProps {
  components: { [key: string]: ILayoutComponent };
  selectedComponents: ILayoutComponent[];
}

const Layers = (props: LayersProps) => {
  const builder = useBuilder();
  const tree = useTree()!;

  const sendToBack = () => {
    builder.layerControls.sendToBack(builder.componentState.selected[0]);
  };

  const sendBackward = () => {
    if (props.selectedComponents.length) {
      builder.layerControls.sendBackward(builder.componentState.selected[0]);
    }
  };

  const bringForward = () => {
    if (props.selectedComponents.length) {
      builder.layerControls.bringForward(builder.componentState.selected[0]);
    }
  };

  const bringToFront = () => {
    builder.layerControls.bringToFront(builder.componentState.selected[0]);
  };

  const deleteSelected = () => {
    for (const comp of props.selectedComponents) {
      tree.removeLeaf(comp.id);
      builder.deleteComponent(comp.id);
    }
  };

  const isComponentActive = (id: string) => builder.componentState.selected.includes(id);
  const anySelected = () => props.selectedComponents;

  const sortedComponents = createMemo(() => Object.values(props.components).sort((a, b) => b.layer - a.layer));

  return (
    <div class="flex flex-col bg-dark-5 w-72 p-2 h-full mb-4 relative">
      <div class="flex justify-between items-center">
        <h1 class="text-lg color-dark-2"> Layers </h1>
        <div class="flex items-center">
          <input
            class="appearance-none border-solid border-2 border-dark-3 w-6 h-6 rounded-md outline-none cursor-pointer bg-contain bg-center checked:border-blue-6 relative checked:after:(content-empty absolute w-3 h-3 inset-0.5 m-auto rounded-sm bg-blue-7) hover:border-dark-2"
            type="checkbox"
          />
        </div>
      </div>
      <div class="w-full h-[1px] border-t-dark-3 border-t-1 mt-2" />
      <div class="custom-v-scrollbar flex flex-col gap-2 mt-4 overflow-auto h-full">
        <For each={sortedComponents()}>
          {(component) => (
            <div class="flex flex-col">
              <Layer
                id={component.id}
                layerValue={component.layer}
                name={component.name}
                active={isComponentActive(component.id)}
                selectLayer={(id) => builder.toggleSelect(id)}
              />
            </div>
          )}
        </For>
      </div>
      <Show when={props.selectedComponents.length > 1}>
        <div class="flex items-center w-full absolute bottom-16 left-0 gap-4 px-4">
          <button
            class="appearance-none h-8 px-4 rounded-sm bg-red-8 color-red-1 border-none cursor-pointer flex-1 hover:(bg-red-7 outline-solid outline-2 outline-blue-7)"
            onClick={deleteSelected}
          >
            Delete ({props.selectedComponents.length})
          </button>
          <button class="appearance-none h-8 px-4 rounded-sm bg-dark-3 color-white border-none cursor-pointer flex-1 hover:(outline-solid outline-2 outline-blue-7)">
            Rename ({props.selectedComponents.length})
          </button>
        </div>
      </Show>
      <div class="w-full h-[1px] border-t-dark-3 border-t-1 mt-2" />
      <div class="flex gap-2 items-center justify-center mt-2" onMouseDown={(e) => e.preventDefault()}>
        <button
          class="appearance-none rounded-md w-8 h-8 bg-dark-3 border-none outline-none color-white cursor-pointer disabled:(cursor-not-allowed bg-dark-4 color-dark-2)"
          disabled={!anySelected()}
          title="Send layer to back"
          onClick={sendToBack}
        >
          B
        </button>
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
        <button
          class="appearance-none rounded-md w-8 h-8 bg-dark-3 border-none outline-none color-white cursor-pointer disabled:(cursor-not-allowed bg-dark-4 color-dark-2)"
          disabled={!anySelected()}
          title="Bring layer to front"
          onClick={bringToFront}
        >
          F
        </button>
      </div>
    </div>
  );
};

export default Layers;
