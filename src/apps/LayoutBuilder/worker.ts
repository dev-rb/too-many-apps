import { XYPosition, Size } from '~/types';
import { clamp } from '~/utils/math';
import { ILayoutComponent } from '.';
import { calculateResize } from './utils';

interface TransformState {
  startMousePos: XYPosition;
  startElPos: XYPosition[];
  startSize: Size[];
  startSelectionSize: Size;
  startSelectionPos: XYPosition;
  isTransforming: boolean;
  activeHandle: string;
}
const restrictSize = (
  canvasBounds: {
    width: number;
    height: number;
    x: number;
    y: number;
  },
  position: XYPosition,
  newSize: Size,
  previousSize: Size
) => {
  let newWidth = Math.abs(newSize.width);
  let newHeight = Math.abs(newSize.height);
  if (position.x < 0) {
    newWidth = previousSize.width;
  } else if (Math.floor(canvasBounds.width - (position.x + newWidth)) < 0) {
    newWidth = canvasBounds.width - position.x;
  }
  if (position.y < 0) {
    newHeight = previousSize.height;
  } else if (Math.floor(canvasBounds.height - (position.y + newHeight)) < 0) {
    newHeight = canvasBounds.height - position.y;
  }

  return { width: newWidth, height: newHeight };
};

type TransformOp = 'draw' | 'resize' | 'drag';
const dragUpdate = (
  e: { clientX: number; clientY: number },
  transformState: TransformState,
  transformOp: TransformOp,
  selectedComponents: ILayoutComponent[],
  currentSelection: { size: Size; position: XYPosition },
  canvasBounds: {
    width: number;
    height: number;
    x: number;
    y: number;
  }
) => {
  const selected = selectedComponents.length > 1 ? selectedComponents : selectedComponents[0];
  if (transformState.isTransforming) {
    const { activeHandle, startElPos, startMousePos, startSize, startSelectionSize, startSelectionPos } =
      transformState;

    if (transformOp === 'draw') {
      const newMousePos = { x: e.clientX - startMousePos.x, y: e.clientY - startMousePos.y };
      let { updatedPos: updatedSelectionPos, updatedSize: updatedSelectionSize } = calculateResize(
        startSelectionSize,
        startSelectionPos,
        newMousePos,
        activeHandle
      );

      // console.log(updatedSize.width - startSize.width);
      let selectionStuff = { x: 0, y: 0, width: 0, height: 0 };
      const newSize = restrictSize(canvasBounds, updatedSelectionPos, updatedSelectionSize, currentSelection.size);
      selectionStuff = { x: Math.max(0, updatedSelectionPos.x), y: Math.max(0, updatedSelectionPos.y), ...newSize };
      let copy = [...selectedComponents];
      for (let i = 0; i < startSize.length; i++) {
        let comp = copy[i];
        comp.size = newSize;
        comp.bounds = { ...comp.bounds, left: updatedSelectionPos.x, top: updatedSelectionPos.y };
      }
      return { selection: selectionStuff, copy: [...copy] };
    } else if (transformOp === 'resize') {
      const newMousePos = { x: e.clientX - startMousePos.x, y: e.clientY - startMousePos.y };
      let { updatedPos: updatedSelectionPos, updatedSize: updatedSelectionSize } = calculateResize(
        startSelectionSize,
        startSelectionPos,
        newMousePos,
        activeHandle
      );

      let selectionStuff = { x: 0, y: 0, width: 0, height: 0 };
      const newSize = restrictSize(canvasBounds, updatedSelectionPos, updatedSelectionSize, currentSelection.size);
      selectionStuff = { x: Math.max(0, updatedSelectionPos.x), y: Math.max(0, updatedSelectionPos.y), ...newSize };
      let copy = [...selectedComponents];
      for (let i = 0; i < startSize.length; i++) {
        let comp = copy[i];
        let { updatedPos, updatedSize } = calculateResize(startSize[i], startElPos[i], newMousePos, activeHandle, true);
        comp.bounds = {
          ...comp.bounds,
          left: Math.max(0, updatedPos.x - updatedSelectionPos.x),
          top: Math.max(0, updatedPos.y - updatedSelectionPos.y),
        };
        const restrictedSize = restrictSize(canvasBounds, updatedPos, updatedSize, comp.size);
        comp.size = {
          width: restrictedSize.width,
          height: restrictedSize.height,
        };
      }
      return { selection: selectionStuff, copy: [...copy] };
    } else if (transformOp === 'drag' && selected) {
      let newPos = {
        x: clamp(e.clientX - startMousePos.x, 0, canvasBounds.width - currentSelection.size.width),
        y: clamp(e.clientY - startMousePos.y, 0, canvasBounds.height - currentSelection.size.height),
      };

      const selectionBounds = {
        left: currentSelection.position.x,
        top: currentSelection.position.y,
        bottom: currentSelection.position.y + currentSelection.size.height,
        right: currentSelection.position.x + currentSelection.size.width,
      };
      // const otherComponents = Object.values(components).filter((comp) =>
      //   Array.isArray(selected) ? !selected.includes(comp) : selected.id !== comp.id
      // );

      // const alignDistance = calculateDistances(
      //   selectionBounds,
      //   otherComponents.map((v) => v.bounds)
      // );
      // const xDiff = Math.abs(newPos.x - selectionBounds.left);
      // const xLock = Math.abs(xDiff + alignDistance.xAlign - 2) < 2;
      // if (xLock) {
      //   newPos.x = selectionBounds.left + alignDistance.xAlign;
      // }

      // const yDiff = Math.abs(newPos.y - selectionBounds.top);
      // const yLock = Math.abs(yDiff + alignDistance.yAlign - 2) < 2;
      // if (yLock) {
      //   newPos.y = selectionBounds.top + alignDistance.yAlign;
      // }

      let copy = [...selectedComponents];
      for (let i = 0; i < startElPos.length; i++) {
        let comp = copy[i];
        let newElPos = {
          x: clamp(
            e.clientX - startElPos[i].x,
            comp.bounds.left - newPos.x,
            newPos.x + (comp.bounds.left - selectionBounds.left)
          ),
          y: clamp(
            e.clientY - startElPos[i].y,
            comp.bounds.top - newPos.y,
            newPos.y + (comp.bounds.top - selectionBounds.top)
          ),
        };
        comp.bounds = { ...comp.bounds, left: newElPos.x, top: newElPos.y };
      }
      // setSelectionPosition(newPos);
      return { selection: { ...newPos, ...currentSelection.size }, copy: [...copy] };
    }
  }
};

addEventListener('message', function (ev) {
  if (Object.hasOwn(ev.data, 'mouseDrag')) {
    const calc = dragUpdate(
      ev.data.mousePos,
      ev.data.transformState,
      ev.data.transformOp,
      ev.data.selectedComponents,
      ev.data.currentSelection,
      ev.data.canvasBounds
    );
    this.postMessage(calc);
  }
  // console.log(ev.data);
  // this.postMessage({ test: 234 });
});

export {};
