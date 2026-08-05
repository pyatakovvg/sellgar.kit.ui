import React from 'react';

import { Popover } from '../../../..';
import { More2FillIcon } from '../../../../../icons';

import s from './header-cell-view.module.scss';

import type { TableColumnActionModel } from '../runtime/types.ts';

interface TableHeaderActionViewProps {
  action: TableColumnActionModel<unknown, React.ReactNode>;
  closeMenu(): void;
}

interface TableHeaderActionsViewProps {
  actions: readonly TableColumnActionModel<unknown, React.ReactNode>[];
  open: boolean;
  onOpenChange(open: boolean): void;
}

const TableHeaderActionView: React.FC<TableHeaderActionViewProps> = (props) => {
  const handleAction = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (props.action.disabled) return;

      props.action.onAction();
      props.closeMenu();
    },
    [props.action, props.closeMenu],
  );

  return (
    <button
      className={s.headerAction}
      type="button"
      role="menuitem"
      disabled={props.action.disabled}
      data-row-event-ignore=""
      onClick={handleAction}
    >
      {props.action.render({ state: props.action.state })}
    </button>
  );
};

export const TableHeaderActionsView: React.FC<TableHeaderActionsViewProps> = (props) => {
  const closeMenu = React.useCallback(() => props.onOpenChange(false), [props.onOpenChange]);

  if (props.actions.length === 0) return null;

  return (
    <Popover open={props.open} onOpenChange={props.onOpenChange} placement="bottom-end">
      <span className={s.headerActionsTriggerGuard} data-row-event-ignore="" data-table-header-control="">
        <Popover.Trigger ariaLabel="Действия с колонкой" tabIndex={0}>
          <span className={s.headerActionsTrigger}>
            <More2FillIcon />
          </span>
        </Popover.Trigger>
      </span>

      <Popover.Content>
        <div className={s.headerActionsMenu} role="menu">
          {props.actions.map((action, index) => (
            <TableHeaderActionView key={index} action={action} closeMenu={closeMenu} />
          ))}
        </div>
      </Popover.Content>
    </Popover>
  );
};
