import { For } from 'solid-js';
import { XYPosition } from '~/types';
import { toCamelCase } from '~/utils/common';
import { useBuilder } from '.';
import { useTree } from './TreeProvider';
import { Flex } from './layout';
import { getCommonBounds } from './utils';

type CamelCase<S extends string> = S extends `${infer P1} ${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : Lowercase<S>;

const alignments = [
  'Align Start',
  'Align Center',
  'Align End',
  'Center Center',
  'Justify Start',
  'Justify Center',
  'Justify End',
] as const;

type AlignmentFunctions = CamelCase<typeof alignments[number]>;

const FlexButtons = () => {
  const builder = useBuilder();
  const tree = useTree()!;

  const recursiveUpdatePosition = (parentId: string, newPosition: XYPosition) => {
    if (!builder.componentState.components[parentId]) return;

    const oldParentBounds = builder.componentState.components[parentId].bounds;

    builder.updateComponentPosition(parentId, newPosition);

    const children = tree.tree[parentId].children;

    if (!children.length) return;

    for (let i = 0; i < children.length; i++) {
      const child = builder.componentState.components[children[i]];

      const oldRelativePosition = {
        x: child.bounds.left - oldParentBounds.left,
        y: child.bounds.top - oldParentBounds.top,
      };
      const newRelativePosition = {
        x: child.bounds.left - newPosition.x,
        y: child.bounds.top - newPosition.y,
      };

      const diff = {
        x: oldRelativePosition.x - newRelativePosition.x,
        y: oldRelativePosition.y - newRelativePosition.y,
      };

      recursiveUpdatePosition(child.id, {
        x: child.bounds.left + diff.x,
        y: child.bounds.top + diff.y,
      });
    }
  };

  const alignChildren = (alignmentAction: typeof alignments[number]) => {
    const selected = builder.componentState.selected;

    // Only run the alignment when there is one selected component
    if (selected.length > 1 || !selected.length) return;

    const parent = builder.componentState.components[selected[0]];

    const children = tree.tree[parent.id].children;

    // Only run the alignment when there are children to align
    if (!children.length) return;

    const bounds = children.map((id) => ({ ...builder.componentState.components[id].bounds }));

    const direction = parent.css?.['flex-direction'] === 'column' ? 'column' : 'row';

    // Make alignmentAction into camel case to match the functions of the Flex class
    const action = toCamelCase(alignmentAction) as AlignmentFunctions;

    const newBounds = Flex[action](bounds, parent.bounds, direction);

    for (let i = 0; i < newBounds.length; i++) {
      const bounds = newBounds[i];
      const child = children[i];
      recursiveUpdatePosition(child, { x: bounds.left, y: bounds.top });
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
    </div>
  );
};

export default FlexButtons;
