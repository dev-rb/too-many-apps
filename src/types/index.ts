export interface XYPosition {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export type EdgeHandles = 'top' | 'left' | 'right' | 'bottom';
export type CornerHandles = 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right';

export type Handles = EdgeHandles | CornerHandles;
