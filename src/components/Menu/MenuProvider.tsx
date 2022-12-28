import { IconTypes } from 'solid-icons';
import { Accessor, createContext, createSignal, ParentComponent, useContext } from 'solid-js';
import { ZERO_POS } from '~/constants';
import { XYPosition } from '~/types';

export interface MenuOption {
  icon: IconTypes;
  label: string;
  onClick: () => void;
}

const MenuContext = createContext();

export const MenuProvider: ParentComponent = (props) => {
  const [visible, setVisible] = createSignal(false);
  const [position, setPosition] = createSignal<XYPosition>(ZERO_POS);
  const [options, setOptions] = createSignal<MenuOption[]>([]);

  const show = ({ position, options }: { position: XYPosition; options: MenuOption[] }) => {
    setVisible(true);
    setPosition(position);
    setOptions(options);
  };

  const hide = () => {
    setVisible(false);
  };

  const contextValues = {
    show,
    hide,
    visible,
    position,
    options,
  };

  return <MenuContext.Provider value={contextValues}>{props.children}</MenuContext.Provider>;
};

interface ContextValues {
  show: ({ position, options }: { position: XYPosition; options: MenuOption[] }) => void;
  hide: () => void;
  visible: Accessor<boolean>;
  position: Accessor<XYPosition>;
  options: Accessor<MenuOption[]>;
}

export const useMenu = () => useContext(MenuContext) as ContextValues;
