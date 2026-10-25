import React from 'react';

import { CloseCircleFillIcon } from '../../../../../../../icons';
import { Badge } from '../../../../../status/badge';

import s from './default.module.scss';

interface IProps<TOption> {
  disabled: boolean;
  maxVisibleOptions: number;
  options: readonly { id: string; option: TOption }[];
  resolveValue(option: TOption): string | number;
  renderSelectedOption?(
    option: TOption,
    props: { disabled: boolean; removable: boolean; selected: true; onRemove(): void },
  ): React.ReactNode;
  renderOverflow?(
    hiddenOptions: readonly TOption[],
    props: { disabled: boolean; hiddenCount: number; hiddenOptions: readonly TOption[] },
  ): React.ReactNode;
  onRemove(option: TOption): void;
}

export const SelectedValueList = <TOption,>(props: IProps<TOption>): React.ReactElement => {
  const visibleCount = Math.max(0, props.maxVisibleOptions);
  const visibleOptions = props.options.slice(0, visibleCount);
  const hiddenOptions = props.options.slice(visibleCount).map((entry) => entry.option);

  return (
    <div className={s.wrapper}>
      {visibleOptions.map((entry) => {
        const handleRemove = (): void => {
          if (!props.disabled) {
            props.onRemove(entry.option);
          }
        };

        return (
          <div key={entry.id} className={s.item}>
            {props.renderSelectedOption ? (
              props.renderSelectedOption(entry.option, {
                disabled: props.disabled,
                removable: !props.disabled,
                selected: true,
                onRemove: handleRemove,
              })
            ) : (
              <Badge
                color={'blue'}
                disabled={props.disabled}
                label={props.resolveValue(entry.option)}
                size={'sm'}
                tailIcon={
                  props.disabled ? (
                    void 0
                  ) : (
                    <CloseCircleFillIcon
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemove();
                      }}
                    />
                  )
                }
              />
            )}
          </div>
        );
      })}
      {hiddenOptions.length > 0 ? (
        <div className={s.overflow}>
          {props.renderOverflow ? (
            props.renderOverflow(hiddenOptions, {
              disabled: props.disabled,
              hiddenCount: hiddenOptions.length,
              hiddenOptions,
            })
          ) : (
            <Badge color={'gray'} label={`+ ещё ${hiddenOptions.length}`} size={'sm'} />
          )}
        </div>
      ) : null}
    </div>
  );
};
