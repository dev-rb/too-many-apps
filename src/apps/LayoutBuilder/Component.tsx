import { mergeProps, createSignal, createEffect } from 'solid-js';
import { ZERO_POS } from '~/constants';
import { ILayoutComponent } from '.';

interface LayoutComponentProps extends ILayoutComponent {
  resize: (e: MouseEvent) => void;
  selectElement: (id: string) => void;
  active: boolean;
}

const LayoutComponent = (props: LayoutComponentProps) => {
  props = mergeProps({ color: 'white', size: { width: 96, height: 40 } }, props);

  const [position, setPosition] = createSignal(props.position ?? ZERO_POS, {
    equals: false,
  });

  const selectElement = () => props.selectElement(props.id);
  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    selectElement();
  };

  const onHandleMouseDown = (e: MouseEvent) => {
    selectElement();
    props.resize?.(e);
  };

  createEffect(() => {
    setPosition(props.position ?? ZERO_POS);
  });

  const colorOpacity = () => (props.active ? 50 : 30);

  const getBackgroundStyles = () =>
    `bg-${props.color}/${colorOpacity()} border-${props.color}-4 border-1 rounded-sm lines-gradient to-${
      props.color
    }-4/50`;

  return (
    <div
      class={`${getBackgroundStyles()} flex items-center justify-center cursor-pointer select-none `}
      style={{
        position: props.position ? 'fixed' : 'relative',
        transform: `translate(${position().x}px, ${position().y}px)`,
        width: `${props.size!.width}px`,
        height: `${props.size!.height}px`,
      }}
      onMouseDown={onMouseDown}
    >
      <div
        class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -top-1.5 -left-1.5 cursor-nw-resize hover:(border-white border-2) active:(border-white border-2)`}
        onMouseDown={onHandleMouseDown}
      />
      <div
        class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -top-1.5 -right-1.5 cursor-ne-resize hover:(border-white border-2) active:(border-white border-2)`}
        onMouseDown={onHandleMouseDown}
      />
      <div
        class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -bottom-1.5 -left-1.5 cursor-sw-resize hover:(border-white border-2) active:(border-white border-2)`}
        onMouseDown={onHandleMouseDown}
      />
      <div
        class={`bg-${props.color}-5/40 w-3 h-3 rounded-full border-white/50 border-1 absolute -bottom-1.5 -right-1.5 cursor-se-resize hover:(border-white border-2) active:(border-white border-2)`}
        onMouseDown={onHandleMouseDown}
      />
      <p class="font-600 color-white"> {props.name} </p>
    </div>
  );
};

export default LayoutComponent;
