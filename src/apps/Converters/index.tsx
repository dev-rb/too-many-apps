import { A, Outlet } from '@solidjs/router';

const ConvertersPage = () => {
  return (
    <div class="flex flex-col">
      <h1> DDDDD </h1>
      <div class="flex gap-4">
        <A href="/color" class="btn-primary bg-dark-4" activeClass="bg-blue-7">
          Color
        </A>
      </div>
      <Outlet />
    </div>
  );
};

export default ConvertersPage;
