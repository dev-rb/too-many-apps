import { Bounds } from '~/types';
import { closestZero } from './utils';

function calculateDistances(currentBound: Bounds, otherBounds: Bounds[]) {
  return otherBounds.reduce(
    (acc, other) => {
      const topDiff = other.y - currentBound.y;
      const leftDiff = other.x - currentBound.x;
      const rightDiff = (other.x + other.width) - (currentBound.x + currentBound.width);
      const bottomDiff = (other.y + other.height) - (currentBound.y + currentBound.height);

      const topBottomDiff = other.y - (currentBound.y + currentBound.height);
      const bottomTopDiff = ((other.y + other.height)) - currentBound.y;
      const leftRightDiff = other.x - (currentBound.x + currentBound.width);
      const rightLeftDiff = (other.x + other.width) - currentBound.x;

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
