import {
	theme,
	css,
	Shade,
	IndexedColorValues,
	ThemeColors,
} from '~/styles/theme';
import { hexToRgba, rgbaObjToString } from '~/utils/colors';
import { getColor } from '~/styles/colors';

const buttonStyles = (color: ThemeColors = 'blue') => {
	return css({
		display: 'inline-block',
		width: 'auto',
		borderRadius: theme.radii.sm,
		fontWeight: 400,
		position: 'relative',
		lineHeight: 1,
		userSelect: 'none',
		paddingLeft: theme.space.xs,
		paddingRight: theme.space.xs,
		height: 36,
		cursor: 'pointer',
		'&:active': {
			transform: 'translateY(1px)',
		},
		'&:disabled, [data-disabled]': {
			borderColor: 'transparent',
			backgroundColor: theme.colors['dark-4'],
			color: theme.colors['dark-6'],
			cursor: 'not-allowed !important',
			backgroundImage: 'none',
			pointerEvents: 'none',
		},
		'&:active &:disabled': {
			transform: 'translate(0)',
		},
		variants: {
			fullWidth: {
				true: {
					display: 'block',
					width: '100%',
				},
			},
			variant: {
				filled: {
					background: getColor(color, 6),
					border: 'transparent',
					color: theme.colors.white,
					'&:hover': {
						background: getColor(color, 7),
					},
				},
				outline: {
					border: `1px solid ${getColor(color, 5)}`,
					background: 'transparent',
					color: getColor(color, 5),
					'&:hover': {
						background: `${rgbaObjToString(
							hexToRgba(getColor(color, 5).value, 0.05)
						)}`,
					},
				},
				light: {
					border: 'transparent',
					background: `${rgbaObjToString(
						hexToRgba(getColor(color, 8).value, 0.2)
					)}`,
					color: getColor(color, 2),
					'&:hover': {
						background: `${rgbaObjToString(
							hexToRgba(getColor(color, 7).value, 0.25)
						)}`,
					},
				},
				subtle: {
					border: 'transparent',
					background: 'transparent',
					color: getColor(color, 2),
					'&:hover': {
						background: `${rgbaObjToString(
							hexToRgba(getColor(color, 8).value, 0.2)
						)}`,
					},
				},
			},
		},
	});
};

// const unstyled = style({
//   cursor: 'pointer',
//   border: 0,
//   padding: 0,
//   appearance: 'none',
//   fontSize: '16px',
//   backgroundColor: 'transparent',
//   textAlign: 'left',
//   color: 'white',
//   textDecoration: 'none',
//   boxSizing: 'border-box',
// });

const inner = css({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	height: '100%',
	overflow: 'visible',
});

const label = css({
	whiteSpace: 'nowrap',
	height: '100%',
	overflow: 'hidden',
	display: 'flex',
	alignItems: 'center',
});

const icon = css({
	display: 'flex',
	alignItems: 'center',
	variants: {
		direction: {
			left: {
				marginRight: 10,
			},
			right: {
				marginLeft: 10,
			},
		},
	},
});

export { icon, buttonStyles, inner, label };
