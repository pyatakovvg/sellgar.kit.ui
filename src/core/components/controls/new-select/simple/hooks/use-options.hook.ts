import React from 'react';

export const useOptions = <TOption>(options: readonly TOption[]) => {
  const identitiesRef = React.useRef(new Map<TOption, number>());
  const nextIdentityRef = React.useRef(0);

  const entries = React.useMemo(() => {
    const identities = new Map<TOption, number>();
    const occurrences = new Map<TOption, number>();
    const entries = options.map((option) => {
      let id = identities.get(option) ?? identitiesRef.current.get(option);

      if (id === void 0) {
        id = nextIdentityRef.current;
        nextIdentityRef.current++;
      }

      identities.set(option, id);
      const occurrence = occurrences.get(option) ?? 0;
      occurrences.set(option, occurrence + 1);
      return { id: `${id}:${occurrence}`, option };
    });

    identitiesRef.current = identities;
    return entries;
  }, [options]);

  return { options: entries };
};
