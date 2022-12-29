import { Accessor, createContext, createSignal, onMount, ParentComponent, useContext } from 'solid-js';

const HighlighterContext = createContext();

export const HighlighterProvider: ParentComponent = (props) => {
  const [observer, setObserver] = createSignal<IntersectionObserver>();

  const [insideComponents, setInsideComponents] = createSignal<string[]>([]);

  const intersectionCallback = (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        setInsideComponents((p) => [...p, entry.target.id]);
      }
    }
  };

  const createObserver = (element: HTMLElement) => {
    setObserver(new IntersectionObserver(intersectionCallback, { root: element }));
  };

  const observe = (element: HTMLElement) => {
    observer()?.observe(element);
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
