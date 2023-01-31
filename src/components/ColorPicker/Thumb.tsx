import { JSX, splitProps } from 'solid-js';
import { XYPosition } from '~/types';

interface ThumbProps {
  position: XYPosition;
}

type BoxProps = JSX.HTMLAttributes<HTMLDivElement>;

const Thumb = (props: ThumbProps & BoxProps) => {
  const [local, rest] = splitProps(props, ['position']);

  return (
    <div
      {...rest}
      class={
        'w-4 h-4 overflow-hidden box-border absolute shadow-[0_0_1px_rgba(0,0,0,.6)] bg-transparent rounded-9999 z-999 border-2 border-solid border-white'
      }
      style={{
        left: `calc(${local.position.x * 100}% - 8px)`,
        top: `calc(${local.position.y * 100}% - 8px)`,
      }}
    />
  );
};

export default Thumb;
