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

type Combos = Record<string, { action: () => void; options?: { preventDefault?: boolean; stopPropogation?: boolean } }>;

const isModifier = (key: string) => MODIFIER_KEYS.includes(key as Capitalize<Modifier>);

export const useKeys = () => {
  const [modifiers, setModifiers] = createStore<ModifierStore>({
    shift: false,
    control: false,
    alt: false,
  });

  const [combos, setCombos] = createStore<Combos>({});

  let currentSequence = new Set<string>();

  const onKeyDown = (e: KeyboardEvent) => {
    if (isModifier(e.key)) {
      setModifiers(e.key.toLowerCase() as Modifier, true);
    }

    currentSequence.add(e.key.toLowerCase());

    for (const combo of Object.keys(combos)) {
      const keys = combo.split('-');
      const action = combos[combo].action;
      const options = combos[combo].options;
      const comboMatched = keys.every((key) => {
        if (isModifier(key)) {
          return modifiers[key.toLowerCase() as Modifier];
        }
        return currentSequence.has(key.toLowerCase());
      });

      if (comboMatched && currentSequence.size === keys.length) {
        options?.preventDefault && e.preventDefault();
        options?.stopPropogation && e.stopPropagation();
        action();
      }
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (isModifier(e.key)) {
      setModifiers(e.key.toLowerCase() as Modifier, false);
    }
    currentSequence.delete(e.key.toLowerCase());
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
    action: () => void,
    options?: { preventDefault?: boolean; stopPropogation?: boolean }
  ) => {
    setCombos(keys.join('-'), { action, options });
  };

  return { modifiers, addCombo };
};
