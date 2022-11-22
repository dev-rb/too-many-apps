import { createStitches, createTheme } from '@stitches/core';
import { Property } from '@stitches/core/types/css';

type ColorValues =
	| 'white'
	| 'black'
	| 'dark'
	| 'gray'
	| 'red'
	| 'pink'
	| 'grape'
	| 'violet'
	| 'indigo'
	| 'blue'
	| 'cyan'
	| 'teal'
	| 'green'
	| 'lime'
	| 'yellow'
	| 'orange';
type ThemeColors = ColorValues;

const isThemeColor = (color: string): color is ThemeColors => {
	return Object.keys(colors).includes(color);
};

const colors: Record<ColorValues, string | string[]> = {
	white: '#ffffff',
	black: '#000000',
	dark: [
		'#C1C2C5',
		'#A6A7AB',
		'#909296',
		'#5C5F66',
		'#373A40',
		'#2C2E33',
		'#25262B',
		'#1A1B1E',
		'#141517',
		'#101113',
	],
	gray: [
		'#f8f9fa',
		'#f1f3f5',
		'#e9ecef',
		'#dee2e6',
		'#ced4da',
		'#adb5bd',
		'#868e96',
		'#495057',
		'#343a40',
		'#212529',
	],
	red: [
		'#fff5f5',
		'#ffe3e3',
		'#ffc9c9',
		'#ffa8a8',
		'#ff8787',
		'#ff6b6b',
		'#fa5252',
		'#f03e3e',
		'#e03131',
		'#c92a2a',
	],
	pink: [
		'#fff0f6',
		'#ffdeeb',
		'#fcc2d7',
		'#faa2c1',
		'#f783ac',
		'#f06595',
		'#e64980',
		'#d6336c',
		'#c2255c',
		'#a61e4d',
	],
	grape: [
		'#f8f0fc',
		'#f3d9fa',
		'#eebefa',
		'#e599f7',
		'#da77f2',
		'#cc5de8',
		'#be4bdb',
		'#ae3ec9',
		'#9c36b5',
		'#862e9c',
	],
	violet: [
		'#f3f0ff',
		'#e5dbff',
		'#d0bfff',
		'#b197fc',
		'#9775fa',
		'#845ef7',
		'#7950f2',
		'#7048e8',
		'#6741d9',
		'#5f3dc4',
	],
	indigo: [
		'#edf2ff',
		'#dbe4ff',
		'#bac8ff',
		'#91a7ff',
		'#748ffc',
		'#5c7cfa',
		'#4c6ef5',
		'#4263eb',
		'#3b5bdb',
		'#364fc7',
	],
	blue: [
		'#e7f5ff',
		'#d0ebff',
		'#a5d8ff',
		'#74c0fc',
		'#4dabf7',
		'#339af0',
		'#228be6',
		'#1c7ed6',
		'#1971c2',
		'#1864ab',
	],
	cyan: [
		'#e3fafc',
		'#c5f6fa',
		'#99e9f2',
		'#66d9e8',
		'#3bc9db',
		'#22b8cf',
		'#15aabf',
		'#1098ad',
		'#0c8599',
		'#0b7285',
	],
	teal: [
		'#e6fcf5',
		'#c3fae8',
		'#96f2d7',
		'#63e6be',
		'#38d9a9',
		'#20c997',
		'#12b886',
		'#0ca678',
		'#099268',
		'#087f5b',
	],
	green: [
		'#ebfbee',
		'#d3f9d8',
		'#b2f2bb',
		'#8ce99a',
		'#69db7c',
		'#51cf66',
		'#40c057',
		'#37b24d',
		'#2f9e44',
		'#2b8a3e',
	],
	lime: [
		'#f4fce3',
		'#e9fac8',
		'#d8f5a2',
		'#c0eb75',
		'#a9e34b',
		'#94d82d',
		'#82c91e',
		'#74b816',
		'#66a80f',
		'#5c940d',
	],
	yellow: [
		'#fff9db',
		'#fff3bf',
		'#ffec99',
		'#ffe066',
		'#ffd43b',
		'#fcc419',
		'#fab005',
		'#f59f00',
		'#f08c00',
		'#e67700',
	],
	orange: [
		'#fff4e6',
		'#ffe8cc',
		'#ffd8a8',
		'#ffc078',
		'#ffa94d',
		'#ff922b',
		'#fd7e14',
		'#f76707',
		'#e8590c',
		'#d9480f',
	],
};

type IndexedColorValues =
	| 'black'
	| 'white'
	| 'dark-0'
	| 'dark-1'
	| 'dark-2'
	| 'dark-3'
	| 'dark-4'
	| 'dark-5'
	| 'dark-6'
	| 'dark-7'
	| 'dark-8'
	| 'dark-9'
	| 'gray-0'
	| 'gray-1'
	| 'gray-2'
	| 'gray-3'
	| 'gray-4'
	| 'gray-5'
	| 'gray-6'
	| 'gray-7'
	| 'gray-8'
	| 'gray-9'
	| 'red-0'
	| 'red-1'
	| 'red-2'
	| 'red-3'
	| 'red-4'
	| 'red-5'
	| 'red-6'
	| 'red-7'
	| 'red-8'
	| 'red-9'
	| 'pink-0'
	| 'pink-1'
	| 'pink-2'
	| 'pink-3'
	| 'pink-4'
	| 'pink-5'
	| 'pink-6'
	| 'pink-7'
	| 'pink-8'
	| 'pink-9'
	| 'grape-0'
	| 'grape-1'
	| 'grape-2'
	| 'grape-3'
	| 'grape-4'
	| 'grape-5'
	| 'grape-6'
	| 'grape-7'
	| 'grape-8'
	| 'grape-9'
	| 'violet-0'
	| 'violet-1'
	| 'violet-2'
	| 'violet-3'
	| 'violet-4'
	| 'violet-5'
	| 'violet-6'
	| 'violet-7'
	| 'violet-8'
	| 'violet-9'
	| 'indigo-0'
	| 'indigo-1'
	| 'indigo-2'
	| 'indigo-3'
	| 'indigo-4'
	| 'indigo-5'
	| 'indigo-6'
	| 'indigo-7'
	| 'indigo-8'
	| 'indigo-9'
	| 'blue-0'
	| 'blue-1'
	| 'blue-2'
	| 'blue-3'
	| 'blue-4'
	| 'blue-5'
	| 'blue-6'
	| 'blue-7'
	| 'blue-8'
	| 'blue-9'
	| 'cyan-0'
	| 'cyan-1'
	| 'cyan-2'
	| 'cyan-3'
	| 'cyan-4'
	| 'cyan-5'
	| 'cyan-6'
	| 'cyan-7'
	| 'cyan-8'
	| 'cyan-9'
	| 'teal-0'
	| 'teal-1'
	| 'teal-2'
	| 'teal-3'
	| 'teal-4'
	| 'teal-5'
	| 'teal-6'
	| 'teal-7'
	| 'teal-8'
	| 'teal-9'
	| 'green-0'
	| 'green-1'
	| 'green-2'
	| 'green-3'
	| 'green-4'
	| 'green-5'
	| 'green-6'
	| 'green-7'
	| 'green-8'
	| 'green-9'
	| 'lime-0'
	| 'lime-1'
	| 'lime-2'
	| 'lime-3'
	| 'lime-4'
	| 'lime-5'
	| 'lime-6'
	| 'lime-7'
	| 'lime-8'
	| 'lime-9'
	| 'yellow-0'
	| 'yellow-1'
	| 'yellow-2'
	| 'yellow-3'
	| 'yellow-4'
	| 'yellow-5'
	| 'yellow-6'
	| 'yellow-7'
	| 'yellow-8'
	| 'yellow-9'
	| 'orange-0'
	| 'orange-1'
	| 'orange-2'
	| 'orange-3'
	| 'orange-4'
	| 'orange-5'
	| 'orange-6'
	| 'orange-7'
	| 'orange-8'
	| 'orange-9';

const colorVars: Record<IndexedColorValues, string> = Object.keys(
	colors
).reduce((acc, key) => {
	const color = colors[key as ColorValues];

	if (Array.isArray(color)) {
		acc = {
			...acc,
			...color.reduce((iAcc, curr, index) => {
				iAcc[`${key}-${index}`] = curr;
				return iAcc;
			}, {} as Record<string, string>),
		};
	} else {
		acc[key.toString() as string] = color as string;
	}

	return acc;
}, {} as Record<string, string>);

type StyleSizes = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const themeValues = {
	colors: colorVars,
	colorScheme: 'dark',
	primaryColor: 'blue',
	primaryShade: {
		light: '6',
		dark: '8',
	},
	fontSizes: {
		xs: '12px',
		sm: '14px',
		md: '16px',
		lg: '18px',
		xl: '20px',
	},

	radius: {
		xs: '2px',
		sm: '4px',
		md: '8px',
		lg: '16px',
		xl: '32px',
	},

	spacing: {
		xs: '10px',
		sm: '12px',
		md: '16px',
		lg: '20px',
		xl: '24px',
	},

	breakpoints: {
		xs: '576px',
		sm: '768px',
		md: '992px',
		lg: '1200px',
		xl: '1400px',
	},
};

const { css, theme, config } = createStitches({
	theme: {
		colors: themeValues.colors,
		space: themeValues.spacing,
		radii: themeValues.radius,
		fontSizes: themeValues.fontSizes,
		lineHeights: {
			default: 1.55,
		},
		fonts: {
			default:
				'-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji',
			monospace:
				'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
		},
	},
	media: {
		dark: '(prefers-color-scheme: dark)',
	},
	utils: {
		m: (value: number | string) => ({
			margin: value,
		}),
		mt: (value: number | string) => ({
			marginTop: value,
		}),
		mr: (value: number | string) => ({
			marginRight: value,
		}),
		mb: (value: number | string) => ({
			marginBottom: value,
		}),
		ml: (value: number | string) => ({
			marginLeft: value,
		}),
		mx: (value: number | string) => ({
			marginLeft: value,
			marginRight: value,
		}),
		my: (value: number | string) => ({
			marginTop: value,
			marginBottom: value,
		}),
		br: (value: number | string) => ({
			borderRadius: value,
		}),
		p: (value: number | string) => ({
			padding: value,
		}),
		pt: (value: number | string) => ({
			paddingTop: value,
		}),
		pr: (value: number | string) => ({
			paddingRight: value,
		}),
		pb: (value: number | string) => ({
			paddingBottom: value,
		}),
		pl: (value: number | string) => ({
			paddingLeft: value,
		}),
		px: (value: number | string) => ({
			paddingLeft: value,
			paddingRight: value,
		}),
		py: (value: number | string) => ({
			paddingTop: value,
			paddingBottom: value,
		}),
		align: (value: Property.AlignItems) => ({
			alignItems: value,
		}),
		justify: (value: Property.JustifyContent) => ({
			justifyContent: value,
		}),
	},
});
type Shade = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type VariantTypes = 'filled' | 'outline' | 'light' | 'subtle';

export { colors, css, theme, config, isThemeColor };
export type {
	ColorValues,
	IndexedColorValues,
	Shade,
	ThemeColors,
	StyleSizes,
	VariantTypes,
};
