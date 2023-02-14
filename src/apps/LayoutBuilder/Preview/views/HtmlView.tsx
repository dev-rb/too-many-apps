import { For } from 'solid-js';
import { useTree } from '~/apps/LayoutBuilder/TreeProvider';
import { useBuilder } from '../..';
import { TreeViewProps } from './TreeView';

export const HtmlView = (props: TreeViewProps) => {
  const builder = useBuilder();
  const tree = useTree()!;

  const getChildrenLayers = () => props.children.map((val) => props.allLayers[val]);
  const isComponentActive = (id: string) => builder.componentState.selected.includes(id);
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
              children={tree.tree[layer.id].children}
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
