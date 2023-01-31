import { onCleanup, onMount } from 'solid-js';

const DEFAULT_EVENTS = ['mousedown', 'touchstart'];

interface Props {
  ref: () => HTMLElement | undefined;
  callbackFn: () => void;
}

export function useClickOutside(props: Props) {
  onMount(() => {
    const listener = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const shouldIgnore = !document.body.contains(target);
      const shouldTrigger = props.ref() && !props.ref()!.contains(target);
      shouldTrigger && !shouldIgnore && props.callbackFn();
    };

    document.addEventListener('mousedown', listener);
    onCleanup(() => {
      document.removeEventListener('mousedown', listener);
    });
  });
}
