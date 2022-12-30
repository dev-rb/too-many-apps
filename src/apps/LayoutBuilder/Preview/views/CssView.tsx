import { JSX } from 'solid-js';
import { useBuilder } from '../..';

interface CssViewProps {
  id: string;
  name: string;
  css?: JSX.CSSProperties;
}

export const CssView = (props: CssViewProps) => {
  const builder = useBuilder();
  const isComponentActive = (id: string) => builder.componentState.selected.includes(id);
  const resolvedCss = () => {
    const entries = Object.entries(JSON.parse(JSON.stringify(props.css)));
    let str = `#${props.id} {`;
    for (const [key, val] of entries) {
      str += `\n    ${key}: ${val};`;
    }

    str += '\n}';

    return str;
  };

  return (
    <div class="flex flex-col relative">
      <div
        class="flex flex-col cursor-pointer relative text-sm whitespace-nowrap rounded-sm"
        classList={{
          ['bg-dark-4']: isComponentActive(props.id),
          [`bg-transparent`]: !isComponentActive(props.id),
        }}
      >
        <div class="whitespace-pre-wrap">{resolvedCss()}</div>
      </div>
    </div>
  );
};
