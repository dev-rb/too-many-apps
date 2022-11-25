import { createEffect, splitProps } from 'solid-js';
import { PropsOf, Box } from '@hope-ui/solid';
import ColorSlider, { BaseColorSliderProps } from './ColorSlider';
import { isHex } from '../converters/colorParse';

interface AlphaSliderProps extends BaseColorSliderProps {
  color: string;
}

type BoxProps = PropsOf<typeof Box>;
export const AlphaSlider = (props: AlphaSliderProps & BoxProps) => {
  const [local, rest] = splitProps(props, [
    'value',
    'onChange',
    'color',
    'direction',
  ]);

  createEffect(() => {
    console.log(local.color);
  });

  return (
    <ColorSlider
      value={local.value}
      onChange={(val) => local.onChange(Math.round(val * 10 ** 2) / 10 ** 2)}
      maxValue={1}
      direction={local.direction}
      overlays={[
        {
          backgroundImage: `linear-gradient(45deg, $neutral9 25%, transparent 25%), 
                    linear-gradient(-45deg, $neutral9 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, $neutral9 75%), 
                    linear-gradient(-45deg, $neutral3 75%, $neutral9 75%)`,
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
        },
        {
          backgroundImage: `linear-gradient(${
            local.direction === 'horizontal' ? '90deg' : '180deg'
          }, transparent, ${
            isHex(local.color)
              ? local.color.substring(0, local.color.length + 1)
              : local.color
          })`,
        },
        {
          boxShadow:
            'rgba(0, 0, 0, .1) 0px 0px 0px 1px inset, rgb(0, 0, 0, .15) 0px 0px 4px inset',
        },
      ]}
      {...rest}
    />
  );
};
