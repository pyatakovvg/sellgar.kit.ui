import React from 'react';

export const visitDeclarations = (
  children: React.ReactNode,
  visit: (element: React.ReactElement, path: string) => void,
  parentPath = '',
): void => {
  React.Children.forEach(children, (child, index) => {
    if (child === null || child === undefined || typeof child === 'boolean') return;

    if (!React.isValidElement(child)) {
      throw new Error('Table declarations must be React elements, fragments or empty conditional children.');
    }

    const position = child.key === null ? String(index) : JSON.stringify(child.key);
    const path = parentPath ? `${parentPath}/${position}` : position;

    if (child.type === React.Fragment && React.isValidElement<React.PropsWithChildren>(child)) {
      visitDeclarations(child.props.children, visit, path);
      return;
    }

    visit(child, path);
  });
};
