import { JSX, splitProps } from 'solid-js';
import ColorSlider, { BaseColorSliderProps } from './ColorSlider';
import { isHex } from '../converters/colorParse';

interface AlphaSliderProps extends BaseColorSliderProps {
  color: string;
}

type DivProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange'>;
export const AlphaSlider = (props: AlphaSliderProps & DivProps) => {
  const [local, rest] = splitProps(props, ['value', 'onChange', 'color', 'direction']);

  return (
    <ColorSlider
      value={local.value}
      onChange={(val) => local.onChange(Math.round(val * 10 ** 2) / 10 ** 2)}
      maxValue={1}
      direction={local.direction}
      overlays={[
        {
          'background-image': `linear-gradient(45deg, #101113 25%, transparent 25%), 
                    linear-gradient(-45deg, #101113 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #101113 75%), 
                    linear-gradient(-45deg, #5c5f66 75%, #101113 75%)`,
          'background-size': '8px 8px',
          'background-position': '0 0, 0 4px, 4px -4px, -4px 0px',
        },
        {
          'background-image': `linear-gradient(${local.direction === 'horizontal' ? '90deg' : '180deg'}, transparent, ${
            isHex(local.color) ? local.color.substring(0, 7) : local.color
          })`,
        },
        {
          'box-shadow': 'rgba(0, 0, 0, .1) 0px 0px 0px 1px inset, rgb(0, 0, 0, .15) 0px 0px 4px inset',
        },
      ]}
      {...rest}
    />
  );
};
