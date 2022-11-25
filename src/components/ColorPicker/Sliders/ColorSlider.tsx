import { Box, css, PropsOf } from '@hope-ui/solid';
import { CSSProperties } from '@stitches/core';
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  mergeProps,
  on,
  splitProps,
} from 'solid-js';
import Thumb from '../Thumb';
import { useMove } from '~/hooks/useMouseMove';
import { XYPosition } from '~/types';

const sliderStyles = css({
  position: 'relative',
  boxSizing: 'border-box',
  // mx: 8,
  outline: 0,
  pointerEvents: 'all',
});

const sliderOverlayStyles = css({
  position: 'absolute',
  boxSizing: 'border-box',
  top: 0,
  bottom: 0,
  left: -12 / 2 - 1,
  right: -12 / 2 - 1,
  borderRadius: 1000,
});

export interface BaseColorSliderProps {
  value: number;
  onChange: (value: number) => void;
  direction?: 'horizontal' | 'vertical';
}

interface ColorSliderProps extends BaseColorSliderProps {
  overlays: CSSProperties[];
  maxValue: number;
  thumbColor?: string;
}

type AllProps = ColorSliderProps & PropsOf<typeof Box>;

const ColorSlider = (props: AllProps) => {
  let containerRef!: HTMLDivElement;
  props = mergeProps(
    { direction: 'horizontal' as 'horizontal' | 'vertical' },
    props
  );
  const [local, rest] = splitProps(props, [
    'value',
    'onChange',
    'overlays',
    'maxValue',
    'thumbColor',
    'direction',
  ]);

  const propValue = createMemo(() => local.value);

  const [position, setPosition] = createSignal<XYPosition>(
    {
      y:
        (local.direction && local.direction === 'horizontal'
          ? 0.5
          : propValue() / local.maxValue) ?? 0.5,
      x:
        (local.direction && local.direction === 'vertical'
          ? 0.5
          : propValue() / local.maxValue) ?? propValue() / local.maxValue,
    },
    { equals: false }
  );

  createEffect(
    on(propValue, () => {
      setPosition({
        y:
          (local.direction && local.direction === 'horizontal'
            ? 0.5
            : propValue() / local.maxValue) ?? 0.5,
        x:
          (local.direction && local.direction === 'vertical'
            ? 0.5
            : propValue() / local.maxValue) ?? propValue() / local.maxValue,
      });
    })
  );

  useMove(
    () => containerRef,
    ({ x, y }) =>
      local.onChange(
        (local.direction === 'horizontal' ? x : y) * local.maxValue
      )
  );

  return (
    <Box
      ref={containerRef}
      class={sliderStyles()}
      role="slider"
      aria-valuenow={local.value}
      aria-valuemax={local.maxValue}
      aria-valuemin={0}
      onMouseDown={(e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      __baseStyle={{
        minHeight: local.direction === 'horizontal' ? '14px' : '100%',
        minWidth: local.direction === 'horizontal' ? '100%' : '14px',
      }}
      {...rest}
    >
      <For each={local.overlays}>
        {(layer) => (
          <Box
            class={sliderOverlayStyles()}
            css={{ ...layer }}
            __baseStyle={{
              top: local.direction === 'horizontal' ? 0 : -12 / 2 - 1,
              bottom: local.direction === 'horizontal' ? 0 : -12 / 2 - 1,
              left: local.direction === 'vertical' ? 0 : -12 / 2 - 1,
              right: local.direction === 'vertical' ? 0 : -12 / 2 - 1,
            }}
          />
        )}
      </For>
      <Thumb
        position={position()}
        css={{ top: 1, backgroundColor: local.thumbColor }}
      />
    </Box>
  );
};

export default ColorSlider;
