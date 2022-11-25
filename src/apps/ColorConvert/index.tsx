import {
  Divider,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightAddon,
  Select,
  SelectContent,
  SelectIcon,
  SelectListbox,
  SelectOption,
  SelectOptionIndicator,
  SelectOptionText,
  SelectTrigger,
  SelectValue,
  VStack,
} from '@hope-ui/solid';
import { For } from 'solid-js';
import { AiFillCopy } from 'solid-icons/ai';
import { createStore } from 'solid-js/store';
import ColorInput from '~/components/ColorInput';

const COLOR_FORMATS = ['HEX', 'RGB', 'RGBA', 'HSL', 'HSLA'];

export const ColorConvert = () => {
  const [state, setState] = createStore({
    value: '',
  });

  return (
    <VStack alignItems="start" width="100%">
      <Heading size="4xl"> Converter </Heading>
      <Divider mt="$4" />
      <VStack mt="$8">
        <HStack spacing="$2">
          <Select variant="filled" defaultValue={'HEX'}>
            <SelectTrigger>
              <SelectValue />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent>
              <SelectListbox>
                <For each={COLOR_FORMATS}>
                  {(format) => (
                    <SelectOption value={format}>
                      <SelectOptionText> {format} </SelectOptionText>
                      <SelectOptionIndicator />
                    </SelectOption>
                  )}
                </For>
              </SelectListbox>
            </SelectContent>
          </Select>
          <ColorInput value="#FFFFFF" onChange={() => {}} />
        </HStack>
      </VStack>
    </VStack>
  );
};
