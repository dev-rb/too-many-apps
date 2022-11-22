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
import { AiFillHome } from 'solid-icons/ai';
import { createStore } from 'solid-js/store';

const SidebarContext = createContext<StoreValues>();

interface StoreValues {
	state: StateValues;
	openSidebar: () => void;
	closeSidebar: () => void;
	toggleSidebar: () => void;
}

interface StateValues {
	opened: boolean;
	items: string[];
}

const SidebarContextProvider: ParentComponent = (props) => {
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

	const storeValues: StoreValues = {
		state,
		openSidebar,
		toggleSidebar,
		closeSidebar,
	};

	return (
		<SidebarContext.Provider value={storeValues}>
			{props.children}
		</SidebarContext.Provider>
	);
};

const useSidebar = () => {
	const context = useContext(SidebarContext);

	if (!context) {
		throw new Error('useSidebar can only be used inside SidebarContext');
	}

	return context;
};

const sidebarStyles = css({
	width: 'max(20vw, 10vw)',
	height: '100vh',
	backgroundColor: '$dark-6',
	display: 'flex',
	flexDirection: 'column',
	p: '20px',
});

const Sidebar = () => {
	return (
		<SidebarContextProvider>
			<div class={sidebarStyles()}>
				<SidebarItem icon={<AiFillHome />}> Test Item </SidebarItem>
			</div>
		</SidebarContextProvider>
	);
};

const sidebarItemStyles = css({});

interface SidebarItemProps {
	icon?: JSX.Element;
	showLabel?: boolean;
	children: JSX.Element;
}

const SidebarItem = (props: SidebarItemProps) => {
	const { state } = useSidebar();

	props = mergeProps(props, {
		showLabel: true,
	});
	return (
		<Button variant="light" leftIcon={props.icon}>
			<Show when={props.showLabel}>{props.children}</Show>
		</Button>
	);
};

export default Sidebar;
