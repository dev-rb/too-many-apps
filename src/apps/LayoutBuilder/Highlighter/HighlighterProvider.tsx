import { Accessor, createContext, createSignal, onMount, ParentComponent, useContext } from 'solid-js';
import { useBuilder } from '..';

const HighlighterContext = createContext();

export const HighlighterProvider: ParentComponent = (props) => {
  const builder = useBuilder();
  const [observer, setObserver] = createSignal<IntersectionObserver>();

  const [insideComponents, setInsideComponents] = createSignal<HTMLElement[]>([]);

  const intersectionCallback = (entries: IntersectionObserverEntry[]) => {
    console.log(entries);
    builder.selectMultipleComponents(entries.map((v) => v.target.id));
    // for (const entry of entries) {
    //   if (entry.target) {
    //     builder.selectComponent(entry.target.id);
    //     // console.log(entry);
    //   }
    // }
  };

  const createObserver = (element: HTMLElement) => {
    // setObserver(
    //   new IntersectionObserver(intersectionCallback, {
    //     root: element,
    //     threshold: 0.5,
    //   })
    // );
    // console.log(observer());
    // for (const el of insideComponents()) {
    //   observer()?.observe(el);
    // }
  };

  const observe = (element: HTMLElement) => {
    setInsideComponents((p) => [...p, element]);
  };

  const values = {
    createObserver,
    observe,
    insideComponents,
  };

  return <HighlighterContext.Provider value={values}>{props.children}</HighlighterContext.Provider>;
};

interface HighlighterValues {
  createObserver: (element: HTMLElement) => void;
  observe: (element: HTMLElement) => void;
  insideComponents: Accessor<string[]>;
}

export const useHighlighter = () => useContext(HighlighterContext) as HighlighterValues;
