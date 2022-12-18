import { A } from '@solidjs/router';
import {
  BiSolidColor,
  BiSolidLayout,
  BiSolidNote,
  BiSolidRuler,
} from 'solid-icons/bi';
import { createSelector, createSignal, For } from 'solid-js';
import { Dynamic } from 'solid-js/web';

const NAV_ITEMS = [
  { icon: BiSolidColor, name: 'Converters', path: '/' },
  { icon: BiSolidLayout, name: 'Layout', path: '/layout' },
  // { icon: BiSolidRuler, name: 'Units' },
  // { icon: BiSolidNote, name: 'Snippets' },
];

const AppNav = () => {
  const [active, setActive] = createSignal('Converters');

  const selected = createSelector(active);

  return (
    <div class="flex flex-col gap-6 mr-2 pr-8 pl-4 pt-5 border-r-dark-7 border-r-1 select-none">
      <For each={NAV_ITEMS}>
        {(item) => (
          <A
            href={item.path}
            end
            activeClass="color-white hover:before:bg-blue-7 before:bg-blue-6"
            inactiveClass="color-dark-3 hover:before:bg-dark-7 before:bg-transparent"
            class={`flex flex-col justify-center items-center relative py-1 cursor-pointer z-10 before:(content-empty absolute top-0 -left-4 w-full h-full pl-24 rounded-r-lg) before:-z-1 decoration-none`}
            onClick={() => setActive(item.name)}
          >
            <Dynamic component={item.icon} size={35} />
            <p> {item.name} </p>
          </A>
        )}
      </For>
    </div>
  );
};

export default AppNav;
