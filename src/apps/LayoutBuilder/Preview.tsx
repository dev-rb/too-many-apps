import { createSelector, createSignal, For, Index, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { ILayoutComponent, useBuilderContext } from '.';

const views = [() => TreeView, () => HtmlView];

const Preview = () => {
  const builder = useBuilderContext();

  const [activeView, setActiveView] = createSignal(0);

  return (
    <div class="flex flex-col bg-dark-5 w-86 p-2 h-full max-h-xl mb-4">
      <div class="flex justify-between items-center">
        <h1 class="text-lg color-dark-2"> Preview </h1>
      </div>
      <div class="w-full h-[1px] border-t-dark-3 border-t-1 mt-2" />
      <div
        class="flex mt-2 w-full bg-dark-4 rounded-r-sm rounded-l-sm relative after:(content-empty bg-blue-7 rounded-sm absolute top-0 h-full w-50% transition-transform)"
        classList={{
          ['after:(translate-x-0)']: activeView() === 0,
          ['after:(translate-x-full)']: activeView() === 1,
        }}
      >
        <button
          class="appearance-none border-none bg-transparent outline-none p-2 color-white cursor-pointer w-full rounded-sm transition-colors z-2"
          onClick={() => setActiveView(0)}
        >
          Tree
        </button>
        <button
          class="appearance-none border-none bg-transparent outline-none p-2 color-white cursor-pointer w-full rounded-sm transition-colors z-2"
          onClick={() => setActiveView(1)}
        >
          HTML
        </button>
      </div>
      <div class="custom-v-scrollbar flex flex-col mt-4 overflow-auto pr-2 select-none h-full">
        <Show when={activeView() === 1}>
          <p class="text-sm color-dark-1"> {'<div id="app">'} </p>
        </Show>
        <Index each={Object.values(builder.componentState.components).filter((v) => v.parent === undefined)}>
          {(component) => (
            <div class="flex flex-col " classList={{ ['ml-4']: activeView() === 1 }}>
              <Dynamic
                component={views[activeView()]()}
                allLayers={builder.componentState.components}
                children={component().children}
                id={component().id}
                depth={0}
                layerValue={component().layer}
                name={component().name}
                selectComponent={(id: string) => builder.selectComponent(id)}
              />
            </div>
          )}
        </Index>
        <Show when={activeView() === 1}>
          <p class="text-sm color-dark-1"> {'</div>'} </p>
        </Show>
      </div>
    </div>
  );
};

export default Preview;

interface TreeViewProps {
  id: string;
  selectComponent: (compId: string) => void;
  name: string;
  layerValue: number;
  allLayers: Record<string, ILayoutComponent>;
  children: string[];
  depth: number;
}

const TreeView = (props: TreeViewProps) => {
  const getChildrenLayers = () => props.children.map((val) => props.allLayers[val]);
  const builder = useBuilderContext();
  const isComponentActive = createSelector(() => builder.componentState.selected);

  const depthMargin = 12 * props.depth;

  return (
    <div
      class="flex flex-col mt-2 relative text-sm"
      classList={{
        [`before:(content-empty h-full absolute left-[${depthMargin}px] top-0 w-[1px] border-l-dark-2 border-l-1)`]:
          true,
      }}
      style={{ 'margin-left': `${depthMargin - 2}px` }}
    >
      <div
        class="flex items-center justify-between p-2 rounded-sm relative cursor-pointer"
        classList={{
          ['bg-blue-7 hover:bg-blue-6']: isComponentActive(props.id),
          ['bg-dark-4 hover:bg-dark-4']: !isComponentActive(props.id),
          ['after:(content-empty w-[8px] absolute top-50% -translate-y-50% -left-2 h-[1px] border-t-dark-2 border-t-1)']:
            props.depth > 0,
        }}
        onClick={() => props.selectComponent(props.id)}
      >
        <div class="flex-col gap-1">
          <p>{props.name}</p>
          {/* <p class="text-sm">{props.layerValue}</p> */}
        </div>
        <p> {props.id} </p>
      </div>
      <For each={getChildrenLayers()}>
        {(layer) => (
          <TreeView
            allLayers={props.allLayers}
            children={layer.children}
            id={layer.id}
            depth={props.depth + 1}
            layerValue={layer.layer}
            name={layer.name}
            selectComponent={props.selectComponent}
          />
        )}
      </For>
    </div>
  );
};

const HtmlView = (props: TreeViewProps) => {
  const builder = useBuilderContext();
  const getChildrenLayers = () => props.children.map((val) => props.allLayers[val]);
  const isComponentActive = createSelector(() => builder.componentState.selected);
  const depthMargin = 12 * props.depth;
  return (
    <div
      class="flex flex-col relative"
      classList={{
        [`before:(content-empty h-full absolute -left-1 top-0 w-[1px] border-l-dark-2 border-l-1)`]: props.depth > 0,
      }}
      style={{ 'margin-left': `${depthMargin}px` }}
    >
      <div
        class="flex flex-col cursor-pointer relative text-sm whitespace-nowrap rounded-sm"
        classList={{
          ['bg-dark-4']: isComponentActive(props.id),
          [`bg-transparent`]: !isComponentActive(props.id),
        }}
      >
        <p class="hover:bg-dark-4" onClick={() => props.selectComponent(props.id)}>
          <span class="color-red-5">&lt;div </span>{' '}
          <span class="color-purple-3">
            id=<span class="color-green-2">"{props.id}"</span>
          </span>{' '}
          <span class="color-purple-3">
            class=<span class="color-green-2">"{props.name}"</span>
          </span>
          <span class="color-red-5">&gt;</span>
          {/* {`<div id="${props.id}" class="${props.name}">`} */}
        </p>
        <For each={getChildrenLayers()}>
          {(layer) => (
            <HtmlView
              allLayers={props.allLayers}
              children={layer.children}
              id={layer.id}
              depth={props.depth + 1}
              layerValue={layer.layer}
              name={layer.name}
              selectComponent={props.selectComponent}
            />
          )}
        </For>
        <p class="color-red-5 hover:bg-dark-4" onClick={() => props.selectComponent(props.id)}>
          {`</div>`}
        </p>
      </div>
    </div>
  );
};
