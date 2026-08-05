import React from 'react';
import cn from 'classnames';

import { User3LineIcon } from '../../../../icons';

import { Name } from './name';
import { Avatar, Typography } from '../../..';

import s from './default.module.scss';

interface IProps {
  name: string;
  caption?: string;
  badge?: string;
  avatarColor?: 'gray' | 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'brand';
  avatarTheme?: 'accent' | 'subtitle';
  hideUser?: boolean;
  onClick?: () => void;
}

const getInitials = (name: string) => {
  const allNames = name.trim().split(' ');
  return allNames.reduce((acc, curr, index) => {
    if (index === 0 || index === allNames.length - 1) {
      acc = `${acc}${curr.charAt(0).toUpperCase()}`;
    }
    return acc;
  }, '');
};

const renderAvatarContent = (name: string) => {
  if (name.length === 0) {
    return <User3LineIcon />;
  }

  return (
    <Typography size={'caption-l'} weight={'medium'}>
      <p className={s.avatarText}>{getInitials(name)}</p>
    </Typography>
  );
};

export const User: React.FC<IProps> = ({
  avatarTheme,
  avatarColor = 'orange',
  caption,
  name,
  badge,
  hideUser,
  onClick,
}) => {
  const handleClick = () => {
    onClick?.();
  };

  return (
    <div className={cn(s.wrapper, onClick && s.clickable)} data-qa={'user'} onClick={handleClick}>
      <div className={s.avatar} data-qa={'user.avatar'}>
        <Avatar size={'sm'} color={avatarColor} theme={avatarTheme}>
          {renderAvatarContent(name)}
        </Avatar>
      </div>
      {!hideUser && (
        <div className={s.content}>
          <div className={s.name} data-qa={'user.name'}>
            <Name badge={badge}>{name}</Name>
          </div>
          {caption && (
            <div className={s.caption} data-qa={'user.caption'}>
              <Typography size={'caption-s'} weight={'medium'}>
                <p>{caption}</p>
              </Typography>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
