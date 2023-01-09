import { Bounds } from '~/types';
import { ILayoutComponent } from '.';
import { isInside } from './utils';

type ComponentID = string;

const updateParent = (
  components: { [key: string]: ILayoutComponent },
  childId: ComponentID,
  newParentId: ComponentID | undefined
) => {
  postMessage({
    type: 'updateParent',
    data: {
      id: childId,
      newParent: newParentId,
    },
  });
  components[childId].parent = newParentId;

  // setComponentState('components', childId, 'parent', newParentId);
};

const addChild = (components: { [key: string]: ILayoutComponent }, parentId: ComponentID, childId: ComponentID) => {
  if (components[parentId].children.includes(childId)) return;

  postMessage({
    type: 'addChild',
    data: {
      id: parentId,
      newChild: childId,
    },
  });
  components[parentId].children = [...components[parentId].children, childId];
  updateParent(components, childId, parentId);
};

const removeChild = (components: { [key: string]: ILayoutComponent }, parentId: ComponentID, childId: ComponentID) => {
  postMessage({
    type: 'removeChild',
    data: {
      id: parentId,
      removed: childId,
    },
  });
  components[parentId].children = components[parentId].children.filter((v) => v !== childId);
};

const areChildrenOutside = (components: { [key: string]: ILayoutComponent }, id: ComponentID, bounds: Bounds) => {
  const childrenOfComponent = components[id].children;

  if (!childrenOfComponent.length) return;

  for (const child of childrenOfComponent) {
    const childBounds = components[child].bounds;

    // If any side of the child is outside the current element
    if (
      childBounds.left < bounds.left ||
      childBounds.top < bounds.top ||
      childBounds.right > bounds.right ||
      childBounds.bottom > bounds.bottom
    ) {
      // Update parent of child to grandparent.
      updateParent(components, child, components[id].parent);
      removeChild(components, id, child);
      // Resolve tree for child changes
      updateTree(components, child, childBounds);
    }
  }
};

const isOutsideParent = (components: { [key: string]: ILayoutComponent }, id: ComponentID, bounds: Bounds) => {
  const parent = components[id].parent;
  if (!parent) return;
  if (parent) {
    const parentComponent = components[parent];

    const outTop = bounds.top < parentComponent.bounds.top && bounds.bottom < parentComponent.bounds.top;
    const outLeft = bounds.left < parentComponent.bounds.left && bounds.right < parentComponent.bounds.left;
    const outRight = bounds.left > parentComponent.bounds.right && bounds.right > parentComponent.bounds.right;
    const outBottom = bounds.top > parentComponent.bounds.bottom && bounds.bottom > parentComponent.bounds.bottom;

    if (outTop || outLeft || outRight || outBottom) {
      // Remove this element from it's parent since it's outside it
      removeChild(components, parent, id);
      // Set elements' parent to grandparent
      updateParent(components, id, parentComponent.parent);
    }
  }
};

const updateTree = (
  components: { [key: string]: ILayoutComponent },
  updatedComponentId: ComponentID,
  bounds: Bounds
) => {
  isOutsideParent(components, updatedComponentId, bounds);
  areChildrenOutside(components, updatedComponentId, bounds);
  let currentMin = {
    x: 99999,
    y: 99999,
  };
  let closestParent: string | undefined = '';
  for (const component of Object.values(components)) {
    if (component.id === updatedComponentId) {
      continue;
    }
    let minDistance = {
      x: component.bounds.left - bounds.left,
      y: component.bounds.top - bounds.top,
    };
    // Inside check. Are all sides of the selected/changed component inside the current component?
    if (isInside(bounds, component.bounds)) {
      // Find the closest parent by distance
      if (Math.abs(minDistance.x) < currentMin.x && Math.abs(minDistance.y) < currentMin.y) {
        currentMin.x = Math.abs(minDistance.x);
        currentMin.y = Math.abs(minDistance.y);
        closestParent = component.id;
      }
    }
    // Outside check. Is the current component inside the selected/changed component?
    if (isInside(component.bounds, bounds)) {
      // If component already has a parent, we don't need to change it's parent.
      // If there is no parent, the component is a "root" component that the selected/changed component is covering/surrounding.
      if (!component.parent) {
        updateTree(components, component.id, component.bounds);
      }
    }
  }

  if (closestParent) {
    // If we have found the closest parent for this component, check if this component also covers any of the found parents children.
    // Move the covered children to be children on this component and remove them from the previous parent.
    // console.log(components);
    for (const child of components[closestParent].children) {
      const childComponent = components[child];
      if (isInside(childComponent.bounds, bounds)) {
        if (childComponent.parent) {
          removeChild(components, childComponent.parent, child);
        }
        addChild(components, updatedComponentId, child);
      }
    }
    if (components[updatedComponentId].parent) {
      removeChild(components, components[updatedComponentId].parent!, updatedComponentId);
    }
    addChild(components, closestParent, updatedComponentId);
  }
};

addEventListener('message', function (ev) {
  if (Object.hasOwn(ev.data, 'treeCheck')) {
    // console.log(ev.data.components);
    updateTree(ev.data.components, ev.data.id, ev.data.bounds);
  }
  // console.log(ev.data);
  // this.postMessage({ test: 234 });
});

export {};
