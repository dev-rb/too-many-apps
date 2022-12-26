export const UNIT_FORMATS = ['meter', 'inch', 'centimeter', 'feet'] as const;
export type UnitFormat = typeof UNIT_FORMATS[number];

export function inchToCentimeter(inches: number) {
  return inches * 2.54;
}

export function centimenterToInch(centimeters: number) {
  return centimeters / 2.54;
}

export const VALIDATION_REGEXP: Record<UnitFormat, RegExp> = {
  centimeter: /^#?([0-9a-fA-F]{3,}){1,2}$/i,
  feet: /^rgb\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/i,
  inch: /^rgba\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/i,
  meter: /hsl\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?%)\s*,\s*(\d+(?:\.\d+)?%)\)/i,
};

export function parseDistanceString(value: string) {}
