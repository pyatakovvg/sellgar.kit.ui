import React from 'react';

export const useSearch = (onSearch: (value: string) => void, delay: number) => {
  const [search, setSearch] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cancel = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
  };

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const reset = () => {
    cancel();
    setSearch('');
    setPending(false);
    onSearch('');
  };

  const change = (value: string) => {
    cancel();
    setSearch(value);
    const query = value.trim();

    if (!query) {
      setPending(false);
      onSearch('');
      return;
    }

    setPending(true);
    timer.current = setTimeout(() => {
      timer.current = undefined;
      onSearch(query);
      setPending(false);
    }, delay);
  };

  return { search, pending, change, reset };
};
