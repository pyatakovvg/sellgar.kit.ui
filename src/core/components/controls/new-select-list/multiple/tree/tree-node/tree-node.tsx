import React from 'react';

import { ArrowDownSLineIcon, ArrowRightSLineIcon } from '../../../../../../../icons';
import { Button } from '../../../../../action/button';
import { ExtendedOption } from '../../../../../navigation/extended-option';
import { Badge } from '../../../../../status/badge';
import { Checkbox } from '../../../../checkbox';

import s from './default.module.scss';

interface IProps {
  node: {
    id: string;
    label: string | number;
    branch: boolean;
    expanded: boolean;
    checked: boolean;
    indeterminate: boolean;
    disabled: boolean;
    count: number;
    toggleDisabled: boolean;
    children: readonly IProps['node'][];
    content?: React.ReactNode;
    custom: boolean;
    elementProps: React.ComponentProps<'div'>;
    onCheck(): void;
    onToggle(): void;
    onFocus(): void;
  };
}

export const TreeNode: React.FC<IProps> = (props) => {
  return (
    <div className={s.wrapper} role={'none'}>
      {props.node.custom ? (
        <div {...props.node.elementProps} className={s.custom}>
          {props.node.content}
        </div>
      ) : (
        <ExtendedOption
          {...props.node.elementProps}
          badge={props.node.branch ? <Badge color={'gray'} label={props.node.count} /> : void 0}
          disabled={props.node.toggleDisabled || (props.node.disabled && !props.node.branch)}
          label={
            <Checkbox
              aria-hidden={true}
              checked={props.node.checked}
              disabled={props.node.disabled}
              isIndeterminate={props.node.indeterminate}
              label={String(props.node.label)}
              size={'sm'}
              tabIndex={-1}
              onChange={props.node.onCheck}
            />
          }
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest('label')) {
              event.stopPropagation();
              return;
            }
            props.node.elementProps.onClick?.(event);
          }}
          onPointerDownCapture={(event) => {
            props.node.elementProps.onPointerDownCapture?.(event);
            if (event.button === 0 && event.target instanceof Element && event.target.closest('label')) {
              event.preventDefault();
              props.node.onFocus();
            }
          }}
          leadIcon={
            props.node.branch ? (
              <Button.Icon
                aria-label={props.node.expanded ? 'Свернуть ветвь' : 'Раскрыть ветвь'}
                disabled={props.node.toggleDisabled}
                leadIcon={props.node.expanded ? <ArrowDownSLineIcon /> : <ArrowRightSLineIcon />}
                size={'xs'}
                style={'ghost'}
                tabIndex={-1}
                type={'button'}
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  event.preventDefault();
                  props.node.onFocus();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  props.node.onToggle();
                }}
              />
            ) : (
              <React.Fragment />
            )
          }
        />
      )}
      {props.node.branch && props.node.expanded && (
        <div className={s.group} id={`${props.node.id}-group`} role={'group'}>
          {props.node.children.map((node) => (
            <TreeNode key={node.id} node={node} />
          ))}
        </div>
      )}
    </div>
  );
};
