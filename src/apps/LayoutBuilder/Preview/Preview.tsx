import { createMemo, Match, Switch } from 'solid-js';
import { createSignal, For, Index, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { ILayoutComponent, useBuilder } from '..';
import { TreeView, HtmlView, CssView } from './views';

const views = [
  { name: 'Tree', view: () => TreeView },
  { name: 'HTML', view: () => HtmlView },
  { name: 'CSS', view: () => CssView },
];

interface PreviewProps {
  components: { [key: string]: ILayoutComponent };
  selectedComponent: ILayoutComponent[];
}

const Preview = (props: PreviewProps) => {
  const builder = useBuilder();

  const [activeView, setActiveView] = createSignal(0);

  const translateHighlight = () => `translateX(${activeView() * 101}%)`;

  const noParentComponents = createMemo(() => {
    return Object.values(props.components).filter((v) => v.parent === undefined);
  });

  return (
    <div class="flex flex-col bg-dark-5 w-86 p-2 h-full mb-4">
      <div class="flex justify-between items-center">
        <h1 class="text-lg color-dark-2"> Preview </h1>
      </div>
      <div class="w-full h-[1px] border-t-dark-3 border-t-1 mt-2" />
      <div class={`flex mt-2 w-full bg-dark-4 rounded-r-sm rounded-l-sm relative `}>
        <div
          class="absolute top-0 left-0 bg-blue-7 rounded-sm absolute top-0 h-full w-33% transition-transform"
          style={{ transform: translateHighlight() }}
        />
        <For each={views}>
          {(view, index) => (
            <button
              class="appearance-none border-none bg-transparent outline-none p-2 color-white cursor-pointer w-full rounded-sm transition-colors z-2 select-none"
              onPointerDown={() => setActiveView(index())}
            >
              {view.name}
            </button>
          )}
        </For>
      </div>
      <div class="custom-v-scrollbar flex flex-col mt-4 overflow-auto select-none">
        <Show when={activeView() === 1}>
          <p class="text-sm color-dark-1"> {'<div id="app">'} </p>
        </Show>
        {/* <CanvasTreeView components={props.components} /> */}
        <Switch>
          <Match when={activeView() < 2}>
            <Index each={noParentComponents()}>
              {(component) => (
                <div class="flex flex-col " classList={{ ['ml-4']: activeView() === 1 }}>
                  <Dynamic
                    component={views[activeView()].view()}
                    allLayers={props.components}
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
          </Match>
          <Match when={activeView() === 2}>
            <Index each={Object.values(props.components)}>
              {(component) => (
                <div class="flex flex-col " classList={{ ['ml-4']: activeView() === 1 }}>
                  <CssView {...component()} />
                </div>
              )}
            </Index>
          </Match>
        </Switch>

        <Show when={activeView() === 1}>
          <p class="text-sm color-dark-1"> {'</div>'} </p>
        </Show>
      </div>
    </div>
  );
};

export default Preview;
