import { Show, For } from 'solid-js';
import { ILayoutComponent } from '..';

interface DebugInfoProps extends ILayoutComponent {
  showSize: boolean;
  showPositionPoints: boolean;
  showId: boolean;
  showHierarchy: boolean;
}

export const DebugInfo = (props: DebugInfoProps) => {
  return (
    <>
      <Show when={props.showPositionPoints}>
        <div
          class="w-2 h-2 bg-red-7 rounded-full absolute"
          title="height"
          style={{ top: props.size.height + 'px', left: 0 + 'px' }}
        />
        <div
          class="w-2 h-2 bg-green-7 rounded-full absolute"
          title="width"
          style={{ top: 0 + 'px', left: props.size.width + 'px' }}
        />
        <div
          class="w-4 h-4 bg-blue-7 rounded-full absolute"
          title="x position"
          style={{ top: 0 + 'px', left: props.bounds.left + 'px' }}
        />
      </Show>
      <Show when={props.showSize}>
        <div class="text-xl absolute top-50% left-50% -translate-x-50%  color-black w-full h-full">
          Width: {props.size.width} {'\n'}
          Height: {props.size.height}
        </div>
      </Show>
      <Show when={props.showId}>
        <div class="text-xl absolute bottom-0 right-0   color-black ">{props.id}</div>
      </Show>
      <Show when={props.showHierarchy}>
        <div class="text-xl absolute top-50% left-50% -translate-x-50% -translate-y-50%  color-black w-full h-full">
          <p>
            Children: <For each={props.children}>{(child) => <>{child}</>}</For>
          </p>
          <p> Parent: {props.parent} </p>
        </div>
      </Show>
    </>
  );
};
