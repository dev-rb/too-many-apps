import { BiRegularPlus } from 'solid-icons/bi';
import { createSignal, For } from 'solid-js';
import ColorConverter from './Converter';

export const ColorConvert = () => {
  const [converters, setConverters] = createSignal([0]);

  const addConverter = () => {
    setConverters((p) => [...p, p.length - 1 + 1]);
  };

  const closeConverter = (index: number) => {
    let copy = converters();
    copy.splice(index, 1);
    setConverters([...copy]);
  };

  return (
    <div class="w-full pt-8 h-full">
      <div class="custom-h-scrollbar w-full flex flex-col gap-6 pt-8 px-4 h-full overflow-x-hidden">
        <For each={converters()}>
          {(_, index) => (
            <ColorConverter index={index()} closeConverter={closeConverter} />
          )}
        </For>
        <button
          class="appearance-none bg-transparent border-dashed border-1 border-dark-4 color-dark-4 flex items-center justify-center gap-4 px-24 text-2xl rounded-md hover:(bg-dark-8) cursor-pointer min-h-16 w-full whitespace-nowrap"
          onClick={addConverter}
        >
          <BiRegularPlus /> Convert Another
        </button>
      </div>
    </div>
  );
};
