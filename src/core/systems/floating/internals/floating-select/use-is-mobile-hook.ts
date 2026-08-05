import React from 'react';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: 0px) and (max-width: ${768 - 1}px)`);
    const update = () => {
      setIsMobile(mql.matches);
    };

    mql.addEventListener('change', update);
    update();

    return () => {
      mql.removeEventListener('change', update);
    };
  });

  return isMobile;
};
