/* @refresh reload */
import { HopeProvider } from '@hope-ui/solid';
import { render } from 'solid-js/web';
import App from './App';

function Index() {
  return (
    <HopeProvider config={{ initialColorMode: 'dark' }}>
      <App />
    </HopeProvider>
  );
}

render(() => <Index />, document.getElementById('root') as HTMLElement);
