/* @refresh reload */
import { HopeProvider } from '@hope-ui/solid';
import { render } from 'solid-js/web';
import App from './App';
import 'uno.css';
import initUnocssRuntime from '@unocss/runtime';
import './index.css';
import config from '../unocss.config';

initUnocssRuntime({
  defaults: config,
});

function Index() {
  return <App />;
}

render(() => <Index />, document.getElementById('root') as HTMLElement);
