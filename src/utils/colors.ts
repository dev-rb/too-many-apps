export type ColorFormat = 'hex' | 'rgba' | 'rgb' | 'hsl' | 'hsla';
export const COLOR_FORMATS = ['hex', 'rgba', 'rgb', 'hsl', 'hsla'] as const;

export interface HsvaColor {
  h: number;
  s: number;
  v: number;
  a: number;
}

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export const hexTransparencies = {
  100: 'FF',
  99: 'FC',
  98: 'FA',
  97: 'F7',
  96: 'F5',
  95: 'F2',
  94: 'F0',
  93: 'ED',
  92: 'EB',
  91: 'E8',
  90: 'E6',
  89: 'E3',
  88: 'E0',
  87: 'DE',
  86: 'DB',
  85: 'D9',
  84: 'D6',
  83: 'D4',
  82: 'D1',
  81: 'CF',
  80: 'CC',
  79: 'C9',
  78: 'C7',
  77: 'C4',
  76: 'C2',
  75: 'BF',
  74: 'BD',
  73: 'BA',
  72: 'B8',
  71: 'B5',
  70: 'B3',
  69: 'B0',
  68: 'AD',
  67: 'AB',
  66: 'A8',
  65: 'A6',
  64: 'A3',
  63: 'A1',
  62: '9E',
  61: '9C',
  60: '99',
  59: '96',
  58: '94',
  57: '91',
  56: '8F',
  55: '8C',
  54: '8A',
  53: '87',
  52: '85',
  51: '82',
  50: '80',
  49: '7D',
  48: '7A',
  47: '78',
  46: '75',
  45: '73',
  44: '70',
  43: '6E',
  42: '6B',
  41: '69',
  40: '66',
  39: '63',
  38: '61',
  37: '5E',
  36: '5C',
  35: '59',
  34: '57',
  33: '54',
  32: '52',
  31: '4F',
  30: '4D',
  29: '4A',
  28: '47',
  27: '45',
  26: '42',
  25: '40',
  24: '3D',
  23: '3B',
  22: '38',
  21: '36',
  20: '33',
  19: '30',
  18: '2E',
  17: '2B',
  16: '29',
  15: '26',
  14: '24',
  13: '21',
  12: '1F',
  11: '1C',
  10: '1A',
  9: '17',
  8: '14',
  7: '12',
  6: '0F',
  5: '0D',
  4: '0A',
  3: '08',
  2: '05',
  1: '03',
  0: '00',
};

export function round(number: number, digits = 0, base = 10 ** digits) {
  return Math.round(base * number) / base;
}

function hslaToHsva({
  h,
  s,
  l,
  a,
}: {
  h: number;
  s: number;
  l: number;
  a: number;
}): HsvaColor {
  const ss = s * ((l < 50 ? l : 100 - l) / 100);

  return {
    h,
    s: ss > 0 ? ((2 * ss) / (l + ss)) * 100 : 0,
    v: l + ss,
    a,
  };
}

const angleUnits: Record<string, number> = {
  grad: 360 / 400,
  turn: 360,
  rad: 360 / (Math.PI * 2),
};

export function parseHue(value: string, unit = 'deg') {
  return Number(value) * (angleUnits[unit] || 1);
}

const HSL_REGEXP =
  /hsla?\(?\s*(-?\d*\.?\d+)(deg|rad|grad|turn)?[,\s]+(-?\d*\.?\d+)%?[,\s]+(-?\d*\.?\d+)%?,?\s*[/\s]*(-?\d*\.?\d+)?(%)?\s*\)?/i;

export function parseHsla(color: string): HsvaColor {
  const match = HSL_REGEXP.exec(color);

  if (!match) {
    return { h: 0, s: 0, v: 0, a: 1 };
  }

  return hslaToHsva({
    h: parseHue(match[1], match[2]),
    s: Number(match[3]),
    l: Number(match[4]),
    a: match[5] === undefined ? 1 : Number(match[5]) / (match[6] ? 100 : 1),
  });
}

function rgbaToHsva({ r, g, b, a }: RgbaColor): HsvaColor {
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);

  const hh = delta
    ? max === r
      ? (g - b) / delta
      : max === g
      ? 2 + (b - r) / delta
      : 4 + (r - g) / delta
    : 0;

  return {
    h: round(60 * (hh < 0 ? hh + 6 : hh)),
    s: round(max ? (delta / max) * 100 : 0),
    v: round((max / 255) * 100),
    a,
  };
}

export function hexToRgba(color: string, alpha?: number): RgbaColor {
  const hex = color[0] === '#' ? color.slice(1) : color;

  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
      a: alpha ?? 1,
    };
  }

  if (hex.length === 8) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: parseInt(hex.slice(6, 8), 16) / 255,
    };
  }

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    a: alpha ?? 1,
  };
}

export function rgbaObjToString(rgba: RgbaColor) {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
}

const RGB_REGEXP =
  /rgba?\(?\s*(-?\d*\.?\d+)(%)?[,\s]+(-?\d*\.?\d+)(%)?[,\s]+(-?\d*\.?\d+)(%)?,?\s*[/\s]*(-?\d*\.?\d+)?(%)?\s*\)?/i;

export function parseRgba(color: string): HsvaColor {
  const match = RGB_REGEXP.exec(color);

  if (!match) {
    return { h: 0, s: 0, v: 0, a: 1 };
  }

  return rgbaToHsva({
    r: Number(match[1]) / (match[2] ? 100 / 255 : 1),
    g: Number(match[3]) / (match[4] ? 100 / 255 : 1),
    b: Number(match[5]) / (match[6] ? 100 / 255 : 1),
    a: match[7] === undefined ? 1 : Number(match[7]) / (match[8] ? 100 : 1),
  });
}

const VALIDATION_REGEXP: Record<ColorFormat, RegExp> = {
  hex: /^#?([0-9A-F]{3,}){1,2}$/i,
  rgb: /^rgb\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/i,
  rgba: /^rgba\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/i,
  hsl: /hsl\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?%)\s*,\s*(\d+(?:\.\d+)?%)\)/i,
  hsla: /^hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*(\d*(?:\.\d+)?)\)$/i,
};

const CONVERTERS: Record<ColorFormat, (color: string) => HsvaColor> = {
  hex: (color) => rgbaToHsva(hexToRgba(color)),
  rgb: parseRgba,
  rgba: parseRgba,
  hsl: parseHsla,
  hsla: parseHsla,
};

export function isHex(color: string) {
  return VALIDATION_REGEXP['hex'].test(color);
}

export function identifyFormat(color: string): ColorFormat | 'UNKNOWN' {
  for (const [key, regexp] of Object.entries(VALIDATION_REGEXP)) {
    if (regexp.test(color)) {
      return key as ColorFormat;
    }
  }

  return 'UNKNOWN';
}

export function isColorValid(color: string) {
  // eslint-disable-next-line no-restricted-syntax
  for (const [, regexp] of Object.entries(VALIDATION_REGEXP)) {
    if (regexp.test(color)) {
      return true;
    }
  }

  return false;
}

export function parseColor(color: string): HsvaColor {
  if (typeof color !== 'string') {
    return { h: 0, s: 0, v: 0, a: 1 };
  }

  if (color === 'transparent') {
    return { h: 0, s: 0, v: 0, a: 0 };
  }

  const trimmed = color.trim();

  // eslint-disable-next-line no-restricted-syntax
  for (const [rule, regexp] of Object.entries(VALIDATION_REGEXP)) {
    if (regexp.test(trimmed)) {
      return CONVERTERS[rule as ColorFormat](trimmed);
    }
  }

  return { h: 0, s: 0, v: 0, a: 1 };
}
