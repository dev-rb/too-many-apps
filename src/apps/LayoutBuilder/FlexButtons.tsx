import { For } from 'solid-js';
import { toCamelCase } from '~/utils/common';
import { useBuilder } from '.';
import { useTree } from '../TreeProvider';
import { Flex } from './layout';

type CamelCase<S extends string> = S extends `${infer P1} ${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : Lowercase<S>;

const alignments = [
  'Align Start',
  'Align Center',
  'Align End',
  'Justify Start',
  'Justify Center',
  'Justify End',
] as const;

type AlignmentFunctions = CamelCase<typeof alignments[number]>;

const FlexButtons = () => {
  const builder = useBuilder();
  const tree = useTree()!;

  const alignChildren = (alignmentAction: typeof alignments[number]) => {
    const selected = builder.componentState.selected;

    if (selected.length > 1 || !selected.length) return;

    const parent = builder.componentState.components[selected[0]];

    const children = tree.tree[parent.id].children;

    if (!children.length) return;

    const bounds = children.map((id) => ({ ...builder.componentState.components[id].bounds }));

    const direction = parent.css?.['flex-direction'] === 'column' ? 'column' : 'row';

    const action = toCamelCase(alignmentAction) as AlignmentFunctions;

    const newBounds = Flex[action](bounds, parent.bounds, direction);

    for (let i = 0; i < newBounds.length; i++) {
      const bounds = newBounds[i];
      const child = children[i];
      builder.updateComponentPosition(child, { x: bounds.left, y: bounds.top });
    }
  };

  return (
    <div class="flex items-center gap-4 self-center">
      <For each={alignments}>
        {(alignment) => (
          <button class="btn-default" onClick={[alignChildren, alignment]}>
            {alignment}
          </button>
        )}
      </For>
      {/*       
      <button class="btn-default" onClick={alignCenter}>
        Align Center
      </button>
      <button class="btn-default"> Align End </button>
      <button class="btn-default"> Justify Start </button>
      <button class="btn-default"> Justify Center </button>
      <button class="btn-default"> Justify End </button> */}
    </div>
  );
};

export default FlexButtons;
