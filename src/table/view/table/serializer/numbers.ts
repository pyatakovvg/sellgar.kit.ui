export const numbers = (value: number): string => {
  if (value >= 0 && value <= 3000 && Number.isInteger(value)) return `var(--numbers-${value})`;
  if (value === 0.5) return 'var(--numbers-0_5)';
  return `calc(var(--numbers-1) * ${value})`;
};
