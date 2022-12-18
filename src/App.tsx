import { css } from '@hope-ui/solid';
import { Route, Router, Routes } from '@solidjs/router';
import { ColorConvert } from './apps/ColorConvert';
import LayoutBuilder from './apps/LayoutBuilder';
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
    <Router>
      <div class={'flex bg-dark-9 font-sans w-screen h-screen'}>
        <AppNav />
        <main
          class={'flex flex-col px-5 color-white w-screen overflow-x-hidden'}
        >
          <Routes>
            <Route path="/" component={ColorConvert} />
            <Route path="/layout" component={LayoutBuilder} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
