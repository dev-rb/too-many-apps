export interface XYPosition {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Bounds = XYPosition & Size;
