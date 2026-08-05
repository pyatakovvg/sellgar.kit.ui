import type React from 'react';
import type { TableColumnLayoutSnapshot } from '../../runtime';

export const getTablePinnedStyle = <THeader, TActionContent>(
  layout: TableColumnLayoutSnapshot<THeader, TActionContent>,
  zIndex: number,
): React.CSSProperties | undefined => {
  if (!layout.pin) return undefined;

  return {
    position: 'sticky',
    [layout.pin.side]: `${layout.pin.offset}px`,
    zIndex,
  };
};
