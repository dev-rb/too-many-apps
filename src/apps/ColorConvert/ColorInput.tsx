import { createSignal, Show } from 'solid-js';
import { z, ZodError } from 'zod';
import { VALIDATION_REGEXP } from '~/utils/colors';
import { useClickOutside } from '@hope-ui/solid';
import ColorPicker from '~/components/ColorPicker';

const colorSchema = z
  .string({ description: 'Color Value' })
  .min(3)
  .regex(
    new RegExp(
      Object.values(VALIDATION_REGEXP)
        .map((regex) => regex.source)
        .join('|')
    ),
    {
      message: 'Invalid color value',
    }
  );
interface ColorInputProps {
  value: string;
  onColorChange: (newColorValue: string) => void;
}

const ColorInput = (props: ColorInputProps) => {
  const [isTyping, setIsTyping] = createSignal(false);

  const [error, setError] = createSignal('');

  const [pickerRef, setPickerRef] = createSignal<HTMLElement>();

  const [pickerOpen, setPickerOpen] = createSignal(false);
  useClickOutside({
    element: pickerRef,
    handler: () => {
      setPickerOpen(false);
    },
  });

  const onColorChange = (newValue: string) => {
    if (newValue.length < 1) {
      props.onColorChange('');
      setError('');
      setIsTyping(false);
      return;
    }
    if (!isTyping()) {
      setIsTyping(true);
    }
    try {
      const value = colorSchema.parse(newValue);
      props.onColorChange(value);
      setError('');
    } catch (err) {
      const error = err as ZodError;
      setError(error.issues.map((issue) => issue.message).join('. '));
    }
  };

  return (
    <div class="flex flex-col relative">
      <div class="flex items-center gap-4">
        <div
          class="w-8 h-8 rounded-sm border-1 border-dark-4"
          style={{ background: props.value }}
          onClick={() => setPickerOpen(true)}
        />
        <Show when={pickerOpen()}>
          <div class="absolute top-12 left-0 p-4 bg-dark-5 z-999">
            <ColorPicker ref={setPickerRef} value={props.value} onChange={onColorChange} />
          </div>
        </Show>
        <input
          class="text-xl uppercase color-dark-1 tracking-wide select-none bg-transparent  outline-none border-x-none border-t-none appearance-none max-w-60"
          classList={{
            ['border-b-1 border-b-red-7']: error().length != 0,
            ['border-b-none']: error().length === 0,
          }}
          type="text"
          value={props.value}
          onInput={(e) => onColorChange(e.currentTarget.value)}
        />
        <Show when={!isTyping() && !props.value}>
          <p class="absolute left-50% color-dark-4 font-600 text-4xl -translate-x-50% pointer-events-none">#FFFFFF</p>
        </Show>
      </div>
      <p class="absolute -bottom-1 left-0 color-red-7 text-xs whitespace-nowrap translate-y-[100%]">{error()}</p>
    </div>
  );
};
export default ColorInput;
