/** Resolves the kit numbers scale, not browser CSS pixels. */
export const resolveColumnSize = (
  value: number | string | undefined,
  columnId: string,
  name: string,
): number | undefined => {
  if (typeof value !== 'string') return value;

  const token = /^var\(\s*--numbers-(0|[1-9]\d*|0_[12356]|1_[567]|2_2)\s*\)$/.exec(value.trim());
  const size = token ? Number(token[1].replace('_', '.')) : NaN;
  if (!Number.isFinite(size) || size > 3000) {
    throw new Error(`Table column "${columnId}": ${name} must reference an existing numbers token.`);
  }

  return size;
};
