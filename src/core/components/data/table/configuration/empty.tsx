import React from 'react';

export interface TableEmptyProps {}

interface TableEmptyComponent extends React.FC<React.PropsWithChildren<TableEmptyProps>> {
  displayName: string;
}

export const Empty: TableEmptyComponent = (props) => props.children;
Empty.displayName = 'TableEmpty';
