import {
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
} from 'solid-js';

const COMPONENT_WIDTH = 96;
const SPACING = 24;
const CONTAINER_PADDING = 20;

const LayoutBuilder = () => {
  const [displayRef, setDisplayRef] = createSignal<HTMLDivElement>();
  const [compContainerRef, setCompContainerRef] =
    createSignal<HTMLDivElement>();

  const [displayBounds, setDisplayBounds] = createSignal({
    x: 0,
    y: 0,
    height: 0,
    width: 0,
  });

  const [compContainerBounds, setCompContainerBounds] = createSignal({
    x: 0,
    y: 0,
    height: 0,
    width: 0,
  });

  onMount(() => {
    if (displayRef()) {
      const bounds = displayRef()!.getBoundingClientRect();
      setDisplayBounds({
        x: bounds.left,
        y: bounds.top,
        height: bounds.height,
        width: bounds.height,
      });
    }

    if (compContainerRef()) {
      const bounds = compContainerRef()!.getBoundingClientRect();
      setCompContainerBounds({
        x: bounds.left,
        y: bounds.top,
        height: bounds.height,
        width: bounds.height,
      });
    }
  });

  return (
    <div class="flex flex-col justify-center items-center w-full h-full overflow-y-hidden">
      {/* Visual Display */}
      <div class="flex flex-col w-3xl h-md mb-20">
        {/* Display header */}
        <div class="w-full h-4 bg-dark-5 flex items-center">
          <div class="ml-auto flex gap-2 mr-2">
            <div class="w-2 h-2 bg-green-7 rounded-full" />
            <div class="w-2 h-2 bg-yellow-7 rounded-full" />
            <div class="w-2 h-2 bg-red-7 rounded-full" />
          </div>
        </div>
        {/* Display */}
        <div ref={setDisplayRef} class="bg-white w-full h-full"></div>
      </div>
      {/* Components Box */}
      <div
        ref={setCompContainerRef}
        class="w-full bg-dark-5 h-xl -mb-44 p-5 flex flex-wrap gap-4 content-start"
      >
        <LayoutComponent
          index={0}
          name="Row"
          color="pink"
          position={{
            x: compContainerBounds().x,
            y: compContainerBounds().y,
          }}
        />
        <LayoutComponent
          index={1}
          name="Column"
          color="blue"
          position={{
            x: compContainerBounds().x,
            y: compContainerBounds().y,
          }}
        />
      </div>
    </div>
  );
};

export default LayoutBuilder;

interface LayoutComponentProps {
  index: number;
  name: string;
  color?: string;
  position?: { x: number; y: number };
}

const LayoutComponent = (props: LayoutComponentProps) => {
  props = mergeProps({ color: 'white' }, props);

  const xOffset = props.index * (SPACING + COMPONENT_WIDTH) + CONTAINER_PADDING;
  const yOffset = CONTAINER_PADDING;

  const [compRef, setCompRef] = createSignal<HTMLDivElement>();
  const [isDragging, setIsDragging] = createSignal(false);

  const [startPosition, setStartPosition] = createSignal(
    { x: 0, y: 0 },
    { equals: false }
  );
  const [position, setPosition] = createSignal(
    props.position ?? { x: 0, y: 0 },
    { equals: false }
  );

  const onMouseDown = (e: MouseEvent) => {
    if (compRef()) {
      const compBounds = compRef()!.getBoundingClientRect();
      setIsDragging(true);
      setStartPosition({
        x: e.clientX - compBounds.left + (props.position?.x ?? 0) + xOffset,
        y: e.clientY - compBounds.top + (props.position?.y ?? 0) + yOffset,
      });
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    if (isDragging()) {
      setPosition({
        x: e.clientX - startPosition().x,
        y: e.clientY - startPosition().y,
      });
    }
  };

  const onMouseUp = (e: MouseEvent) => {
    if (isDragging()) {
      setIsDragging(false);
    }
  };

  createEffect(() => {
    if (props.position && compRef()) {
      compRef()!.style.top = (props.position?.y ?? 0) + yOffset + 'px';
      compRef()!.style.left = (props.position?.x ?? 0) + xOffset + 'px';
    }
  });

  onMount(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    onCleanup(() => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    });
  });

  return (
    <div
      ref={setCompRef}
      class={`flex items-center justify-center w-24 h-10 bg-${props.color}/30 border-${props.color}-4 border-1 rounded-sm lines-gradient to-${props.color}-4/50 cursor-move fixed select-none`}
      onMouseDown={onMouseDown}
      style={{ transform: `translate(${position().x}px, ${position().y}px)` }}
    >
      <p class="font-600 color-white"> {props.name} </p>
    </div>
  );
};
