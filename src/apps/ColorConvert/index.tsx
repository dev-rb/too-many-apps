import { Button, HStack, VStack, Text } from '@hope-ui/solid';
import { For, mergeProps } from 'solid-js';
import { createStore } from 'solid-js/store';
import InfoCard from '~/components/InfoCard';

const COLOR_FORMATS = ['HEX', 'RGB', 'HSL'] as const;

export const ColorConvert = () => {
  const [state, setState] = createStore({
    value: '#FFFFFF',
  });

  return (
    <div class="w-full flex flex-col gap-8">
      <InfoCard
        header={<InputHeader activeFormat="HEX" colorValue={state.value} />}
      >
        <div class="py-8">
          <h1 class="text-6xl font-600 color-dark-4 text-center tracking-wide select-none">
            {state.value}
          </h1>
        </div>
      </InfoCard>
      <InfoCard
        header={
          <div class="flex">
            <h1 class="text-5 color-dark-3"> RGB </h1>
          </div>
        }
        footer={
          <div class="flex">
            <button class="btn-primary">COPY</button>
          </div>
        }
      >
        <div class="py-4">
          <h1 class="text-3xl font-600 color-dark-2 text-center tracking-wide select-none">
            255, 255, 255
          </h1>
        </div>
      </InfoCard>
    </div>
  );
};

interface InputHeaderProps {
  activeFormat: typeof COLOR_FORMATS[number];
  colorValue?: string;
}

const InputHeader = (props: InputHeaderProps) => {
  props = mergeProps({ colorValue: '#FFFFFF' }, props);
  return (
    <div class="flex gap-2 justify-between items-center">
      <div class="flex gap-2">
        <For each={COLOR_FORMATS}>
          {(format) => (
            <button
              class="btn-primary btn-6"
              classList={{
                ['bg-dark-5 color-dark-2 hover:(bg-dark-4) shadow-none']:
                  props.activeFormat !== format,
              }}
            >
              {format}
            </button>
          )}
        </For>
      </div>
      <div
        class="w-8 h-8 rounded-md"
        style={{ 'background-color': props.colorValue }}
      />
    </div>
  );
};
