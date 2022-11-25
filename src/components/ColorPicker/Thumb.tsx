import { Box, css, PropsOf } from '@hope-ui/solid';
import { createEffect, splitProps } from 'solid-js';
import { XYPosition } from '~/types';

const thumbStyles = css({
  width: 16,
  height: 16,
  overflow: 'hidden',
  boxSizing: 'border-box',
  position: 'absolute',
  boxShadow: '0 0 1px rgba(0, 0, 0, .6)',
  backgroundColor: 'transparent',
  borderRadius: 9999,
  zIndex: 999,
  border: '2px solid white',
});

interface ThumbProps {
  position: XYPosition;
}

type BoxProps = Omit<PropsOf<typeof Box>, 'position'>;

const Thumb = (props: ThumbProps & BoxProps) => {
  const [local, rest] = splitProps(props, ['position']);

  return (
    <Box
      {...rest}
      class={thumbStyles()}
      style={{
        left: `calc(${local.position.x * 100}% - 8px)`,
        top: `calc(${local.position.y * 100}% - 8px)`,
      }}
    />
  );
};

export default Thumb;
