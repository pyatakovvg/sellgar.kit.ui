import React from 'react';

import { loadingProgressReducer } from '../reducer/loading-progress.reducer';

export const useLoadingProgress = (loading: boolean) => {
  const [progress, dispatch] = React.useReducer(loadingProgressReducer, {
    value: 0,
    visible: loading,
    cycle: 0,
  });

  React.useLayoutEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: ReturnType<typeof setInterval> | undefined;
    let completion: ReturnType<typeof setTimeout> | undefined;
    const animate = () => {
      if (timer !== undefined) clearInterval(timer);
      if (preference.matches) {
        dispatch({ type: 'tick', value: 95 });
      } else {
        timer = setInterval(() => {
          if (!document.hidden) dispatch({ type: 'advance' });
        }, 200);
      }
    };
    if (loading) {
      dispatch({ type: 'start' });
      animate();
      preference.addEventListener('change', animate);
    } else {
      dispatch({ type: 'finish' });
      completion = setTimeout(() => dispatch({ type: 'hide' }), 200);
    }
    return () => {
      if (timer !== undefined) clearInterval(timer);
      if (completion !== undefined) clearTimeout(completion);
      preference.removeEventListener('change', animate);
    };
  }, [loading]);

  return progress;
};
