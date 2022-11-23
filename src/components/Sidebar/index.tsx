import {
	createContext,
	JSX,
	mergeProps,
	ParentComponent,
	Show,
	useContext,
} from 'solid-js';
import { css, theme } from '~/styles/theme';
import { Button } from '../Button';
import {
	AiFillHome,
	AiOutlineDoubleLeft,
	AiOutlineDoubleRight,
} from 'solid-icons/ai';
import { createStore } from 'solid-js/store';
import { cx } from '~/utils/common';
import { keyframes } from '@stitches/core';

interface StateValues {
	opened: boolean;
	items: string[];
}

const sidebarStyles = css({
	width: 'max(20vw, 10vw)',
	height: '100vh',
	backgroundColor: '$dark-6',
	display: 'flex',
	flexDirection: 'column',
	py: '20px',
	transition: '400ms ease',
	variants: {
		opened: {
			false: {
				width: '5rem',
				'.sidebar-header': {
					px: '2px',
					justify: 'center',
					align: 'center',
					'& button': {
						margin: '0 calc(50%)',
						transition: '600ms ease',
					},
				},
				'.sidebar-content': {
					'& button': {
						'& span': {
							margin: 0,
							transition: 'margin 300ms ease',
							// transitionDelay: '450ms ',
						},
					},
				},
			},
		},
	},
});

const sidebarButton = css({
	width: 'fit-content',
	marginLeft: 'auto',
	padding: 5,
	'& span': {
		margin: 0,
	},
});

const sidebarHeader = css({
	display: 'flex',
	width: '100%',
	px: '20px',
	pb: 5,
	mb: 20,
	borderBottom: '2px solid $dark-3',
});

const sidebarContent = css({
	width: '100%',
	px: 20,
});

function Sidebar() {
	const [state, setState] = createStore<StateValues>({
		opened: true,
		get items() {
			return [];
		},
	});

	const openSidebar = () => {
		setState('opened', true);
	};

	const closeSidebar = () => {
		setState('opened', false);
	};

	const toggleSidebar = () => {
		setState('opened', (p) => !p);
	};

	return (
		<div class={sidebarStyles({ opened: state.opened })}>
			<SidebarHeader opened={state.opened} toggleSidebar={toggleSidebar} />
			<div class={cx(sidebarContent(), 'sidebar-content')}>
				<SidebarItem icon={<AiFillHome />} showLabel={state.opened}>
					Test Item
				</SidebarItem>
			</div>
		</div>
	);
}

interface SidebarHeaderProps {
	opened: boolean;
	toggleSidebar: () => void;
}

function SidebarHeader(props: SidebarHeaderProps) {
	return (
		<div class={cx(sidebarHeader(), 'sidebar-header')}>
			<Button
				variant="subtle"
				color="dark"
				class={sidebarButton()}
				leftIcon={
					<AiOutlineDoubleLeft
						size={25}
						style={{
							transform: !props.opened ? 'scale(-1)' : undefined,
							transition: '500ms ease-in-out',
						}}
					/>
				}
				onClick={props.toggleSidebar}
			></Button>
		</div>
	);
}

const sidebarItemStyles = css({});

const noLabel = keyframes({
	'0%': {
		opacity: 1,
		width: 'auto',
	},
	'50%': {
		opacity: 0,
	},
	'100%': {
		opacity: 0,
		width: 0,
	},
});

const sidebarLabel = css({
	variants: {
		showLabel: {
			true: {
				animation: `${noLabel} 400ms forwards ease-out`,
			},
		},
	},
});

interface SidebarItemProps {
	icon?: JSX.Element;
	showLabel?: boolean;
	children: JSX.Element;
}

const SidebarItem = (props: SidebarItemProps) => {
	props = mergeProps(
		{
			showLabel: true,
		},
		props
	);

	return (
		<Button variant="light" leftIcon={props.icon} fullWidth>
			<div class={sidebarLabel({ showLabel: !props.showLabel })}>
				{props.children}
			</div>
		</Button>
	);
};

export default Sidebar;
