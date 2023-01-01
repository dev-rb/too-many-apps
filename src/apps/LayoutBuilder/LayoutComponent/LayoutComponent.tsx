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

  const colorOpacity = createMemo(() => (props.active ? 40 : 30));

  const style = createMemo(() => styleTypes[props.variant](props.color, colorOpacity()));

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
    <div
      id={props.id}
      class={`${style()} flex items-center justify-center cursor-pointer select-none hover:border-${props.color}-8/60`}
      style={{
        position: 'absolute',
        transform: `translate3d(${props.bounds.left}px, ${props.bounds.top}px, 0px)`,
        width: `${props.size!.width}px`,
        height: `${props.size!.height}px`,
        'z-index': props.layer,
        'pointer-events': props.passThrough && props.active ? 'none' : 'auto',
      }}
      onPointerDown={onPointerDown}
    >
      <DebugInfo {...props} showHierarchy={false} showId={false} showPositionPoints={false} showSize={false} />

      <Show when={props.active}>
        <div
          class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -top-1.5 -left-1.5 cursor-nw-resize hover:(border-white border-2) active:(border-white border-2)`}
          onPointerDown={props.onResizeStart}
        />
        <div
          class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -top-1.5 -right-1.5 cursor-ne-resize hover:(border-white border-2) active:(border-white border-2)`}
          onPointerDown={props.onResizeStart}
        />
        <div
          class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -bottom-1.5 -left-1.5 cursor-sw-resize hover:(border-white border-2) active:(border-white border-2)`}
          onPointerDown={props.onResizeStart}
        />
        <div
          class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -bottom-1.5 -right-1.5 cursor-se-resize hover:(border-white border-2) active:(border-white border-2)`}
          onPointerDown={props.onResizeStart}
        />
      </Show>
      <p class="font-400 "> {props.name} </p>
    </div>
  );
};

export default LayoutComponent;
