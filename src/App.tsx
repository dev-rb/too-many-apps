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
    <div class={'flex bg-dark-9 font-sans w-screen h-screen'}>
      <AppNav />
      <main class={'flex flex-col p-5 color-white w-screen overflow-x-hidden'}>
        <ColorConvert />
      </main>
    </div>
  );
};

export default App;
