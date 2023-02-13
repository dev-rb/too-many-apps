import { Bounds, Size } from '~/types';

export const getRelativeTransformedBounds = (
  parentBounds: Bounds & Size,
  initialParentBounds: Bounds & Size,
  elementBounds: Bounds & Size,
  isFlippedX: boolean,
  isFlippedY: boolean
) => {
  const nx =
    (isFlippedX ? initialParentBounds.right - elementBounds.right : elementBounds.left - initialParentBounds.left) /
    initialParentBounds.width;
  const ny =
    (isFlippedY ? initialParentBounds.bottom - elementBounds.bottom : elementBounds.top - initialParentBounds.top) /
    initialParentBounds.height;

  const nw = elementBounds.width / initialParentBounds.width;
  const nh = elementBounds.height / initialParentBounds.height;

  let newX = parentBounds.left + parentBounds.width * nx;
  let newY = parentBounds.top + parentBounds.height * ny;

  const width = parentBounds.width * nw;
  const height = parentBounds.height * nh;

  return {
    left: newX,
    top: newY,
    right: newX + width,
    bottom: newY + height,
    width,
    height,
  };
};
