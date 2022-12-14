import { css } from '@hope-ui/solid';
import { ColorConvert } from './apps/ColorConvert';
import AppNav from './components/AppNav';

const appStyles = css({
  display: 'flex',
});

const mainStyles = css({
  display: 'flex',
  flexDirection: 'column',
  p: 20,
  color: 'white',
  width: '100vw',
  height: '100vh',
});

const App = () => {
  return (
    <div class={appStyles()}>
      <AppNav />
      <main class={mainStyles()}>
        <ColorConvert />
      </main>
    </div>
  );
};

export default App;
