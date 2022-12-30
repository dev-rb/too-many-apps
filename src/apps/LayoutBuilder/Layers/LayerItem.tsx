import { BiRegularText, BiSolidTrash, BiRegularDotsVerticalRounded } from 'solid-icons/bi';
import { createSignal, JSX, Show } from 'solid-js';
import { useMenu } from '~/components/Menu/MenuProvider';
import { useBuilder } from '..';

interface LayerProps {
  id: string;
  selectLayer: (compId: string) => void;
  name: string;
  layerValue: number;
  active: boolean;
}

const Layer = (props: LayerProps) => {
  const [currentName, setCurrentName] = createSignal(props.name);
  const [editName, setEditName] = createSignal(false);

  const [layerRef, setLayerRef] = createSignal<HTMLDivElement>();
  const [inputRef, setInputRef] = createSignal<HTMLInputElement>();
  const builder = useBuilder();
  const menu = useMenu();

  const showMenu = (e: MouseEvent) => {
    if (layerRef()) {
      menu.show({
        position: {
          x: e.clientX,
          y: e.clientY,
        },
        options: [
          {
            icon: BiRegularText,
            label: 'Rename',
            onClick() {
              setEditName(true);
              if (inputRef()) {
                inputRef()!.focus();
              }
            },
          },
          {
            icon: BiSolidTrash,
            label: 'Delete',
            onClick() {
              builder.deleteComponent(props.id);
            },
          },
        ],
      });
    }
  };

  const onNameChange: JSX.EventHandler<HTMLInputElement, Event> = (e) => {
    setCurrentName(e.currentTarget.value);
  };

  const updateName = () => {
    builder.updateComponentName(props.id, currentName());
    setEditName(false);
  };

  const onLayerClick = () => {
    setEditName(false);
    props.selectLayer(props.id);
  };

  return (
    <div
      ref={setLayerRef}
      class="flex items-center justify-between p-2 rounded-sm relative cursor-pointer select-none"
      classList={{
        ['bg-blue-7 hover:bg-blue-6']: props.active,
        ['bg-dark-4 hover:bg-dark-4']: !props.active,
      }}
      onClick={onLayerClick}
    >
      <div class="flex-col gap-1">
        <Show when={editName()} fallback={<p>{currentName()}</p>}>
          <input
            ref={setInputRef}
            class="appearance-none border-none bg-blue-8 outline-none rounded-sm p-1 color-white text-base"
            value={currentName()}
            onChange={onNameChange}
            onBlur={updateName}
          />
        </Show>

        {/* <p class="text-sm">{props.layerValue}</p> */}
        <p class="text-xs"> {props.id} </p>
      </div>
      <button
        class="appearance-none outline-none border-none bg-transparent color-white p-1 rounded-sm flex items-center justify-center text-base cursor-pointer"
        classList={{
          ['hover:bg-blue-8']: props.active,
          ['hover:bg-dark-5']: !props.active,
        }}
        onClick={showMenu}
      >
        <BiRegularDotsVerticalRounded />
      </button>
    </div>
  );
};

export default Layer;
