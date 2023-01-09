/* @refresh reload */
import { render } from 'solid-js/web';
import App from './App';
import 'uno.css';
import initUnocssRuntime from '@unocss/runtime';
import './index.css';
import presetWind from 'unocss/preset-wind';

// initUnocssRuntime({
//   defaults: {
//     presets: [presetWind()],
//   },
// });

function Index() {
  return <App />;
}

render(() => <Index />, document.getElementById('root') as HTMLElement);
