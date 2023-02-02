import { For } from 'solid-js';
import { ILayoutComponent, useBuilder } from '../..';

export interface TreeViewProps {
  id: string;
  selectComponent: (compId: string) => void;
  name: string;
  layerValue: number;
  allLayers: Record<string, ILayoutComponent>;
  children: string[];
  depth: number;
}

export const TreeView = (props: TreeViewProps) => {
  const getChildrenLayers = () => props.children.map((val) => props.allLayers[val]).filter(Boolean);
  const builder = useBuilder();
  const isComponentActive = (id: string) => builder.componentState.selected.includes(id);

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
