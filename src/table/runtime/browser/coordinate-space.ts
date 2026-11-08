// DOM rectangles use screen pixels; scroll offsets and computed styles use CSS pixels.
export const elementScale = (element: HTMLElement, axis: 'X' | 'Y'): number => {
  const style = getComputedStyle(element);
  const vertical = axis === 'Y';
  const rect = element.getBoundingClientRect();
  let size = Number.parseFloat(vertical ? style.height : style.width);
  if (Number.isFinite(size) && style.boxSizing !== 'border-box') {
    const edges = vertical
      ? [style.paddingTop, style.paddingBottom, style.borderTopWidth, style.borderBottomWidth]
      : [style.paddingLeft, style.paddingRight, style.borderLeftWidth, style.borderRightWidth];
    size += edges.reduce((sum, value) => sum + (Number.parseFloat(value) || 0), 0);
  }
  if (!Number.isFinite(size) || size <= 0) size = vertical ? element.offsetHeight : element.offsetWidth;
  return size > 0 ? (vertical ? rect.height : rect.width) / size || 1 : 1;
};
