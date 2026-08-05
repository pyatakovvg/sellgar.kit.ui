export class TableInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TableInvariantError';
  }
}

export function assertTableInvariant(condition: unknown, message: string): asserts condition {
  if (condition) return;

  throw new TableInvariantError(message);
}
