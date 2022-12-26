import { A, Outlet, useLocation, useMatch } from '@solidjs/router';
import { createEffect, createMemo } from 'solid-js';

const ConvertersPage = () => {
  const location = useLocation();
  const isColor = createMemo(() => ['/', '/converters/color'].includes(location.pathname));

  return (
    <div class="flex flex-col py-6 h-full">
      <div class="flex gap-4">
        <A
          href="/converters/color"
          class="btn-primary ml-0 decoration-none"
          classList={{
            ['bg-blue-7']: Boolean(isColor()),
            ['bg-dark-4 color-dark-1 shadow-none hover:bg-dark-3/60']: !Boolean(isColor()),
          }}
        >
          Color
        </A>
        <A
          href="/converters/units"
          class="btn-primary ml-0 decoration-none"
          activeClass="bg-blue-7"
          inactiveClass="bg-dark-4 color-dark-1 shadow-none hover:bg-dark-3/60"
        >
          Units
        </A>
      </div>
      <Outlet />
    </div>
  );
};

export default ConvertersPage;
