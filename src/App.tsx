import Sidebar from './components/Sidebar';
import { css } from '@hope-ui/solid';

const appStyles = css({
	display: 'flex',
});

const mainStyles = css({
	display: 'flex',
	flexDirection: 'column',
	p: 20,
	color: 'white',
});

const App = () => {
	return (
		<div class={appStyles()}>
			<Sidebar />
			<main class={mainStyles()}>
				<h1> Test </h1>
			</main>
		</div>
	);
};

export default App;
