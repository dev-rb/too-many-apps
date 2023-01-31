import { batch, createEffect, createMemo, createSignal, on } from 'solid-js';
import { isColorValid, parseColor } from './converters/colorParse';
import { convertHsvaTo } from './converters/hsvaConvert';
import Saturation from './Saturation';
import { AlphaSlider, HueSlider } from './Sliders';
import { ColorFormat, HsvaColor } from './types';

interface ColorPickerProps {
  onChange?: (color: string) => void;
  value?: string;
  format?: ColorFormat;
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
}

const ColorPicker = (props: ColorPickerProps) => {
  const format = createMemo(() => {
    return props.format ?? 'hex';
  });

  const propsValue = createMemo(() => {
    return props.value;
  });

  const [colorValue, setColorValue] = createSignal(props.value ?? '#FFF');
  const [parsedColor, setParsedColor] = createSignal(parseColor(colorValue()), {
    equals: false,
  });

  const handleColorChange = (color: Partial<HsvaColor>) => {
    setParsedColor((current) => {
      const next = { ...current, ...color };
      const converted = convertHsvaTo(format(), next);
      setColorValue(converted);
      if (isColorValid(converted)) {
        props.onChange?.(converted);
      }
      return next;
    });
  };

  createEffect(
    on(format, () => {
      if (isColorValid(colorValue())) {
        setColorValue((prev) => convertHsvaTo(format(), parsedColor()));
      }
    })
  );

  createEffect(
    on(propsValue, () => {
      if (propsValue() && isColorValid(propsValue()!)) {
        batch(() => {
          setParsedColor(parseColor(propsValue()!));
          setColorValue(propsValue()!);
        });
      }
    })
  );

  return (
    <div
      ref={props.ref}
      class="panel"
      style={{ width: '240px' }}
      onMouseDown={(e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div class="flex h-full">
        <Saturation color={colorValue()} value={parsedColor()} onChange={handleColorChange} style={{ width: '100%' }} />
        <AlphaSlider
          value={parsedColor().a}
          onChange={(newA) => handleColorChange({ a: newA })}
          direction="vertical"
          color={convertHsvaTo('hex', parsedColor())}
          style={{ 'margin-left': '16px', 'align-self': 'normal' }}
        />
      </div>
      <HueSlider
        value={parsedColor().h}
        onChange={(newH) => handleColorChange({ h: newH })}
        style={{ 'margin-top': '20px' }}
      />
    </div>
  );
};

export default ColorPicker;
