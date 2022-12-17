import { createSignal } from 'solid-js';
import { z, ZodError } from 'zod';
import { ColorFormat } from '~/utils/colors';

const VALIDATION_REGEXP: Record<ColorFormat, RegExp> = {
  hex: /^#?([0-9A-F]{3,}){1,2}$/i,
  rgb: /^rgb\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/i,
  rgba: /^rgba\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/i,
  hsl: /hsl\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?%)\s*,\s*(\d+(?:\.\d+)?%)\)/i,
  hsla: /^hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*(\d*(?:\.\d+)?)\)$/i,
};

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
  const [error, setError] = createSignal('');

  const onColorChange = (newValue: string) => {
    if (newValue.length < 1) {
      props.onColorChange('');
      setError('');
      return;
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
        />
        <input
          class="text-xl  color-dark-1 tracking-wide select-none bg-transparent  outline-none border-x-none border-t-none appearance-none max-w-60 placeholder-shown:(text-center color-dark-4 font-600 text-4xl)"
          classList={{
            ['border-b-1 border-b-red-7']: error().length != 0,
            ['border-b-none']: error().length === 0,
          }}
          type="text"
          value={props.value}
          placeholder={'#FFFFFF'}
          onInput={(e) => onColorChange(e.currentTarget.value)}
        />
      </div>
      <p class="absolute -bottom-1 left-0 color-red-7 text-xs whitespace-nowrap translate-y-[100%]">
        {error()}
      </p>
    </div>
  );
};
export default ColorInput;
