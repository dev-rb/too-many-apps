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

      const xAlign = closestZero([leftDiff, rightDiff, leftRightDiff, rightLeftDiff]);

      const yAlign = closestZero([topDiff, bottomDiff, topBottomDiff, bottomTopDiff]);

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
