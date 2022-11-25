import { XYPosition } from '~/types';

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function midpoint(a: XYPosition, b: XYPosition) {
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  return { x: midX, y: midY };
}
