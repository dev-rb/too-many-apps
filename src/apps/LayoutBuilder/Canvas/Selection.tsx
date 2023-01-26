import { Show } from 'solid-js';
import { Size, XYPosition } from '~/types';

interface SelectionProps {
  active: boolean;
  position: XYPosition;
  size: Size;
  onHandleClick: (e: MouseEvent) => void;
}

export const Selection = (props: SelectionProps) => {
  return (
    <Show when={props.active}>
      <svg
        x={props.position.x}
        y={props.position.y}
        width={props.size.width}
        height={props.size.height}
        style={{ overflow: 'visible' }}
      >
        <g>
          <Show when={props.active}>
            <rect x={0} y={0} width="100%" height="100%" class="outline-blue-6 outline-1 outline-solid" fill="none" />
            <circle
              cx={0}
              cy={0}
              r={6}
              class={`comp-handle-blue-40 stroke-white/50 stroke-1 cursor-nw-resize hover:(fill-blue-6)`}
              onPointerDown={props.onHandleClick}
            />
            <circle
              cx={'100%'}
              cy={0}
              r={6}
              class={`comp-handle-blue-40 stroke-white/50 stroke-1 cursor-ne-resize hover:(fill-blue-6)`}
              onPointerDown={props.onHandleClick}
            />
            <circle
              cx={0}
              cy={'100%'}
              r={6}
              class={`comp-handle-blue-40 stroke-white/50 stroke-1 cursor-sw-resize hover:(fill-blue-6)`}
              onPointerDown={props.onHandleClick}
            />
            <circle
              cx={'100%'}
              cy={'100%'}
              r={6}
              class={`comp-handle-blue-40 stroke-white/50 stroke-1 cursor-se-resize hover:(fill-blue-6)`}
              onPointerDown={props.onHandleClick}
            />
          </Show>
        </g>
      </svg>
    </Show>
  );
};
