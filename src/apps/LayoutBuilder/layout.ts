import { Bounds } from '~/types';
import { getCommonBounds } from './utils';

const calculateDirection = (bounds: Bounds[]) => {
  const commonBounds = getCommonBounds(bounds);

  const width = commonBounds.right - commonBounds.left;
  const height = commonBounds.bottom - commonBounds.top;

  if (width > height) return 'Row';

  return 'Column';
};

class Flex {
  static alignStart(bounds: Bounds[], parent: Bounds, parentDirection: 'row' | 'column') {
    const commonBounds = getCommonBounds(bounds);

    const newCommonX = parent.left - commonBounds.left;
    const newCommonY = parent.top - commonBounds.top;

    let newBounds = [...bounds];

    for (const bound of newBounds) {
      if (parentDirection === 'column') {
        bound.top += newCommonY;
      } else {
        bound.left += newCommonX;
      }
    }
    return newBounds;
  }

  static alignCenter(bounds: Bounds[], parent: Bounds, parentDirection: 'row' | 'column') {
    const commonBounds = getCommonBounds(bounds);

    const parentCenterX = parent.left + (parent.right - parent.left) / 2;
    const parentCenterY = parent.top + (parent.bottom - parent.top) / 2;

    const commonCenterX = commonBounds.left + commonBounds.width / 2;
    const commonCenterY = commonBounds.top + commonBounds.height / 2;

    const newCommonX = parentCenterX - commonCenterX;
    const newCommonY = parentCenterY - commonCenterY;

    let newBounds = [...bounds];

    for (const bound of newBounds) {
      if (parentDirection === 'column') {
        bound.top += newCommonY;
      } else {
        bound.left += newCommonX;
      }
    }
    return newBounds;
  }
  static alignEnd(bounds: Bounds[], parent: Bounds, parentDirection: 'row' | 'column') {
    const commonBounds = getCommonBounds(bounds);

    const newCommonX = parent.right - commonBounds.right;
    const newCommonY = parent.bottom - commonBounds.bottom;

    let newBounds = [...bounds];

    for (const bound of newBounds) {
      if (parentDirection === 'column') {
        bound.top += newCommonY;
      } else {
        bound.left += newCommonX;
      }
    }
    return newBounds;
  }

  static justifyStart(bounds: Bounds[], parent: Bounds, parentDirection: 'row' | 'column') {
    const commonBounds = getCommonBounds(bounds);

    const newCommonX = parent.left - commonBounds.left;
    const newCommonY = parent.top - commonBounds.top;

    let newBounds = [...bounds];

    for (const bound of newBounds) {
      if (parentDirection === 'row') {
        bound.top += newCommonY;
      } else {
        bound.left += newCommonX;
      }
    }
    return newBounds;
  }
  static justifyCenter(bounds: Bounds[], parent: Bounds, parentDirection: 'row' | 'column') {
    const commonBounds = getCommonBounds(bounds);

    const parentCenterX = parent.left + (parent.right - parent.left) / 2;
    const parentCenterY = parent.top + (parent.bottom - parent.top) / 2;

    const commonCenterX = commonBounds.left + commonBounds.width / 2;
    const commonCenterY = commonBounds.top + commonBounds.height / 2;

    const newCommonX = parentCenterX - commonCenterX;
    const newCommonY = parentCenterY - commonCenterY;

    let newBounds = [...bounds];

    for (const bound of newBounds) {
      if (parentDirection === 'row') {
        bound.top += newCommonY;
      } else {
        bound.left += newCommonX;
      }
    }
    return newBounds;
  }

  static justifyEnd(bounds: Bounds[], parent: Bounds, parentDirection: 'row' | 'column') {
    const commonBounds = getCommonBounds(bounds);

    const newCommonX = parent.right - commonBounds.right;
    const newCommonY = parent.bottom - commonBounds.bottom;

    let newBounds = [...bounds];

    for (const bound of newBounds) {
      if (parentDirection === 'row') {
        bound.top += newCommonY;
      } else {
        bound.left += newCommonX;
      }
    }
    return newBounds;
  }

  static centerCenter(bounds: Bounds[], parent: Bounds, direction: 'row' | 'column' = 'column') {
    return [...Flex.alignCenter(bounds, parent, direction), ...Flex.justifyCenter(bounds, parent, direction)];
  }
}

export { Flex };
