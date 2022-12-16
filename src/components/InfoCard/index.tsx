import { JSX, ParentComponent, Show } from 'solid-js';

interface InfoCardProps {
  header?: JSX.Element;
  footer?: JSX.Element;
}

const InfoCard: ParentComponent<InfoCardProps> = (props) => {
  return (
    <div class="flex flex-col bg-dark-7 min-w-sm px-2 py-2 rounded-2 border-dark-4 border-1">
      <Show when={props.header}>{props.header}</Show>
      {props.children}
      <Show when={props.footer}>{props.footer}</Show>
    </div>
  );
};

export default InfoCard;
