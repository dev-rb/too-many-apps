import { Bounds } from '~/types';
import { closestZero } from './utils';

function calculateDistances(currentBound: Bounds, otherBounds: Bounds[]) {
  return otherBounds.reduce(
    (acc, other) => {
      const topDiff = other.top - currentBound.top;
      const leftDiff = other.left - currentBound.left;
      const rightDiff = other.right - currentBound.right;
      const bottomDiff = other.bottom - currentBound.bottom;

      const topBottomDiff = other.top - currentBound.bottom;
      const bottomTopDiff = other.bottom - currentBound.top;
      const leftRightDiff = other.left - currentBound.right;
      const rightLeftDiff = other.right - currentBound.left;

      const currentCenterY = (currentBound.top + currentBound.bottom) / 2;
      const currentCenterX = (currentBound.left + currentBound.right) / 2;

      const otherCenterY = (other.top + other.bottom) / 2;
      const otherCenterX = (other.left + other.right) / 2;

      const centerXDiff = otherCenterX - currentCenterX;
      const centerYDiff = otherCenterY - currentCenterY;

      const xAlign = closestZero([leftDiff, rightDiff, leftRightDiff, rightLeftDiff, centerXDiff]);

      const yAlign = closestZero([topDiff, bottomDiff, topBottomDiff, bottomTopDiff, centerYDiff]);

      if (Math.abs(xAlign) < Math.abs(acc.xAlign)) {
        acc.xAlign = xAlign;
      }

      if (Math.abs(yAlign) < Math.abs(acc.yAlign)) {
        acc.yAlign = yAlign;
      }

      return acc;
    },
    {
      xAlign: Number.MAX_SAFE_INTEGER,
      yAlign: Number.MAX_SAFE_INTEGER,
    }
  );
}

export { calculateDistances };
