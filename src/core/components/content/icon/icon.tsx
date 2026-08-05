import React from 'react';

import { iconName, type TIconName } from './icon.types.ts';

import cn from 'classnames';

interface IProps {
  className?: string;
  icon: TIconName;
}

export const IconComponent: React.FC<IProps> = (props) => {
  const className = React.useMemo(() => cn('icon-' + props.icon, props.className), [props.className, props.icon]);

  return <span className={className} />;
};

type TIcon = typeof IconComponent & typeof iconName;

export const Icon: TIcon = Object.assign(IconComponent, { ...iconName });
