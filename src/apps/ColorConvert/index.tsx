import { Button, HStack, VStack, Text } from '@hope-ui/solid';
import { makeClipboard } from '@solid-primitives/clipboard';
import { Show } from 'solid-js';
import { For, JSX, mergeProps } from 'solid-js';
import { createStore } from 'solid-js/store';
import { z } from 'zod';
import {
  hsvaToHex,
  hsvaToHsl,
  hsvaToRgba,
} from '~/components/ColorPicker/converters/hsvaConvert';
import InfoCard from '~/components/InfoCard';
import {
  ColorFormat,
  COLOR_FORMATS,
  identifyFormat,
  isColorValid,
  parseColor,
} from '~/utils/colors';

interface ColorConverterState {
  activeFormat: ColorFormat;
  value: string;
  error: string;
}

export const ColorConvert = () => {
  const [write, read] = makeClipboard();

  const [state, setState] = createStore<ColorConverterState>({
    activeFormat: 'hex',
    value: '',
    error: '',
  });

  const onColorChange: JSX.EventHandlerUnion<HTMLInputElement, Event> = (e) => {
    if (!e.currentTarget.value.length) {
      setState('error', '');

      return;
    }

    const validColor = isColorValid(e.currentTarget.value);

    if (!validColor) {
      setState('error', 'Invalid color value');
    } else {
      setState('error', '');
      const formatType = identifyFormat(e.currentTarget.value);
      if (formatType !== 'UNKNOWN') {
        setState('activeFormat', formatType);
      }
    }

    setState('value', e.currentTarget.value);
  };

  const formatColor = (format: ColorFormat, color: string) => {
    const hsva = parseColor(color);

    if (format === 'rgb' || format === 'rgba') {
      return hsvaToRgba(hsva, false);
    } else if (format === 'hex') {
      return hsvaToHex(hsva);
    } else if (format === 'hsl' || format === 'hsla') {
      return hsvaToHsl(hsva, false);
    }
  };

  const copyToClipboard = (value?: string) => {
    write(value);
  };

  return (
    <div class="w-full flex flex-col gap-8">
      <InfoCard
        header={
          <InputHeader
            activeFormat={state.activeFormat}
            colorValue={state.value}
          />
        }
      >
        <div class="py-8 flex flex-col items-center">
          <div class="flex flex-col relative">
            <input
              class="text-4xl font-600 color-dark-1 tracking-wide select-none bg-transparent  outline-none border-x-none border-t-none border-b-dark-6 border-b-2 appearance-none max-w-md placeholder:(text-center color-dark-4)"
              classList={{
                ['border-b-1 border-b-red-7']: state.error.length > 0,
              }}
              type="text"
              value={state.value}
              placeholder={'#FFFFFF'}
              onInput={onColorChange}
            />
            <p class="absolute -bottom-1 left-0 color-red-7 text-xs translate-y-[100%]">
              {state.error}
            </p>
          </div>
          {/* <h1 class="text-6xl font-600 color-dark-4 text-center tracking-wide select-none">
            {state.value}
          </h1> */}
        </div>
      </InfoCard>

      <For each={COLOR_FORMATS.filter((val) => val !== state.activeFormat)}>
        {(format) => (
          <InfoCard
            header={
              <div class="flex">
                <h1 class="text-5 color-dark-2"> {format} </h1>
              </div>
            }
            footer={
              <div class="flex">
                <button
                  class="btn-primary"
                  onClick={() =>
                    copyToClipboard(formatColor(format, state.value))
                  }
                >
                  COPY
                </button>
              </div>
            }
          >
            <div class="py-4">
              <h1 class="text-3xl font-600 color-dark-2 text-center tracking-wide select-none">
                {formatColor(format, state.value)}
              </h1>
            </div>
          </InfoCard>
        )}
      </For>
    </div>
  );
};

interface InputHeaderProps {
  activeFormat: ColorFormat;
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
