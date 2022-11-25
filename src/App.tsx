import Sidebar from './components/Sidebar';
import { css } from '@hope-ui/solid';
import { ColorConvert } from './apps/ColorConvert';

const appStyles = css({
  display: 'flex',
});

const mainStyles = css({
  display: 'flex',
  flexDirection: 'column',
  p: 20,
  color: 'white',
  width: '100%',
});

const App = () => {
  return (
    <div class={appStyles()}>
      <Sidebar />
      <main class={mainStyles()}>
        <ColorConvert />
      </main>
    </div>
  );
};

export default App;
