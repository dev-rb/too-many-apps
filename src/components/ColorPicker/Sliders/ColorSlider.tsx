import { createEffect, createMemo, createSignal, For, JSX, mergeProps, on, splitProps } from 'solid-js';
import Thumb from '../Thumb';
import { useMove } from '~/hooks/useMouseMove';
import { XYPosition } from '~/types';

export interface BaseColorSliderProps {
  value: number;
  onChange: (value: number) => void;
  direction?: 'horizontal' | 'vertical';
}

interface ColorSliderProps extends BaseColorSliderProps {
  overlays: JSX.CSSProperties[];
  maxValue: number;
  thumbColor?: string;
}

type DivProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange'>;
type AllProps = ColorSliderProps & DivProps;

const ColorSlider = (props: AllProps) => {
  let containerRef!: HTMLDivElement;
  props = mergeProps({ direction: 'horizontal' as 'horizontal' | 'vertical' }, props);
  const [local, rest] = splitProps(props, ['value', 'onChange', 'overlays', 'maxValue', 'thumbColor', 'direction']);

  const propValue = createMemo(() => local.value);

  const [position, setPosition] = createSignal<XYPosition>(
    {
      y: (local.direction && local.direction === 'horizontal' ? 0.5 : propValue() / local.maxValue) ?? 0.5,
      x:
        (local.direction && local.direction === 'vertical' ? 0.5 : propValue() / local.maxValue) ??
        propValue() / local.maxValue,
    },
    { equals: false }
  );

  createEffect(
    on(propValue, () => {
      setPosition({
        y: (local.direction && local.direction === 'horizontal' ? 0.5 : propValue() / local.maxValue) ?? 0.5,
        x:
          (local.direction && local.direction === 'vertical' ? 0.5 : propValue() / local.maxValue) ??
          propValue() / local.maxValue,
      });
    })
  );

  useMove(
    () => containerRef,
    ({ x, y }) => local.onChange((local.direction === 'horizontal' ? x : y) * local.maxValue)
  );

  return (
    <div
      ref={containerRef}
      class={'relative box-border outline-0 pointer-events-auto'}
      role="slider"
      aria-valuenow={local.value}
      aria-valuemax={local.maxValue}
      aria-valuemin={0}
      onMouseDown={(e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      {...rest}
      style={{
        ...(typeof rest.style === 'object' ? rest.style : {}),
        'min-height': local.direction === 'horizontal' ? '14px' : '100%',
        'min-width': local.direction === 'horizontal' ? '100%' : '14px',
      }}
    >
      <For each={local.overlays}>
        {(layer) => (
          <div
            class={'absolute box-border top-0 bottom-0 -left-5px -right-5px rounded-1000px'}
            style={{
              ...layer,
              top: local.direction === 'horizontal' ? 0 : -12 / 2 - 1 + 'px',
              bottom: local.direction === 'horizontal' ? 0 : -12 / 2 - 1 + 'px',
              left: local.direction === 'vertical' ? 0 : -12 / 2 - 1 + 'px',
              right: local.direction === 'vertical' ? 0 : -12 / 2 - 1 + 'px',
            }}
          />
        )}
      </For>
      <Thumb position={position()} style={{ top: '1px', 'background-color': local.thumbColor }} />
    </div>
  );
};

export default ColorSlider;
