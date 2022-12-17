import { copyToClipboard, makeClipboard } from '@solid-primitives/clipboard';
import { BiRegularX, BiSolidCheckCircle } from 'solid-icons/bi';
import { Show, For, mergeProps, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import {
  hsvaToRgba,
  hsvaToHex,
  hsvaToHsl,
} from '~/components/ColorPicker/converters/hsvaConvert';
import InfoCard from '~/components/InfoCard';
import {
  COLOR_FORMATS,
  ColorFormat,
  identifyFormat,
  parseColor,
} from '~/utils/colors';
import ColorInput from './ColorInput';

interface ColorConverterState {
  activeFormat: ColorFormat;
  value: string;
}

interface ColorConverterProps {
  index: number;
  closeConverter: (index: number) => void;
}

const ColorConverter = (props: ColorConverterProps) => {
  const [write] = makeClipboard();

  const [copied, setCopied] = createSignal<string | false>(false);

  const [state, setState] = createStore<ColorConverterState>({
    activeFormat: 'hex',
    value: '',
  });

  const onColorChange = (newValue: string) => {
    const formatType = identifyFormat(newValue);
    setState((p) => ({
      ...p,
      value: newValue,
      activeFormat: formatType !== 'UNKNOWN' ? formatType : p.activeFormat,
    }));
  };

  const formatColor = (format: ColorFormat, color: string) => {
    const hsva = parseColor(color);
    const hasAlpha = format.endsWith('a') || format === 'hex';

    if (format.includes('rgb')) {
      return hsvaToRgba(hsva, hasAlpha);
    } else if (format === 'hex') {
      return hsvaToHex(hsva);
    } else if (format.includes('hsl')) {
      return hsvaToHsl(hsva, hasAlpha);
    }
  };

  const copyToClipboard = (format: string, value?: string) => {
    write(value);
    setCopied(format);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  return (
    <div class="relative">
      <button
        title="Close this converter"
        class="absolute -top-4 -left-4 bg-dark-5 rounded-xl w-8 h-8 flex items-center justify-center text-2xl color-white appearance-none border-none cursor-pointer hover:bg-dark-4"
        onClick={() => props.closeConverter(props.index)}
      >
        <BiRegularX />
      </button>
      <InfoCard>
        <div class="py-2 flex items-center gap-2">
          <ColorInput value={state.value} onColorChange={onColorChange} />
          <div class="flex items-center justify-around w-full">
            <For
              each={COLOR_FORMATS.filter((val) => val !== state.activeFormat)}
            >
              {(format, index) => (
                <div class="flex flex-col px-4 border-l-dark-4 border-l-2 w-full">
                  <h1 class="text-4 color-dark-3 uppercase w-fit">{format}</h1>
                  <div class="flex whitespace-nowrap justify-between items-center gap-4">
                    <h1 class="text-2xl font-600 color-dark-1 text-center tracking-wide select-none">
                      {formatColor(format, state.value)}
                    </h1>
                    <button
                      class="btn-primary flex gap-1 items-center ml-none"
                      onClick={() =>
                        copyToClipboard(
                          format,
                          formatColor(format, state.value)
                        )
                      }
                    >
                      <Show
                        when={copied() && copied() === format}
                        fallback={<> COPY </>}
                      >
                        <BiSolidCheckCircle size={20} />
                        COPIED
                      </Show>
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </InfoCard>
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

export default ColorConverter;
