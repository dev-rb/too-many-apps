import { Box, css, PropsOf } from '@hope-ui/solid';
import { createEffect, createSignal, splitProps } from 'solid-js';
import Thumb from './Thumb';
import { HsvaColor } from './types';
import { useMove } from '~/hooks/useMouseMove';
import { XYPosition } from '~/types';

const containerStyle = css({
  boxSizing: 'border-box',
  position: 'relative',
  height: 120,
  borderRadius: 8,
  pointerEvents: 'all',
});

const overlayStyle = css({
  boxSizing: 'border-box',
  borderRadius: 8,
  position: 'absolute',
  top: -4,
  bottom: -4,
  left: -4,
  right: -4,
});

interface SaturationProps {
  value: HsvaColor;
  color: string;
  onChange: (color: Partial<HsvaColor>) => void;
}

const Saturation = (props: SaturationProps & PropsOf<typeof Box>) => {
  let containerRef!: HTMLDivElement;

  const [local, rest] = splitProps(props, ['value', 'color', 'onChange']);

  const [position, setPosition] = createSignal<XYPosition>(
    { x: local.value.s / 100, y: 1 - local.value.v / 100 },
    {
      equals: (prev, next) => {
        return prev.x !== next.x || prev.y !== next.y;
      },
    }
  );

  useMove(
    () => containerRef,
    ({ x, y }) => {
      local.onChange({ s: Math.round(x * 100), v: Math.round((1 - y) * 100) });
    }
  );

  createEffect(() => {
    setPosition((prev) => {
      prev.x = local.value.s / 100;
      prev.y = 1 - local.value.v / 100;
      return prev;
    });
  });

  return (
    <Box
      class={containerStyle()}
      ref={containerRef}
      role="slider"
      onMouseDown={(e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      {...rest}
    >
      <div
        class={overlayStyle()}
        style={{ 'background-color': `hsl(${local.value.h}, 100%, 50%)` }}
      />

      <div
        class={overlayStyle()}
        style={{
          'background-image': 'linear-gradient(90deg, #fff, transparent)',
        }}
      />

      <div
        class={overlayStyle()}
        style={{
          'background-image': 'linear-gradient(0deg, #000, transparent)',
        }}
      />
      <Thumb position={position()} css={{ backgroundColor: local.color }} />
    </Box>
  );
};

export default Saturation;
