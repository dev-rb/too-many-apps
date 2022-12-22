import { mergeProps, createSignal, Show } from 'solid-js';
import { ILayoutComponent, useBuilderContext } from '.';
import { TransformOp } from './LayoutCanvas';

const getBackgroundStyles = (color: string, opacity: string) =>
  `bg-${color}/${opacity} border-${color}-4 border-1 rounded-sm lines-gradient to-${color}-4/50`;

interface LayoutComponentProps extends ILayoutComponent {
  selectElement: (id: string) => void;
  active: boolean;
  setTransformOp: (op: TransformOp) => void;
  currentTransformOp: TransformOp;
}

const LayoutComponent = (props: LayoutComponentProps) => {
  props = mergeProps({ color: 'white', size: { width: 96, height: 40 } }, props);

  const builder = useBuilderContext();

  const [isDragging, setIsDragging] = createSignal(false);

  const selectElement = () => props.selectElement(props.id);
  const onMouseDown = (e: MouseEvent, type: 'drag' | 'resize') => {
    e.preventDefault();
    if (props.currentTransformOp === 'resize') {
      return;
    }
    selectElement();
    props.setTransformOp(type);

    console.log(type);
  };

  const colorOpacity = () => (props.active ? 50 : 30);

  return (
    <div
      class={`${getBackgroundStyles(
        props.color!,
        colorOpacity()!.toString()
      )} flex items-center justify-center cursor-pointer select-none ${props.active ? 'z-10' : ''}`}
      style={{
        position: 'absolute',
        transform: `translate(${props.position.x}px, ${props.position.y}px)`,
        width: `${props.size!.width}px`,
        height: `${props.size!.height}px`,
      }}
      onMouseDown={(e) => onMouseDown(e, 'drag')}
    >
      <div
        class="w-2 h-2 bg-red-7 rounded-full absolute"
        title="height"
        style={{ top: props.size.height + 'px', left: 0 + 'px' }}
      />
      <div
        class="w-2 h-2 bg-green-7 rounded-full absolute"
        title="width"
        style={{ top: 0 + 'px', left: props.size.width + 'px' }}
      />
      <div
        class="w-4 h-4 bg-blue-7 rounded-full absolute"
        title="x position"
        style={{ top: 0 + 'px', left: props.position.x + 'px' }}
      />
      <Show when={props.active}>
        <div
          class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -top-1.5 -left-1.5 cursor-nw-resize hover:(border-white border-2) active:(border-white border-2)`}
          onMouseDown={(e) => onMouseDown(e, 'resize')}
        />
        <div
          class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -top-1.5 -right-1.5 cursor-ne-resize hover:(border-white border-2) active:(border-white border-2)`}
          onMouseDown={(e) => onMouseDown(e, 'resize')}
        />
        <div
          class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -bottom-1.5 -left-1.5 cursor-sw-resize hover:(border-white border-2) active:(border-white border-2)`}
          onMouseDown={(e) => onMouseDown(e, 'resize')}
        />
        <div
          class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -bottom-1.5 -right-1.5 cursor-se-resize hover:(border-white border-2) active:(border-white border-2)`}
          onMouseDown={(e) => onMouseDown(e, 'resize')}
        />
      </Show>
      <p class="font-600 color-white"> {props.name} </p>
    </div>
  );
};

export default LayoutComponent;
