import { Bounds } from '~/types';
import { ILayoutComponent } from '.';
import { isInside } from './utils';

const getInsideComponents = (components: ILayoutComponent[], bounds: Bounds) => {
  return components.reduce((acc, curr) => {
    if (isInside(curr.bounds, bounds)) {
      acc.push(curr.id);
    }
    return acc;
  }, [] as string[]);
};

addEventListener('message', function (ev) {
  if (Object.hasOwn(ev.data, 'insideCheck')) {
    // console.log(ev.data.components);
    const insideComponents = getInsideComponents(ev.data.components, ev.data.bounds);
    this.postMessage({
      insideComponents,
    });
  }
  // console.log(ev.data);
  // this.postMessage({ test: 234 });
});

export {};
