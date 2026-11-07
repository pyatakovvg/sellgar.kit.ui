import React from 'react';

export const visitDeclarations = (children: React.ReactNode, visit: (element: React.ReactElement) => void): void => {
  React.Children.forEach(children, (child) => {
    if (child === null || child === undefined || typeof child === 'boolean') return;

    if (!React.isValidElement(child)) {
      throw new Error('Table declarations must be React elements, fragments or empty conditional children.');
    }

    if (child.type === React.Fragment && React.isValidElement<React.PropsWithChildren>(child)) {
      visitDeclarations(child.props.children, visit);
      return;
    }

    visit(child);
  });
};
