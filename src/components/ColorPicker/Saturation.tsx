import { createEffect, createSignal, JSX, splitProps } from 'solid-js';
import Thumb from './Thumb';
import { HsvaColor } from './types';
import { useMove } from '~/hooks/useMouseMove';
import { XYPosition } from '~/types';

interface SaturationProps {
  value: HsvaColor;
  color: string;
  onChange: (color: Partial<HsvaColor>) => void;
}

type DivProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange'>;

const Saturation = (props: SaturationProps & DivProps) => {
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
    <div
      class={'box-border relative h-30 rounded-2 pointer-events-auto'}
      ref={containerRef}
      role="slider"
      onMouseDown={(e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      {...rest}
    >
      <div
        class={'box-border rounded-2 absolute -top-4px -bottom-4px -left-4px -right-4px'}
        style={{ 'background-color': `hsl(${local.value.h}, 100%, 50%)` }}
      />

      <div
        class={'box-border rounded-2 absolute -top-4px -bottom-4px -left-4px -right-4px'}
        style={{
          'background-image': 'linear-gradient(90deg, #fff, transparent)',
        }}
      />

      <div
        class={'box-border rounded-2 absolute -top-4px -bottom-4px -left-4px -right-4px'}
        style={{
          'background-image': 'linear-gradient(0deg, #000, transparent)',
        }}
      />
      <Thumb position={position()} style={{ 'background-color': local.color }} />
    </div>
  );
};

export default Saturation;
