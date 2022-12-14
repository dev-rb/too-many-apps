import { Button, HStack, VStack, Text } from '@hope-ui/solid';
import { For } from 'solid-js';
import { createStore } from 'solid-js/store';

const COLOR_FORMATS = ['HEX', 'RGB', 'HSL'];

export const ColorConvert = () => {
  const [state, setState] = createStore({
    value: '',
  });

  return (
    <VStack alignItems="start" width="100%">
      <ColorInputField />
    </VStack>
  );
};

const ColorInputField = () => {
  return (
    <HStack
      css={{
        minWidth: '100%',
        backgroundColor: '$neutral4',
        px: 20,
        py: 40,
        borderRadius: 6,
        border: '2px solid $neutral6',
      }}
    >
      <VStack gap={10}>
        <For each={COLOR_FORMATS}>
          {(format) => <Button size="sm"> {format} </Button>}
        </For>
      </VStack>
      <Text m="auto" size="9xl" fontWeight="$bold" opacity={0.2}>
        #FFFFF
      </Text>
    </HStack>
  );
};
