import { mergeProps, createSignal, Show, For, createMemo } from 'solid-js';
import { ILayoutComponent, useBuilderContext } from '.';
import { TransformOp } from './LayoutCanvas';

const styleTypes = {
  lines: (color: string = 'blue', opacity: number = 100) =>
    `bg-${color}/${opacity} border-${color}-4 border-1 lines-gradient to-${color}-4/50`,
  outline: (color: string = 'blue', opacity: number = 100) =>
    `bg-${color}/${opacity} border-${color}-4 border-1 color-${color}-6`,
};

interface LayoutComponentProps extends ILayoutComponent {
  selectElement: (id: string) => void;
  active: boolean;
  setTransformOp: (op: TransformOp) => void;
  currentTransformOp: TransformOp;
  variant: keyof typeof styleTypes;
}

const LayoutComponent = (props: LayoutComponentProps) => {
  props = mergeProps({ color: 'white', size: { width: 96, height: 40 }, variant: 'lines' }, props);

  const selectElement = () => props.selectElement(props.id);
  const onMouseDown = (e: MouseEvent, type: 'drag' | 'resize') => {
    e.preventDefault();
    if (props.currentTransformOp === 'resize') {
      return;
    }
    selectElement();
    props.setTransformOp(type);
  };

  const colorOpacity = createMemo(() => (props.active ? 40 : 30));

  const style = createMemo(() => styleTypes[props.variant](props.color, colorOpacity()));

  return (
    <div
      id={props.id}
      class={`${style()} flex items-center justify-center cursor-pointer select-none`}
      style={{
        position: 'absolute',
        transform: `translate(${props.position.x}px, ${props.position.y}px)`,
        width: `${props.size!.width}px`,
        height: `${props.size!.height}px`,
        'z-index': props.layer,
      }}
      onMouseDown={(e) => onMouseDown(e, 'drag')}
    >
      {/* <div
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
      <div class="text-xl absolute top-50% left-50% -translate-x-50%  color-black w-full h-full">
        Width: {props.size.width} {'\n'}
        Height: {props.size.height}
      </div> */}
      <div class="text-xl absolute bottom-0 right-0   color-black ">{props.id}</div>
      <div class="text-xl absolute top-50% left-50% -translate-x-50% -translate-y-50%  color-black w-full h-full">
        <p>
          Children: <For each={props.children}>{(child) => <>{child}</>}</For>
        </p>
        <p> Parent: {props.parent} </p>
      </div>
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
      <p class="font-400 "> {props.name} </p>
    </div>
  );
};

export default LayoutComponent;