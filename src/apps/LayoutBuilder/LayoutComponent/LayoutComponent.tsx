import { mergeProps, Show, For, createMemo, createSignal, onMount, onCleanup } from 'solid-js';
import { ILayoutComponent, useBuilder } from '..';
import { DebugInfo } from './DebugInfo';
import { styleTypes } from './styles';

interface LayoutComponentProps extends ILayoutComponent {
  selectElement: (id: string) => void;
  active: boolean;
  variant: keyof typeof styleTypes;
  onResizeStart: (e: MouseEvent) => void;
  onDragStart: (e: MouseEvent) => void;
  passThrough: boolean;
}

const LayoutComponent = (props: LayoutComponentProps) => {
  props = mergeProps({ color: 'white', size: { width: 96, height: 40 }, variant: 'lines' }, props);

  const builder = useBuilder();
  const selectElement = () => props.selectElement(props.id);

  const [shift, setShift] = createSignal(false);

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();

    if (builder.toolState.activeTool === 'draw') return;
    e.stopPropagation();
    if (shift()) {
      builder.toggleSelect(props.id);
      return;
    }
    if (!builder.componentState.selected.includes(props.id)) {
      selectElement();
    }
    props.onDragStart(e);
  };

  onMount(() => {
    document.addEventListener('keydown', (e) => {
      if (e.shiftKey) {
        setShift(e.shiftKey);
      }
    });
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') {
        setShift(false);
      }
    });
    onCleanup(() => {
      document.removeEventListener('keydown', (e) => {
        if (e.shiftKey) {
          setShift(e.shiftKey);
        }
      });
    });
  });

  return (
    <g
      id={props.id}
      class="w-fit h-fit cursor-pointer select-none"
      style={{
        transform: `translate3d(${props.bounds.left}px, ${props.bounds.top}px, 0px)`,
        'pointer-events': props.passThrough && props.active ? 'none' : 'auto',
        'will-change': 'transform',
      }}
      onPointerDown={onPointerDown}
    >
      {/* <svg class="w-fit h-fit" style={{ display: 'block', overflow: 'visible' }}> */}
      <g>
        <rect
          class={`comp-outline-${props.color}-40 flex items-center justify-center hover:border-${props.color}-8/60`}
          x={0}
          y={0}
          width={`${props.size!.width}`}
          height={`${props.size!.height}`}
          // style={{
          //   position: 'absolute',
          //   transform: `translate3d(${props.bounds.left}px, ${props.bounds.top}px, 0px)`,
          //   width: `${props.size!.width}px`,
          //   height: `${props.size!.height}px`,
          //   'z-index': props.layer,
          //   'pointer-events': props.passThrough && props.active ? 'none' : 'auto',
          // }}
        >
          {/* <DebugInfo {...props} showHierarchy={false} showId={false} showPositionPoints={false} showSize={false} /> */}
        </rect>
        <text
          class={`font-400 fill-${props.color}-6`}
          x={props.size.width / 2}
          y={props.size.height / 2}
          text-anchor="middle"
          dominant-baseline="central"
        >
          {props.name}
        </text>
        <Show when={props.active}>
          <circle
            cx={0}
            cy={0}
            r={6}
            class={`comp-handle-${props.color}-40 border-white/50 border-1 cursor-nw-resize hover:(border-white border-2) active:(border-white border-2)`}
            onPointerDown={props.onResizeStart}
          />
          <circle
            cx={props.size.width}
            cy={0}
            r={6}
            class={`comp-handle-${props.color}-40 border-white/50 border-1 cursor-ne-resize hover:(border-white border-2) active:(border-white border-2)`}
            onPointerDown={props.onResizeStart}
          />
          <circle
            cx={0}
            cy={props.size.height}
            r={6}
            class={`comp-handle-${props.color}-40 stroke-white/50 stroke-1 cursor-sw-resize hover:(stroke-white stroke-2) active:(stroke-white stroke-2)`}
            onPointerDown={props.onResizeStart}
          />
          <circle
            cx={props.size.width}
            cy={props.size.height}
            r={6}
            class={`comp-handle-${props.color}-40 w-3 h-3border-white/50 border-1 cursor-se-resize hover:(border-white border-2) active:(border-white border-2)`}
            onPointerDown={props.onResizeStart}
          />
        </Show>
      </g>
      {/* </svg> */}
    </g>
  );
};

export default LayoutComponent;
