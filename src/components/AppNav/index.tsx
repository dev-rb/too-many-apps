import { HStack, Text, VStack } from '@hope-ui/solid';
import { BiSolidColor, BiSolidNote, BiSolidRuler } from 'solid-icons/bi';
import { createSelector, createSignal, For } from 'solid-js';
import { Dynamic } from 'solid-js/web';

const NAV_ITEMS = [
  { icon: BiSolidColor, name: 'Colors' },
  { icon: BiSolidRuler, name: 'Units' },
  { icon: BiSolidNote, name: 'Snippets' },
];

const AppNav = () => {
  const [active, setActive] = createSignal('Colors');

  const selected = createSelector(active);

  return (
    <VStack
      gap={20}
      pt={50}
      pr={20}
      mr={20}
      css={{ borderRight: '2px solid $neutral4' }}
    >
      <For each={NAV_ITEMS}>
        {(item) => (
          <VStack
            css={{
              position: 'relative',
              py: 5,
              minWidth: '$24',
              cursor: 'pointer',
              color: selected(item.name) ? 'white' : '$neutral10',
              '&:hover': {
                '&::before': {
                  backgroundColor: selected(item.name)
                    ? '#2C84E9'
                    : '$neutral4',
                },
              },
              '&::before': {
                content: '',
                position: 'absolute',
                top: 0,
                height: '100%',
                width: '100%',
                pl: 100,
                borderTopRightRadius: 6,
                borderBottomRightRadius: 6,
                backgroundColor: selected(item.name)
                  ? '#2C84E9'
                  : 'transparent',
                zIndex: -1,
              },
            }}
            onClick={() => setActive(item.name)}
          >
            <Dynamic component={item.icon} size={35} />
            <Text> {item.name} </Text>
          </VStack>
        )}
      </For>
    </VStack>
  );
};

export default AppNav;
