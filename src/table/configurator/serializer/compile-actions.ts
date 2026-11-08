import React from 'react';

import { Action } from '../actions/action/action';
import { visitDeclarations } from './visit-declarations';

import type { TableActionProps, TableActionRenderer, TableActionsProps } from '../types';

export const compileActions = (props: TableActionsProps): readonly TableActionRenderer[] => {
  const actions: TableActionRenderer[] = [];
  const ids = new Set<string>();
  const children = typeof props.children === 'function' ? props.children({ Action }) : props.children;

  visitDeclarations(children, (element) => {
    if (element.type !== Action || !React.isValidElement<TableActionProps<unknown>>(element)) {
      throw new Error('Table.Actions accepts only Action declarations.');
    }

    const action = element.props;
    const id = element.key === null ? `action:${actions.length}` : `key:${element.key}`;
    if (ids.has(id)) throw new Error(`Duplicate Table action id "${id}".`);
    ids.add(id);

    actions.push({
      id,
      disabled: action.disabled ?? false,
      onAction: action.onAction,
      render: () => action.children({ state: action.state }),
    });
  });

  return actions;
};
