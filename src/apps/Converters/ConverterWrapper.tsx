import { ParentComponent } from 'solid-js';

const ConverterWrapper: ParentComponent = (props) => {
  return (
    <div class="w-full pt-8 h-full">
      <div class="custom-h-scrollbar w-full flex flex-col gap-6 pt-8 px-4 h-full overflow-x-hidden">
        {props.children}
      </div>
    </div>
  );
};

export default ConverterWrapper;
