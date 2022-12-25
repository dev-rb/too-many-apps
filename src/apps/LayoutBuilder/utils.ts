import { createUniqueId } from 'solid-js';
import { ZERO_SIZE } from '~/constants';
import { Bounds, Size, XYPosition } from '~/types';
import { ILayoutComponent, MIN_LAYER } from '.';

export function calculateResize(currentSize: Size, currentPos: XYPosition, mousePos: XYPosition, handle: string) {
  let updatedSize = { ...currentSize };
  let updatedPos = { ...currentPos };
  if (['bottom-left', 'top-left'].includes(handle)) {
    let newWidth = currentSize.width - mousePos.x;
    let newX = currentPos.x + mousePos.x;
    if (newWidth < 0) {
      newX = currentPos.x + currentSize.width;
    }
    updatedSize.width = newWidth;
    updatedPos.x = newX;
  }

  if (['bottom-left', 'bottom-right'].includes(handle)) {
    let newHeight = currentSize.height + mousePos.y;
    if (newHeight < 0) {
      updatedPos.y = currentPos.y + newHeight;
    }
    updatedSize.height = newHeight;
  }

  if (['top-left', 'top-right'].includes(handle)) {
    let newHeight = currentSize.height - mousePos.y;
    let newY = currentPos.y + mousePos.y;
    if (newHeight < 0) {
      newY = currentSize.height + currentPos.y;
    }
    updatedSize.height = newHeight;
    updatedPos.y = newY;
  }

  if (['bottom-right', 'top-right'].includes(handle)) {
    let newWidth = currentSize.width + mousePos.x;
    if (newWidth < 0) {
      updatedPos.x = currentPos.x + newWidth;
    }

    updatedSize.width = newWidth;
  }

  return { updatedSize, updatedPos };
}

export function isPointInBounds(point: XYPosition, bounds: XYPosition) {
  const inX = point.x > -1 && point.x < bounds.x;
  const inY = point.y > -1 && point.y < bounds.y;

  return { x: inX, y: inY };
}

export function createNewComponent(
  name: string,
  startPos: XYPosition,
  color?: string,
  startSize: Size = ZERO_SIZE,
  layer: number = MIN_LAYER
): ILayoutComponent {
  const newId = createUniqueId();
  return {
    id: newId,
    name: name,
    color: color,
    bounds: {
      top: startPos.y,
      left: startPos.x,
      right: startPos.x + startSize.width,
      bottom: startPos.y + startSize.height,
    },
    size: startSize,
    layer: layer,
    children: [],
  };
}

export function isLeftClick(e: MouseEvent) {
  return e.buttons === 1;
}

export const closestZero = (nums: number[]) => {
  return nums.reduce((acc, num) => {
    if (Math.abs(num) < Math.abs(acc)) {
      acc = num;
    }

    return acc;
  }, Number.MAX_SAFE_INTEGER);
};

export function closestCorner(mousePos: XYPosition, elBounds: Bounds) {
  const distance = {
    top: mousePos.y - elBounds.top,
    left: mousePos.x - elBounds.left,
    right: mousePos.x - elBounds.right,
    bottom: mousePos.y - elBounds.bottom,
  };

  if (Math.abs(distance.top) < 10 && Math.abs(distance.left) < 10) {
    return 'top-left';
  } else if (Math.abs(distance.top) < 10 && Math.abs(distance.right) < 10) {
    return 'top-right';
  } else if (Math.abs(distance.bottom) < 10 && Math.abs(distance.left) < 10) {
    return 'bottom-left';
  } else if (Math.abs(distance.bottom) < 10 && Math.abs(distance.right) < 10) {
    return 'bottom-right';
  }
  return undefined;
}
