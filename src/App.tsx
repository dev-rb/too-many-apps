import { Route, Router, Routes } from '@solidjs/router';
import ConvertersPage from './apps/Converters';
import { ColorConvert } from './apps/Converters/ColorConvert';
import UnitConvert from './apps/Converters/UnitConvert';
import LayoutBuilder from './apps/LayoutBuilder';
import AppNav from './components/AppNav';

const App = () => {
  return (
    <Router>
      <div class={'flex bg-dark-9 font-sans w-screen h-screen'}>
        <AppNav />
        <main class={'flex flex-col px-5 color-white w-screen overflow-x-hidden'}>
          <Routes>
            <Route path={['/', '/converters/']} component={ConvertersPage}>
              <Route path={['/', '/color']} component={ColorConvert} />
              <Route path={['/', '/units']} component={UnitConvert} />
            </Route>
            <Route path="/layout" component={LayoutBuilder} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
