import React from 'react';

import type { TableExpandedRenderContext } from '../runtime/types.ts';

export interface TableExpandProps<T = unknown> {
  render?(context: TableExpandedRenderContext<T>): React.ReactNode;
}

interface TableExpandComponent {
  <T = unknown>(props: React.PropsWithChildren<TableExpandProps<T>>): React.ReactNode;
  displayName: string;
}

export const Expand: TableExpandComponent = (props) => props.children;
Expand.displayName = 'TableExpand';
