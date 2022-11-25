import { createEffect, createSignal } from 'solid-js';
import { isColorValid } from '~/utils/colors';
import {
  css,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useClickOutside,
} from '@hope-ui/solid';
import ColorPicker from '../ColorPicker';

const containerStyles = css({
  width: 'fit-content',
  height: '48px',
  maxHeight: '100%',
  borderRadius: 4,
  position: 'relative',
});

const previewStyles = css({
  width: '30px',
  height: '30px',
  borderRadius: '6px',
  alignSelf: 'center',
  border: '1px solid #444444 ',
});

interface ColorInputProps {
  onChange: (color: string) => void;
  value: string;
}

const ColorInput = (props: ColorInputProps) => {
  const [pickerRef, setPickerRef] = createSignal<HTMLElement>();

  const [pickerOpen, setPickerOpen] = createSignal(false);
  useClickOutside({
    element: pickerRef,
    handler: () => {
      setPickerOpen(false);
    },
  });

  const [lastValidValue, setLastValidValue] = createSignal('');
  const [color, setColor] = createSignal(props.value ?? '#FFF');

  const handleColorChange = (color: string) => {
    setColor(color);
    if (isColorValid(color)) {
      setLastValidValue(color);
      props.onChange(color);
    }
  };

  const handleInputChange = (newValue: string) => {
    setColor(newValue);
    handleColorChange(newValue);
  };

  const handleInputFocus = (e: FocusEvent) => {
    setPickerOpen(true);
  };

  const handleInputBlur = (e: FocusEvent) => {
    if (lastValidValue() !== '') {
      setColor(lastValidValue);
    }
    setPickerOpen(false);
  };

  createEffect(() => {
    setColor(props.value);
  });

  return (
    <HStack class={containerStyles()} flexWrap="nowrap" spacing={10}>
      <InputGroup variant="filled" id="input">
        <Popover
          opened={pickerOpen()}
          trapFocus={false}
          initialFocus={'#input'}
        >
          <PopoverTrigger as={'div'}>
            <InputLeftElement>
              <div
                class={previewStyles()}
                onClick={handleInputFocus}
                style={{ 'background-color': color() }}
              />
            </InputLeftElement>
          </PopoverTrigger>
          <PopoverContent
            css={{
              width: 'fit-content',
              backgroundColor: '$neutral4',
              padding: 20,
            }}
          >
            <ColorPicker
              ref={setPickerRef}
              value={isColorValid(color()) ? color() : '#FFF'}
              onChange={handleColorChange}
            />
          </PopoverContent>
        </Popover>
        <Input
          value={color().toUpperCase()}
          onBlur={handleInputBlur}
          htmlSize={24}
          onChange={(e) => handleInputChange(e.currentTarget.value)}
        />
      </InputGroup>
    </HStack>
  );
};

export default ColorInput;
