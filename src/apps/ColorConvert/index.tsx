import { Button, HStack, VStack, Text } from '@hope-ui/solid';
import { For } from 'solid-js';
import { createStore } from 'solid-js/store';
import InputCard from './InputCard';

const COLOR_FORMATS = ['HEX', 'RGB', 'HSL'];

export const ColorConvert = () => {
  const [state, setState] = createStore({
    value: '',
  });

  return (
    <VStack alignItems="start" width="100%">
      <InputCard />
    </VStack>
  );
};
