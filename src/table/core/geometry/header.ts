import { clamp } from '../layout/column-layout';

export const headerViewportTop = (scroll: number, top: number, height: number, tableHeight: number): number => {
  const start = top - scroll;
  const end = start + Math.max(0, tableHeight - height);
  return clamp(0, start, end);
};
