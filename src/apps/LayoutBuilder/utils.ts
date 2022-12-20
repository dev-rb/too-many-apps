import { createUniqueId } from 'solid-js';
import { ZERO_SIZE } from '~/constants';
import { Size, XYPosition } from '~/types';

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

export function createNewComponent(name: string, startPos: XYPosition, color?: string, startSize: Size = ZERO_SIZE) {
  const newId = createUniqueId();
  return {
    id: newId,
    name: name,
    color: color,
    position: startPos,
    size: startSize,
  };
}

export function isLeftClick(e: MouseEvent) {
  return e.buttons === 1;
}
