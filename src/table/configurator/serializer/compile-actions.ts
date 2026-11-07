import React from 'react';

import { Action } from '../actions/action/action';
import { visitDeclarations } from './visit-declarations';

import type { TableActionProps, TableActionRenderer, TableActionsProps } from '../types';

export const compileActions = (props: TableActionsProps): readonly TableActionRenderer[] => {
  const actions: TableActionRenderer[] = [];
  const children = typeof props.children === 'function' ? props.children({ Action }) : props.children;

  visitDeclarations(children, (element) => {
    if (element.type !== Action || !React.isValidElement<TableActionProps<unknown>>(element)) {
      throw new Error('Table.Actions accepts only Action declarations.');
    }

    const action = element.props;

    actions.push({
      disabled: action.disabled ?? false,
      onAction: action.onAction,
      render: () => action.children({ state: action.state }),
    });
  });

  return actions;
};
