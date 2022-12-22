import { createSelector, For } from 'solid-js';
import { useBuilderContext } from '.';

const Layers = () => {
  const builder = useBuilderContext();
  const isComponentActive = createSelector(() => builder.componentState.selected);

  return (
    <div class="flex flex-col bg-dark-5 min-w-60 p-2 h-full mb-4">
      <h1 class="text-lg color-dark-2"> Layers </h1>
      <div class="w-full h-[1px] border-t-dark-3 border-t-1 mt-2" />
      <div class="flex flex-col gap-4 mt-4">
        <For each={Object.values(builder.componentState.components)}>
          {(component) => (
            <div
              class="flex items-center p-2 rounded-sm relative cursor-pointer after:(content-empty w-full absolute -bottom-2 left-0 mt-2 h-[1px] border-t-dark-4 border-t-1)"
              classList={{
                ['bg-blue-7 hover:bg-blue-6']: isComponentActive(component.id),
                ['bg-dark-5 hover:bg-dark-4']: !isComponentActive(component.id),
              }}
              onClick={() => builder.selectComponent(component.id)}
            >
              {component.name}
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

export default Layers;
