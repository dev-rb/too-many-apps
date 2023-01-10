import { mergeProps, Show, For, createMemo, createSignal, onMount, onCleanup } from 'solid-js';
import { ZERO_POS, ZERO_SIZE } from '~/constants';
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

  const [ref, setRef] = createSignal<SVGGElement>();
  const [canvasBounds, setCanvasBounds] = createSignal({ ...ZERO_POS, ...ZERO_SIZE });

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

  onMount(() => {
    const canvasBounds = document.getElementById('canvas')!.getBoundingClientRect();

    setCanvasBounds({
      x: canvasBounds.left,
      y: canvasBounds.top,
      width: canvasBounds.width,
      height: canvasBounds.height,
    });
  });

  const translate = () => {
    return `translate3d(${props.bounds.left}px, ${props.bounds.top}px, 0)`;
  };

  const scale = () =>
    `scale3d(${props.size.width / canvasBounds().width}, ${props.size.height / canvasBounds().height}, 1)`;

  return (
    <g ref={setRef} id={props.id} class="w-fit h-fit cursor-pointer select-none" onPointerDown={onPointerDown}>
      {/* <foreignObject width={`${props.size!.width}`} height={`${props.size!.height}`} overflow="visible">
        <DebugInfo {...props} showHierarchy={false} showId={false} showPositionPoints={false} showSize={false} />
      </foreignObject> */}
      <g
        style={{
          transform: translate() + scale(),
          'pointer-events': props.passThrough && props.active ? 'none' : 'auto',
          'will-change': 'transform',
        }}
      >
        <rect
          class={`comp-outline-${props.color}-40 flex items-center justify-center hover:border-${props.color}-8/60`}
          x={0}
          y={0}
          width={canvasBounds().width}
          height={canvasBounds().height}
        />
        <text
          class={`font-400 fill-${props.color}-6`}
          x={'50%'}
          y={'50%'}
          text-anchor="middle"
          dominant-baseline="central"
        >
          {props.name}
        </text>
      </g>
    </g>
  );
};

export default LayoutComponent;
