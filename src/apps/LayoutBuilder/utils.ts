import { createUniqueId } from 'solid-js';
import { ZERO_SIZE } from '~/constants';
import { Bounds, Handles, Size, XYPosition } from '~/types';
import { clamp } from '~/utils/math';
import { ILayoutComponent } from '.';

export function calculateResize(
  bounds: Bounds & Size,
  mousePos: XYPosition,
  handle: Handles,
  aspectRatioLock: boolean = false,
  scaleFromCenter: boolean = false
) {
  let { bottom, left, right, top, width, height } = { ...bounds };

  if (handle.includes('left')) {
    width = bounds.width - mousePos.x;
    left = bounds.left + mousePos.x;
  }

  if (handle.includes('bottom')) {
    height = bounds.height + mousePos.y;
  }

  if (handle.includes('top')) {
    height = bounds.height - mousePos.y;
    top = bounds.top + mousePos.y;
  }

  if (handle.includes('right')) {
    width = bounds.width + mousePos.x;
  }

  right = left + width;
  bottom = top + height;

  const scaleX = (right - left) / (Math.abs(bounds.width) || 1);
  const scaleY = (bottom - top) / (Math.abs(bounds.height) || 1);
  const flipX = scaleX < 0;
  const flipY = scaleY < 0;

  const w = Math.abs(right - left);
  const h = Math.abs(bottom - top);

  if (aspectRatioLock) {
    const originalRatio = bounds.width / bounds.height;
    const isTall = originalRatio < w / h;
    const tallWidth = w * (scaleY < 0 ? 1 : -1) * (1 / originalRatio);
    const tallHeight = h * (scaleX < 0 ? 1 : -1) * originalRatio;

    switch (handle) {
      case 'top-left': {
        if (isTall) {
          top = bottom + tallWidth;
        } else {
          left = right + tallHeight;
        }
        break;
      }
      case 'top-right': {
        if (isTall) {
          top = bottom + tallWidth;
        } else {
          right = left - tallHeight;
        }
        break;
      }
      case 'bottom-right': {
        if (isTall) {
          bottom = top - tallWidth;
        } else {
          right = left - tallHeight;
        }
        break;
      }
      case 'bottom-left': {
        if (isTall) {
          bottom = top - tallWidth;
        } else {
          left = right + tallHeight;
        }
        break;
      }
      case 'bottom':
      case 'top': {
        const center = (left + right) / 2;
        const newW = h * originalRatio;
        left = center - newW / 2;
        right = center + newW / 2;
        break;
      }
      case 'left':
      case 'right': {
        const center = (top + bottom) / 2;
        const newH = w / originalRatio;
        top = center - newH / 2;
        bottom = center + newH / 2;
        break;
      }
    }
  }

  if (scaleFromCenter) {
    const scaleX = w / (Math.abs(bounds.width) || 1);
    const scaleY = h / (Math.abs(bounds.height) || 1);
    const scale = Math.max(scaleX, scaleY);

    const width = bounds.width * scale;
    const height = bounds.height * scale;
    const left = bounds.left - (Math.abs(width) - bounds.width) / 2;
    const top = bounds.top - (Math.abs(height) - bounds.height) / 2;

    return {
      left,
      top,
      bottom: top + height,
      right: left + width,
      width,
      height,
      scaleX: scale,
      scaleY: scale,
    };
  }

  if (right < left) {
    [left, right] = [right, left];
  }

  if (bottom < top) {
    [top, bottom] = [bottom, top];
  }

  return {
    left: left,
    top: top,
    bottom: bottom,
    right: right,
    width: right - left,
    height: bottom - top,
    scaleX: ((right - left) / (Math.abs(bounds.width) || 1)) * (flipX ? -1 : 1),
    scaleY: ((bottom - top) / (Math.abs(bounds.height) || 1)) * (flipY ? -1 : 1),
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

export function closestCorner(mousePos: XYPosition, elBounds: Bounds, offset: number = 5) {
  const distance = {
    top: mousePos.y - elBounds.top,
    left: mousePos.x - elBounds.left,
    right: mousePos.x - elBounds.right,
    bottom: mousePos.y - elBounds.bottom,
  };

  let handle: string[] = [];
  if (Math.abs(distance.top) < offset) {
    handle.push('top');
  }

  if (Math.abs(distance.bottom) < offset) {
    handle.push('bottom');
  }

  if (Math.abs(distance.left) < offset) {
    handle.push('left');
  }

  if (Math.abs(distance.right) < offset) {
    handle.push('right');
  }

  let finalHandle = (handle[0] as Handles) || handle[1] ? (handle.join('-') as Handles) : undefined;

  return finalHandle;
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
