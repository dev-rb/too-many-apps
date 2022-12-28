import { For, Show } from 'solid-js';
import { MenuItem } from './MenuItem';
import { useMenu } from './MenuProvider';

export const Menu = () => {
  const menu = useMenu();

  const translate = () => {
    const { x, y } = menu.position();

    return `translate(${x}px, ${y}px)`;
  };

  return (
    <Show when={menu.visible()}>
      <div class="absolute w-full h-full top-0 left-0 z-9999" onPointerUp={menu.hide}>
        <div
          class="w-fit p-2 h-fit bg-gray-8 select-none flex flex-col gap-2 rounded-sm"
          style={{
            transform: translate(),
          }}
        >
          <For each={menu.options()}>{(option) => <MenuItem {...option} />}</For>
        </div>
      </div>
    </Show>
  );
};
