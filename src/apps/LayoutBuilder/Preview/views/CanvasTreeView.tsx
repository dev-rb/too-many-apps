import { createSignal, createEffect, onMount } from 'solid-js';
import { ILayoutComponent, useBuilder } from '../..';

interface CanvasTreeViewProps {
  components: Record<string, ILayoutComponent>;
}

export const CanvasTreeView = (props: CanvasTreeViewProps) => {
  const [canvasRef, setCanvasRef] = createSignal<HTMLCanvasElement>();

  const noParentComponents = () => Object.values(props.components).filter((v) => !v.parent);

  const [canvasContext, setContext] = createSignal<CanvasRenderingContext2D | null | undefined>();

  const builder = useBuilder();

  const drawContainer = (x: number, y: number, color: string) => {
    const canvas = canvasRef();
    const context = canvasContext();

    if (context && canvas) {
      context.fillStyle = color;
      context.fillRect(x, y, canvas?.width! - x, 60);
      context.fillStyle = 'white';
      return (text: string, side: 'left' | 'right') => {
        const textSize = context.measureText(text);
        if (side === 'left') {
          context.fillText(text, x + textSize.actualBoundingBoxLeft + 10, y + 30);
        } else {
          context.fillText(text, canvas.width - textSize.actualBoundingBoxLeft - 10, y + 30);
        }

        context.globalCompositeOperation = 'destination-over';
        context.strokeStyle = '#909296';
        context.moveTo(x, y + 30);
        context.lineTo(x - 10, y + 30);

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
          depth += 1;
          if (child.children.length) {
            allChildren.unshift(...child.children.map((v) => props.components[v]));
            childSize += child.children.length;
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
      context.beginPath();
      drawComponents(noParentComponents());
    }
  };

  const onCanvasHover = (e: PointerEvent) => {
    const context = canvasContext();

    if (context) {
      // context.isPointInPath();
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

  return <canvas ref={setCanvasRef} onPointerMove={onCanvasHover} />;
};
