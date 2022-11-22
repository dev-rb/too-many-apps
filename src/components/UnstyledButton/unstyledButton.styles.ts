import { css, theme } from '~/styles/theme';

export const unstyledButtonStyles = css({
	cursor: 'pointer',
	border: 0,
	padding: 0,
	appearance: 'none',
	fontSize: theme.fontSizes.md,
	backgroundColor: 'transparent',
	textAlign: 'left',
	color: theme.colors['dark-0'],
	textDecoration: 'none',
	boxSizing: 'border-box',
});
