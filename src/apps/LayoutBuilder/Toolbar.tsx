import { BiSolidPointer, BiRegularRectangle } from 'solid-icons/bi';

export type Tools = 'pointer' | 'draw';

interface ToolbarProps {
  activeTool: Tools;
  setActiveTool: (tool: Tools) => void;
}

const Toolbar = (props: ToolbarProps) => {
  const isToolActive = (tool: Tools) => props.activeTool === tool;

  return (
    <div class="w-fit bg-dark-5 h-fit px-5 py-3 flex flex-wrap gap-6 content-start self-center rounded-md">
      <button
        class="appearance-none border-none outline-none text-2xl rounded-md flex items-center justify-center p-2 cursor-pointer"
        classList={{
          ['color-white bg-blue-7 hover:bg-blue-6 ']: isToolActive('pointer'),
          ['color-dark-2  bg-dark-3/50 hover:bg-dark-3/80  ']: !isToolActive('pointer'),
        }}
        onClick={() => props.setActiveTool('pointer')}
      >
        <BiSolidPointer />
      </button>
      <button
        class="appearance-none border-none outline-none text-2xl rounded-md flex items-center justify-center p-2 cursor-pointer"
        classList={{
          ['color-white bg-blue-7 hover:bg-blue-6 ']: isToolActive('draw'),
          ['color-dark-2  bg-dark-3/50 hover:bg-dark-3/80  ']: !isToolActive('draw'),
        }}
        onClick={() => props.setActiveTool('draw')}
      >
        <BiRegularRectangle />
      </button>
    </div>
  );
};

export default Toolbar;
