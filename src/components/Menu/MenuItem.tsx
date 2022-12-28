import { MenuOption } from './MenuProvider';

export const MenuItem = (props: MenuOption) => {
  return (
    <div
      class="min-w-24 bg-gray-8 hover:bg-gray-7 flex gap-2 items-center rounded-sm cursor-pointer p-2"
      onPointerUp={props.onClick}
    >
      <props.icon />
      <p> {props.label} </p>
    </div>
  );
};
