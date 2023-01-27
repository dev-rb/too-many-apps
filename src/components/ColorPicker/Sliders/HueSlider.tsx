import { JSX, splitProps } from 'solid-js';
import ColorSlider, { BaseColorSliderProps } from './ColorSlider';

interface HueSliderProps extends BaseColorSliderProps {}

type DivProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange'>;

export const HueSlider = (props: HueSliderProps & DivProps) => {
  const [local, rest] = splitProps(props, ['value', 'onChange', 'direction']);
  return (
    <ColorSlider
      value={local.value}
      onChange={local.onChange}
      maxValue={360}
      thumbColor={`hsl(${local.value}, 100%, 50%)`}
      direction={local.direction}
      overlays={[
        {
          'background-image':
            'linear-gradient(to right,hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),hsl(170,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%))',
        },
        {
          'box-shadow': 'rgba(0, 0, 0, .1) 0px 0px 0px 1px inset, rgb(0, 0, 0, .15) 0px 0px 4px inset',
        },
      ]}
      {...rest}
    />
  );
};
