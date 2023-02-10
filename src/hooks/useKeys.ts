import { createSignal, onCleanup, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';

const MODIFIER_KEYS = ['Control', 'Shift', 'Alt'] as const;

const ALPHABET = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
] as const;

type Keys = typeof ALPHABET[number] | Uppercase<typeof ALPHABET[number]>;

type Modifier = Lowercase<typeof MODIFIER_KEYS[number]>;
type ModifierStore = Record<Modifier, boolean>;

type Combos = Record<
  string,
  { callback: () => void; options?: { preventDefault?: boolean; stopPropogation?: boolean } }
>;

const isModifier = (key: string) => MODIFIER_KEYS.includes(key as Capitalize<Modifier>);

export const useKeys = () => {
  const [modifiers, setModifiers] = createStore<ModifierStore>({
    shift: false,
    control: false,
    alt: false,
  });

  const [combos, setCombos] = createStore<Combos>({});

  const onKeyDown = (e: KeyboardEvent) => {
    if (isModifier(e.key)) {
      setModifiers(e.key.toLowerCase() as Modifier, true);
    }

    for (const combo of Object.keys(combos)) {
      const keys = combo.split('-');
      const callback = combos[combo].callback;
      const options = combos[combo].options;

      const hasModifier = keys.find((key) => isModifier(key));

      if (keys.includes(e.key) && hasModifier && modifiers[hasModifier.toLowerCase() as Modifier]) {
        options?.preventDefault && e.preventDefault();
        options?.stopPropogation && e.stopPropagation();
        callback();
      }
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (isModifier(e.key)) {
      setModifiers(e.key.toLowerCase() as Modifier, false);
    }
  };

  onMount(() => {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    onCleanup(() => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    });
  });

  const addCombo = (
    keys: (Keys | Capitalize<Modifier>)[],
    callback: () => void,
    options?: { preventDefault?: boolean; stopPropogation?: boolean }
  ) => {
    setCombos(keys.join('-'), { callback, options });
  };

  return { modifiers, addCombo };
};
