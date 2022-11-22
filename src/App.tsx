import Sidebar from './components/Sidebar';
import { globalStyles } from './styles/global.styles';
import { css } from './styles/theme';

const appStyles = css({
	display: 'flex',
});

const App = () => {
	globalStyles();
	return (
		<div class={appStyles()}>
			<Sidebar />
		</div>
	);
};

export default App;
