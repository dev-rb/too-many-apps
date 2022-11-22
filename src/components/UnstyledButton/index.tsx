import { JSX, splitProps } from 'solid-js';
import { unstyledButtonStyles } from './unstyledButton.styles';
import { cx } from '~/utils/common';

type HTMLProps = JSX.IntrinsicElements['button'];

interface UnstyledButtonProps extends HTMLProps {
	children?: JSX.Element;
}

export const UnstyledButton = (
	props: UnstyledButtonProps & { component?: any }
) => {
	const [self, other] = splitProps(props, ['component', 'class']);

	return (
		<button
			class={cx(unstyledButtonStyles(), self.class)}
			type={self.component === 'button' ? 'button' : undefined}
			{...other}
		/>
	);
};
