import { createEffect, createSignal, For, onMount } from 'solid-js';
import { ILayoutComponent, useBuilder } from '../..';

export interface TreeViewProps {
  id: string;
  selectComponent: (compId: string) => void;
  name: string;
  layerValue: number;
  allLayers: Record<string, ILayoutComponent>;
  children: string[];
  depth: number;
}

interface CanvasTreeViewProps {
  components: Record<string, ILayoutComponent>;
}

export const CanvasTreeView = (props: CanvasTreeViewProps) => {
  const [canvasRef, setCanvasRef] = createSignal<HTMLCanvasElement>();
  const components = () => Object.values(props.components);
  const noParentComponents = () => Object.values(props.components).filter((v) => !v.parent);

  const [canvasContext, setContext] = createSignal<CanvasRenderingContext2D | null | undefined>();

  const builder = useBuilder();

  const drawContainer = (x: number, y: number, color: string) => {
    const canvas = canvasRef();
    const context = canvasContext();

    if (context && canvas) {
      context.fillStyle = color;
      context.roundRect(x, y, canvas?.width! - x, 60, 4);
      context.fill();
      context.fillStyle = 'white';
      context.beginPath();
      return (text: string, side: 'left' | 'right') => {
        const textSize = context.measureText(text);
        if (side === 'left') {
          context.fillText(text, x + textSize.actualBoundingBoxLeft + 10, y + 30);
        } else {
          context.fillText(text, canvas.width - textSize.actualBoundingBoxLeft - 10, y + 30);
        }

        context.globalCompositeOperation = 'destination-over';
        context.beginPath();
        context.strokeStyle = 'white';
        context.moveTo(x, y + 30);
        context.lineTo(x - 10, y + 30);

        context.strokeStyle = 'white';
        context.moveTo(x - 10, y - 30);
        context.lineTo(x - 10, y + 30);
        context.stroke();
        context.globalCompositeOperation = 'source-over';
      };
    }
  };

  const drawComponents = (components: ILayoutComponent[]) => {
    let yOffset = 0;
    for (let i = 0; i < components.length; i++) {
      const container = drawContainer(
        0,
        75 + (i - 1) * 75 + yOffset,
        builder.componentState.selected.includes(components[i].id) ? '#1c7ed6' : '#373A40'
      );
      container?.(components[i].name, 'left');
      container?.(components[i].id, 'right');

      let allChildren = components[i].children.map((v) => props.components[v]);
      let childSize = allChildren.length;

      let depth = 0;
      let idx = 0;

      while (allChildren.length) {
        const child = allChildren.shift();
        if (child) {
          const container = drawContainer(
            40 + depth * 40,
            75 + (idx + i) * 75 + yOffset,
            builder.componentState.selected.includes(child.id) ? '#1c7ed6' : '#373A40'
          );
          container?.(child.name, 'left');
          container?.(child.id, 'right');
          if (child.children.length) {
            allChildren.unshift(...child.children.map((v) => props.components[v]));
            childSize += child.children.length;
            depth += 1;
          } else {
            depth = 0;
          }
          idx += 1;
        }
      }

      yOffset += childSize * 75;
    }
  };

  const startDraw = () => {
    const canvas = canvasRef();
    const context = canvasContext();
    if (context && canvas) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawComponents(noParentComponents());
    }
  };

  createEffect(() => {
    startDraw();
  });

  onMount(() => {
    const canvas = canvasRef();
    const context = canvas?.getContext('2d');
    if (canvas && context) {
      canvas.width = 500;
      canvas.height = 10000;
      context.font = '24px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.imageSmoothingQuality = 'high';
      setContext(context);
    }
  });

  return <canvas ref={setCanvasRef} />;
};

export const TreeView = (props: TreeViewProps) => {
  const getChildrenLayers = () => props.children.map((val) => props.allLayers[val]).filter(Boolean);
  const builder = useBuilder();
  const isComponentActive = (id: string) => builder.componentState.selected.includes(id);

  const depthMargin = 12 * props.depth;

  return (
    <div
      class="flex flex-col mt-2 relative text-sm"
      classList={{
        [`before:(content-empty h-full absolute left-[${depthMargin}px] top-0 w-[1px] border-l-dark-2 border-l-1)`]:
          true,
      }}
      style={{ 'margin-left': `${depthMargin - 2}px` }}
    >
      <div
        class="flex items-center justify-between p-2 rounded-sm relative cursor-pointer"
        classList={{
          ['bg-blue-7 hover:bg-blue-6']: isComponentActive(props.id),
          ['bg-dark-4 hover:bg-dark-4']: !isComponentActive(props.id),
          ['after:(content-empty w-[8px] absolute top-50% -translate-y-50% -left-2 h-[1px] border-t-dark-2 border-t-1)']:
            props.depth > 0,
        }}
        onClick={() => props.selectComponent(props.id)}
      >
        <div class="flex-col gap-1">
          <p>{props.name}</p>
          {/* <p class="text-sm">{props.layerValue}</p> */}
        </div>
        <p> {props.id} </p>
      </div>
      <For each={getChildrenLayers()}>
        {(layer) => (
          <TreeView
            allLayers={props.allLayers}
            children={layer.children}
            id={layer.id}
            depth={props.depth + 1}
            layerValue={layer.layer}
            name={layer.name}
            selectComponent={props.selectComponent}
          />
        )}
      </For>
    </div>
  );
};
