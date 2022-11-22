import { JSX, Show, splitProps } from 'solid-js';
import * as styles from './button.styles';
import { ThemeColors, config, VariantTypes } from '~/styles/theme';
import { cx } from '~/utils/common';
import { UnstyledButton } from '../UnstyledButton';

type HtmlButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>;

interface ButtonProps {
	leftIcon?: JSX.Element;
	rightIcon?: JSX.Element;
	color?: ThemeColors;
	size?: string;
	fullWidth?: boolean;
	radius?: string;
	variant?: VariantTypes;
	loading?: boolean;
	uppercase?: boolean;
	loader?: JSX.Element;
	children?: JSX.Element;
}

export const Button = (props: ButtonProps & HtmlButtonProps) => {
	let [self, rest] = splitProps(props, [
		'leftIcon',
		'rightIcon',
		'color',
		'size',
		'fullWidth',
		'radius',
		'variant',
		'loader',
		'loading',
		'uppercase',
	]);

	const buttonStyles = styles.buttonStyles(self.color);

	return (
		<UnstyledButton
			ref={() => rest.ref}
			class={cx(
				buttonStyles({
					variant: self.variant || 'filled',
					fullWidth: self.fullWidth,
				}),
				rest.class
			)}
			data-button
			data-disabled={rest.disabled}
			disabled={rest.disabled}
			{...rest}
		>
			<div class={styles.inner()}>
				<Show when={self.leftIcon}>
					<span class={styles.icon({ direction: 'left' })}>
						{self.leftIcon}
					</span>
				</Show>
				<span
					class={styles.label()}
					style={{ 'text-transform': self.uppercase ? 'uppercase' : undefined }}
				>
					{rest.children}
				</span>
				<Show when={self.rightIcon}>
					<span class={styles.icon({ direction: 'right' })}>
						{self.rightIcon}
					</span>
				</Show>
			</div>
		</UnstyledButton>
	);
};
