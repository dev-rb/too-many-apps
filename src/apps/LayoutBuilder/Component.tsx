import { mergeProps, createSignal, Show, createEffect, on } from 'solid-js';
import { Size, XYPosition } from '~/types';
import { clamp } from '~/utils/math';
import { ILayoutComponent, useBuilderContext } from '.';
import { createTransformable } from './createTransformable';

interface LayoutComponentProps extends ILayoutComponent {
  selectElement: (id: string) => void;
  active: boolean;
}

const LayoutComponent = (props: LayoutComponentProps) => {
  props = mergeProps({ color: 'white', size: { width: 96, height: 40 } }, props);

  const builder = useBuilderContext();

  const [isDragging, setIsDragging] = createSignal<XYPosition | false>(false);

  const [newBounds, { setElement, onResizeStart }] = createTransformable(() => props.active);

  const transformBounds = (bounds: Size & XYPosition) => {
    let newWidth = Math.abs(bounds.width);
    let newHeight = Math.abs(bounds.height);

    const previousSize = { width: props.size.width, height: props.size.height };
    if (bounds.x < 0) {
      newWidth = previousSize.width;
    } else if (Math.floor(builder.componentState.displayBounds.width - (bounds.x + newWidth)) < 0) {
      newWidth = builder.componentState.displayBounds.width - bounds.x;
    }
    if (bounds.y < 0) {
      newHeight = previousSize.height;
    } else if (Math.floor(builder.componentState.displayBounds.height - (bounds.y + newHeight)) < 0) {
      newHeight = builder.componentState.displayBounds.height - bounds.y;
    }

    return {
      x: Math.max(0, Math.round(bounds.x)),
      y: Math.max(0, Math.round(bounds.y)),
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  };

  createEffect(
    on(newBounds, () => {
      const transformedBounds = transformBounds({ ...newBounds() });
      builder.updateComponentPosition(props.id, { ...transformedBounds });
      builder.updateComponentSize(props.id, { ...transformedBounds });
    })
  );

  const selectElement = () => props.selectElement(props.id);
  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    selectElement();
    setIsDragging({
      x: e.clientX - props.position.x,
      y: e.clientY - props.position.y,
    });
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    const dragState = isDragging();
    if (dragState) {
      const newPos = {
        x: clamp(e.clientX - dragState.x, 0, builder.componentState.displayBounds.width - props.size.width),
        y: clamp(e.clientY - dragState.y, 0, builder.componentState.displayBounds.height - props.size.height),
      };

      builder.updateComponentPosition(props.id, newPos);
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  const onHandleMouseDown = (e: MouseEvent) => {
    e.stopPropagation();
    selectElement();
    onResizeStart(e, { x: builder.componentState.displayBounds.x, y: builder.componentState.displayBounds.y });
  };

  const colorOpacity = () => (props.active ? 50 : 30);

  const getBackgroundStyles = () =>
    `bg-${props.color}/${colorOpacity()} border-${props.color}-4 border-1 rounded-sm lines-gradient to-${
      props.color
    }-4/50`;

  return (
    <div
      ref={setElement}
      class={`${getBackgroundStyles()} flex items-center justify-center cursor-pointer select-none ${
        props.active ? 'z-10' : ''
      }`}
      style={{
        position: 'absolute',
        transform: `translate(${props.position.x}px, ${props.position.y}px)`,
        width: `${props.size!.width}px`,
        height: `${props.size!.height}px`,
      }}
      onMouseDown={onMouseDown}
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
      </Show>
      <p class="font-600 color-white"> {props.name} </p>
    </div>
  );
};

export default LayoutComponent;
