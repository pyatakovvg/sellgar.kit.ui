import type { Ref, RefCallback } from 'react';

export const mergeRefs = <TElement>(...refs: ReadonlyArray<Ref<TElement> | undefined>): RefCallback<TElement> => {
  return (element) => {
    const cleanups = refs.map((ref) => {
      if (typeof ref === 'function') {
        const cleanup = ref(element);
        return typeof cleanup === 'function' ? cleanup : () => ref(null);
      }
      if (!ref) return;
      ref.current = element;
      return () => {
        ref.current = null;
      };
    });
    if (element === null) return;
    let attached = true;
    return () => {
      if (!attached) return;
      attached = false;
      for (const cleanup of cleanups) cleanup?.();
    };
  };
};
