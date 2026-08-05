import React from 'react';

export interface TableHeadProps {
  label?: React.ReactNode;
}

interface TableHeadComponent extends React.FC<TableHeadProps> {
  displayName: string;
}

export const Head: TableHeadComponent = () => null;
Head.displayName = 'TableHead';
