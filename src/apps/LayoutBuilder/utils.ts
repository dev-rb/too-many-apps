import { createUniqueId } from 'solid-js';
import { ZERO_SIZE } from '~/constants';
import { Bounds, Size, XYPosition } from '~/types';
import { clamp } from '~/utils/math';
import { ILayoutComponent } from '.';

export function calculateResize(
  bounds: Bounds & Size,
  mousePos: XYPosition,
  handle: string,
  handleReverse: boolean = true
) {
  let updatedBounds = { ...bounds };
  if (handle.includes('left')) {
    let newWidth = bounds.width - mousePos.x;
    let newX = bounds.left + mousePos.x;
    if (newWidth < 0 && handleReverse) {
      newX = bounds.left + bounds.width;
    }
    updatedBounds.width = newWidth;
    updatedBounds.left = newX;
  }

  if (handle.includes('bottom')) {
    let newHeight = bounds.height + mousePos.y;
    if (newHeight < 0 && handleReverse) {
      updatedBounds.top = bounds.top + newHeight;
    }
    updatedBounds.height = newHeight;
  }

  if (handle.includes('top')) {
    let newHeight = bounds.height - mousePos.y;
    let newY = bounds.top + mousePos.y;
    if (newHeight < 0 && handleReverse) {
      newY = bounds.height + bounds.top;
    }
    updatedBounds.height = newHeight;
    updatedBounds.top = newY;
  }

  if (handle.includes('right')) {
    let newWidth = bounds.width + mousePos.x;
    if (newWidth < 0 && handleReverse) {
      updatedBounds.left = bounds.left + newWidth;
    }

    updatedBounds.width = newWidth;
  }

  return {
    ...updatedBounds,
    right: updatedBounds.left + updatedBounds.width,
    bottom: updatedBounds.top + updatedBounds.height,
  };
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
    (acc: Bounds & Size, curr) => {
      acc.left = Math.min(acc.left, curr.left);
      acc.top = Math.min(acc.top, curr.top);
      acc.right = Math.max(acc.right, curr.right);
      acc.bottom = Math.max(acc.bottom, curr.bottom);
      acc.width = Math.abs(acc.right - acc.left);
      acc.height = Math.abs(acc.bottom - acc.top);

      return acc as Bounds & Size;
    },
    { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity, width: Infinity, height: Infinity }
  );

  return newBounds;
}
