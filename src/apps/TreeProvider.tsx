import { createContext, createEffect, createMemo, on, ParentComponent, useContext } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { Bounds } from '~/types';
import { useBuilder } from './LayoutBuilder';
import { isInside } from './LayoutBuilder/utils';

interface ComponentTree {
  [key: string]: {
    id: string;
    parent?: string;
    children: string[];
  };
}

interface TreeContextValues {
  tree: ComponentTree;
  updateTree: (updatedId: string, bounds: Bounds) => void;
  addChild: (parentId: string, childId: string) => void;
  removeChild: (parentId: string, childId: string) => void;
  updateParent: (childId: string, newParentId: string | undefined) => void;
  addNewLeaf: (id: string) => void;
  removeLeaf: (id: string) => void;
}

export const TreeContext = createContext<TreeContextValues>();

export const TreeProvider: ParentComponent = (props) => {
  const builder = useBuilder();

  const [tree, setTree] = createStore<ComponentTree>({});

  const components = createMemo(() => builder.componentState.components);

  /** HIERARCHY  */
  const updateParent = (childId: string, newParentId: string | undefined) => {
    if (tree[childId].parent === newParentId) return;
    // console.log('update parent', childId, newParentId);
    setTree(childId, 'parent', newParentId);
  };

  const addChild = (parentId: string, childId: string) => {
    if (tree[parentId].children.includes(childId)) return;
    // console.log('add child', components()[parentId].children.includes(childId));
    setTree(parentId, 'children', (p) => {
      // If the child already exists, we can skip adding it.
      if (p.includes(childId)) {
        return p;
      }
      updateParent(childId, parentId);
      return [...p, childId];
    });
  };

  const removeChild = (parentId: string, childId: string) => {
    if (!tree[parentId].children.includes(childId)) return;
    // console.log('remove child');
    setTree(parentId, 'children', (p) => p.filter((child) => child !== childId));
  };

  const areChildrenOutside = (id: string, bounds: Bounds) => {
    const childrenOfComponent = tree[id].children;

    if (!childrenOfComponent.length) return;

    for (const child of childrenOfComponent) {
      const childBounds = components()[child].bounds;

      // If any side of the child is outside the current element
      if (
        childBounds.left < bounds.left ||
        childBounds.top < bounds.top ||
        childBounds.right > bounds.right ||
        childBounds.bottom > bounds.bottom
      ) {
        // console.log(`Child with ID: ${child} is outside it's parent. Moving ${child} to ${getComponent(id).parent}`);
        // Update parent of child to grandparent.
        updateParent(child, tree[id].parent);
        if (tree[id].parent) {
          addChild(tree[id].parent!, child);
        }
        removeChild(id, child);
        // Resolve tree for child changes
        // updateTree(child, childBounds);
      }
    }

    // console.log('after child changes: ', components());
  };

  const isOutsideParent = (id: string, bounds: Bounds) => {
    const parent = tree[id].parent;
    if (!parent) return;
    if (parent) {
      const parentComponent = components()[parent];

      const outTop = bounds.top < parentComponent.bounds.top && bounds.bottom < parentComponent.bounds.top;
      const outLeft = bounds.left < parentComponent.bounds.left && bounds.right < parentComponent.bounds.left;
      const outRight = bounds.left > parentComponent.bounds.right && bounds.right > parentComponent.bounds.right;
      const outBottom = bounds.top > parentComponent.bounds.bottom && bounds.bottom > parentComponent.bounds.bottom;

      if (outTop || outLeft || outRight || outBottom) {
        // Remove this element from it's parent since it's outside it
        removeChild(parent, id);
        // Set elements' parent to grandparent
        updateParent(id, tree[parentComponent.id].parent);
      }
    }
  };

  const updateTree = (updatedComponentId: string, bounds: Bounds) => {
    isOutsideParent(updatedComponentId, bounds);
    areChildrenOutside(updatedComponentId, bounds);
    let currentMin = {
      x: 99999,
      y: 99999,
    };
    let closestParent: string | undefined = undefined;
    for (const component of Object.values(components())) {
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
        if (!tree[component.id].parent) {
          updateTree(component.id, component.bounds);
        }
      }
    }

    if (closestParent) {
      // If we have found the closest parent for this component, check if this component also covers any of the found parents children.
      // Move the covered children to be children on this component and remove them from the previous parent.
      for (const child of tree[closestParent].children) {
        if (child === updatedComponentId) continue;
        const childComponent = components()[child];
        if (isInside(childComponent.bounds, bounds)) {
          if (tree[child].parent) {
            removeChild(tree[child].parent!, child);
          }
          addChild(updatedComponentId, child);
        }
      }
      if (tree[updatedComponentId].parent === closestParent) return;
      if (tree[updatedComponentId].parent) {
        removeChild(tree[updatedComponentId].parent!, updatedComponentId);
      }
      addChild(closestParent, updatedComponentId);
    }
  };

  const addNewLeaf = (id: string) => {
    setTree(id, { id, children: [] });
  };

  const removeLeaf = (id: string) => {
    const selfParent = tree[id].parent;
    const selfChildren = tree[id].children;

    if (selfParent) {
      removeChild(selfParent, id);
    }

    for (const child of selfChildren) {
      updateParent(child, selfParent);
      if (selfParent) {
        addChild(selfParent, child);
      }
    }

    const { [id]: _, ...rest } = { ...tree };
    setTree(reconcile(rest));
  };

  const context: TreeContextValues = {
    tree,
    updateTree,
    addChild,
    removeChild,
    updateParent,
    addNewLeaf,
    removeLeaf,
  };

  return <TreeContext.Provider value={context}>{props.children}</TreeContext.Provider>;
};

export const useTree = () => useContext(TreeContext);
