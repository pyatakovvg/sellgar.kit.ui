import React from 'react';

import { Loader4LineIcon } from '../../../../icons';

import { Badge } from '../../status/badge';
import { Animate } from '../../feedback/animate';

import { ButtonIcon } from './button-icon';

import cn from 'classnames';
import s from './default.module.scss';

type PropsOf<T> = T extends React.ComponentType<infer P> ? P : never;

export interface IProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'className'> {
  ref?: React.Ref<HTMLButtonElement>;
  style?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  size?: 'lg' | 'md' | 'sm' | 'xs';
  target?: 'default' | 'destructive' | 'success' | 'info';
  shape?: 'rounded' | 'pill';
  leadIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  badge?: React.ReactNode;
  inProcess?: boolean;
}

const useBadgeSize = (size: IProps['size']) => {
  return React.useMemo(() => {
    switch (size) {
      case 'lg':
        return 'md';
      case 'md':
      case 'sm':
        return 'sm';
      case 'xs':
        return 'xs';
    }
  }, [size]);
};

const useBadgeColor = (
  style: NonNullable<IProps['style']> = 'primary',
  target: NonNullable<IProps['target']> = 'default',
) => {
  return React.useMemo(() => {
    const colorMap: Record<
      NonNullable<IProps['target']>,
      Record<NonNullable<IProps['style']>, PropsOf<typeof Badge>['color']>
    > = {
      default: {
        primary: 'white',
        secondary: 'gray',
        tertiary: 'white',
        ghost: 'gray',
      },
      destructive: {
        primary: 'white-destructive',
        secondary: 'surface-destructive',
        tertiary: 'surface-destructive',
        ghost: 'surface-destructive',
      },
      info: {
        primary: 'white-info',
        secondary: 'surface-info',
        tertiary: 'surface-info',
        ghost: 'surface-info',
      },
      success: {
        primary: 'white-success',
        secondary: 'surface-success',
        tertiary: 'surface-success',
        ghost: 'surface-success',
      },
    };

    return colorMap[target]?.[style] ?? undefined;
  }, [style, target]);
};

const useBadgeStroke = (style: IProps['style']) => {
  return React.useMemo(() => {
    switch (style) {
      case 'primary':
        return false;
      case 'secondary':
        return true;
      case 'tertiary':
        return true;
      case 'ghost':
        return true;
    }
  }, [style]);
};

export const ButtonComponent: React.FC<IProps> = ({
  ref,
  size = 'md',
  style = 'primary',
  shape = 'rounded',
  target = 'default',
  leadIcon,
  tailIcon,
  badge,
  inProcess,
  ...props
}) => {
  const classNameButton = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['size--lg']]: size === 'lg',
          [s['size--md']]: size === 'md',
          [s['size--sm']]: size === 'sm',
          [s['size--xs']]: size === 'xs',
        },
        {
          [s['style--primary']]: style === 'primary',
          [s['style--secondary']]: style === 'secondary',
          [s['style--tertiary']]: style === 'tertiary',
          [s['style--ghost']]: style === 'ghost',
        },
        {
          [s['target--info']]: target === 'info',
          [s['target--success']]: target === 'success',
          [s['target--destructive']]: target === 'destructive',
        },
        {
          [s['shape--rounded']]: shape === 'rounded',
          [s['shape--pill']]: shape === 'pill',
        },
      ),
    [size, style, target, shape],
  );

  const badgeSize = useBadgeSize(size);
  const badgeColor = useBadgeColor(style, target);
  const badgeStroke = useBadgeStroke(style);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (inProcess) {
      event.preventDefault();
      event.stopPropagation();
      return void 0;
    }
    props.onClick?.(event);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (inProcess) {
      event.preventDefault();
      event.stopPropagation();
      return void 0;
    }
    props.onKeyDown?.(event);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (inProcess) {
      event.preventDefault();
      event.stopPropagation();
      return void 0;
    }
    props.onMouseDown?.(event);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (inProcess) {
      event.preventDefault();
      event.stopPropagation();
      return void 0;
    }
    props.onPointerDown?.(event);
  };

  const ariaBusy = inProcess ? true : props['aria-busy'];
  const ariaDisabled = inProcess ? true : props['aria-disabled'];

  const leadIconClassName = React.useMemo(
    () =>
      cn(s['lead-icon'], {
        [s['hidden']]: inProcess,
      }),
    [inProcess],
  );

  const badgeClassName = React.useMemo(
    () =>
      cn(s.badge, {
        [s['hidden']]: inProcess,
      }),
    [inProcess],
  );
  const textClassName = React.useMemo(
    () =>
      cn(s.text, {
        [s['hidden']]: inProcess,
      }),
    [inProcess],
  );
  const tailIconClassName = React.useMemo(
    () =>
      cn(s['tail-icon'], {
        [s['hidden']]: inProcess,
      }),
    [inProcess],
  );

  return (
    <button
      ref={ref}
      {...props}
      aria-busy={ariaBusy}
      aria-disabled={ariaDisabled}
      className={classNameButton}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onPointerDown={handlePointerDown}
    >
      {leadIcon && <div className={leadIconClassName}>{leadIcon}</div>}

      {props.children && <div className={textClassName}>{props.children}</div>}
      {badge && (
        <div className={badgeClassName}>
          {React.Children.map(badge, (child) => {
            if (React.isValidElement(child)) {
              const childElement = child as React.ReactElement<React.ComponentProps<typeof Badge>>;
              return React.cloneElement(childElement, {
                size: badgeSize,
                color: childElement.props.color || badgeColor,
                stroke: badgeStroke,
                disabled: props.disabled,
              });
            }
            return child;
          })}
        </div>
      )}
      {tailIcon && <div className={tailIconClassName}>{tailIcon}</div>}

      {inProcess && (
        <div className={s.spinner}>
          <Animate.Spin>
            <div className={s['lead-icon']}>
              <Loader4LineIcon />
            </div>
          </Animate.Spin>
        </div>
      )}
    </button>
  );
};

type TButton = typeof ButtonComponent & {
  Icon: typeof ButtonIcon;
};

export const Button: TButton = Object.assign(ButtonComponent, {
  Icon: ButtonIcon,
});
