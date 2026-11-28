import React from 'react';

export const useEndReached = (count: number, disabled: boolean, onEndReached?: () => void) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (disabled || !count || !onEndReached || !ref.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onEndReached();
    });
    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [count, disabled, onEndReached]);

  return ref;
};
