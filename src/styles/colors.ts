import { ThemeColors, Shade, theme, IndexedColorValues } from './theme';

export const getColor = (color: ThemeColors, shade: Shade) =>
	theme.colors[color as IndexedColorValues] ??
	theme.colors[`${color}-${shade}` as IndexedColorValues];
