import { createUniqueId } from 'solid-js';
import { ZERO_SIZE } from '~/constants';
import { Bounds, Size, XYPosition } from '~/types';
import { clamp } from '~/utils/math';
import { ILayoutComponent } from '.';

export function calculateResize(
  currentSize: Size,
  currentPos: XYPosition,
  mousePos: XYPosition,
  handle: string,
  handleReverse: boolean = true
) {
  let updatedSize = { ...currentSize };
  let updatedPos = { ...currentPos };
  if (handle.includes('left')) {
    let newWidth = currentSize.width - mousePos.x;
    let newX = currentPos.x + mousePos.x;
    if (newWidth < 0 && handleReverse) {
      newX = currentPos.x + currentSize.width;
    }
    updatedSize.width = newWidth;
    updatedPos.x = newX;
  }

  if (handle.includes('bottom')) {
    let newHeight = currentSize.height + mousePos.y;
    if (newHeight < 0 && handleReverse) {
      updatedPos.y = currentPos.y + newHeight;
    }
    updatedSize.height = newHeight;
  }

  if (handle.includes('top')) {
    let newHeight = currentSize.height - mousePos.y;
    let newY = currentPos.y + mousePos.y;
    if (newHeight < 0 && handleReverse) {
      newY = currentSize.height + currentPos.y;
    }
    updatedSize.height = newHeight;
    updatedPos.y = newY;
  }

  if (handle.includes('right')) {
    let newWidth = currentSize.width + mousePos.x;
    if (newWidth < 0 && handleReverse) {
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

const defaults = {
  type: 'component' as const,
  name: '',
  bounds: { top: 0, left: 0, right: 0, bottom: 0 },
  size: ZERO_SIZE,
  layer: 4,
};

export function createNewComponent(options: Partial<ILayoutComponent>): ILayoutComponent {
  return {
    ...defaults,
    ...options,
    id: createUniqueId(),
    layer: options.layer ?? defaults.layer,
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

export function isInside(innerBounds: Bounds, outerBounds: Bounds) {
  return (
    outerBounds.left <= innerBounds.left &&
    outerBounds.top <= innerBounds.top &&
    outerBounds.right >= innerBounds.right &&
    outerBounds.bottom >= innerBounds.bottom
  );
}

export function screenToSVG(x: number, y: number, svg: SVGSVGElement) {
  const point = svg.createSVGPoint();
  point.x = x;
  point.y = y;
  return point.matrixTransform(svg.getScreenCTM()?.inverse());
}

export function screenBoundsToSVG(bounds: Bounds, svg: SVGSVGElement) {
  let topLeft = screenToSVG(bounds.left, bounds.top, svg);

  let bottomRight = screenToSVG(bounds.right, bounds.bottom, svg);

  return topLeft && bottomRight
    ? ({ top: topLeft.y, left: topLeft.x, bottom: bottomRight.y, right: bottomRight.x } as Bounds)
    : bounds;
}

export function svgToScreen(x: number, y: number, svg: SVGSVGElement) {
  const point = svg.createSVGPoint();
  point.x = x;
  point.y = y;

  return point.matrixTransform(svg.getScreenCTM()!);
}

export function getCommonBounds(bounds: Bounds[]) {
  const newBounds = bounds.reduce(
    (acc, curr) => {
      acc.x = Math.min(acc.x, curr.left);
      acc.y = Math.min(acc.y, curr.top);
      acc.right = Math.max(acc.right, curr.right);
      acc.bottom = Math.max(acc.bottom, curr.bottom);
      acc.width = Math.abs(acc.right - acc.x);
      acc.height = Math.abs(acc.bottom - acc.y);

      return acc;
    },
    { x: Infinity, y: Infinity, right: -Infinity, bottom: -Infinity, width: Infinity, height: Infinity }
  );

  return newBounds;
}
