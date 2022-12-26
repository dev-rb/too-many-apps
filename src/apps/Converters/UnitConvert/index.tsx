import { copyToClipboard, makeClipboard } from '@solid-primitives/clipboard';
import { BiRegularX, BiSolidCheckCircle } from 'solid-icons/bi';
import { createSignal, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import ColorInput from '../ColorConvert/ColorInput';
import ConverterWrapper from '../ConverterWrapper';
import { UNIT_FORMATS, UnitFormat } from './distance';

const UnitConvert = () => {
  const [write] = makeClipboard();
  const [copied, setCopied] = createSignal<string | false>(false);
  const [state, setState] = createStore({
    activeFormat: 'meter',
    value: '',
  });
  const toFormats = () => UNIT_FORMATS.filter((val) => val !== state.activeFormat);

  let timerId: NodeJS.Timeout | undefined = undefined;
  const copyToClipboard = (format: string, value?: string) => {
    write(value);
    setCopied(format);

    if (timerId) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  const convertUnit = (format: UnitFormat, value: string) => {
    return '';
  };

  return (
    <ConverterWrapper>
      <div class="relative">
        <CloseButton closeConverter={() => {}} />

        <div class="flex flex-col bg-dark-7 min-w-sm pl-2 rounded-2 border-dark-4 border-1">
          <div class="flex items-center gap-2 w-full">
            <div class="flex items-center justify-around w-full">
              <For each={toFormats()}>
                {(format, index) => (
                  <div
                    class="flex flex-col px-4 border-l-dark-4 border-l-2 w-full py-2 hover:bg-dark-5 cursor-pointer"
                    classList={{
                      ['rounded-r-2']: index() === toFormats().length - 1,
                    }}
                    onClick={() => copyToClipboard(format, convertUnit(format, state.value))}
                  >
                    <div class="flex justify-between">
                      <h1 class="text-4 color-dark-3 uppercase w-fit">{format}</h1>
                      <div class="text-3 font-bold color-dark-2">
                        {/* <Show when={copied() && copied() === format} fallback={<> COPY </>}>
                        <div class="flex items-center gap-1 color-green">
                          <BiSolidCheckCircle size={15} />
                          COPIED
                        </div>
                      </Show> */}
                      </div>
                    </div>
                    <div class="flex whitespace-nowrap justify-between items-center gap-4">
                      <h1 class="text-2xl font-600 color-dark-1 text-center tracking-wide select-none">
                        {/* {formatColor(format, state.value)} */}
                      </h1>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>
    </ConverterWrapper>
  );
};

export default UnitConvert;

interface CloseButtonProps {
  closeConverter: () => void;
}

const CloseButton = (props: CloseButtonProps) => {
  return (
    <button
      title="Close this converter"
      class="absolute -top-4 -left-4 bg-dark-5 rounded-xl w-8 h-8 flex items-center justify-center text-2xl color-white appearance-none border-none cursor-pointer hover:bg-dark-4"
      onClick={props.closeConverter}
    >
      <BiRegularX />
    </button>
  );
};
