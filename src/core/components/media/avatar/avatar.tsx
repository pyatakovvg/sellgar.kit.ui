import React from 'react';

import cn from 'classnames';
import { Typography } from '../../content/typography';
import { Image } from '../image';
import { Dot } from '../../status/dot';

import s from './default.module.scss';

type TAvatarSize = '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';
type TAvatarColor = 'gray' | 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'brand';
type TAvatarTheme = 'accent' | 'subtle' | 'subtitle';
type TAvatarImageElement = React.ReactElement<React.ComponentProps<typeof Image>, typeof Image>;
type TAvatarTypographyElement = React.ReactElement<React.ComponentProps<typeof Typography>, typeof Typography>;
type TAvatarSvgIconElement = React.ReactElement<React.SVGProps<SVGSVGElement>, React.FC<React.SVGProps<SVGSVGElement>>>;
type TAvatarChild = TAvatarImageElement | TAvatarTypographyElement | TAvatarSvgIconElement;

interface IProps {
  children?: TAvatarChild;
  size?: TAvatarSize;
  color?: TAvatarColor;
  isStatus?: boolean;
  isNotification?: boolean;
  theme?: TAvatarTheme;
}

const AVATAR_IMAGE_SIZE_BY_SIZE: Record<TAvatarSize, number> = {
  '2xl': 64,
  xl: 56,
  lg: 48,
  md: 40,
  sm: 32,
  xs: 20,
};

const isImageElement = (child: TAvatarChild): child is TAvatarImageElement => child.type === Image;

const isTypographyElement = (child: TAvatarChild): child is TAvatarTypographyElement => child.type === Typography;

export const Avatar: React.FC<IProps> = ({ children, size = '2xl', color = 'gray', theme = 'accent', ...props }) => {
  const themeName = theme === 'subtitle' ? 'subtle' : theme;
  const className = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['size--2xl']]: size === '2xl',
          [s['size--xl']]: size === 'xl',
          [s['size--lg']]: size === 'lg',
          [s['size--md']]: size === 'md',
          [s['size--sm']]: size === 'sm',
          [s['size--xs']]: size === 'xs',
        },
        {
          [s['color--gray']]: color === 'gray',
          [s['color--green']]: color === 'green',
          [s['color--blue']]: color === 'blue',
          [s['color--orange']]: color === 'orange',
          [s['color--red']]: color === 'red',
          [s['color--purple']]: color === 'purple',
          [s['color--brand']]: color === 'brand',
        },
        {
          [s['themeAccent']]: themeName === 'accent',
          [s['themeSubtle']]: themeName === 'subtle',
        },
      ),
    [size, color, themeName],
  );

  const content = React.useMemo(() => {
    if (!children) {
      return <div className={cn(s.content, s.emptyContent)} />;
    }

    if (isImageElement(children)) {
      const imageSize = AVATAR_IMAGE_SIZE_BY_SIZE[size];

      return (
        <div className={cn(s.content, s.imageContent)}>
          {React.cloneElement(children, {
            height: imageSize,
            width: imageSize,
            style: {
              objectFit: 'cover',
              ...children.props.style,
            },
          })}
        </div>
      );
    }

    if (isTypographyElement(children)) {
      return <div className={cn(s.content, s.textContent)}>{children}</div>;
    }

    return <div className={cn(s.content, s.iconContent)}>{children}</div>;
  }, [children, size]);

  return (
    <div className={className}>
      {props.isNotification && (
        <div className={s.notification}>
          <Dot size={size} color={'red'} />
        </div>
      )}
      {content}
      {props.isStatus && (
        <div className={s.status}>
          <Dot size={size} color={'green'} />
        </div>
      )}
    </div>
  );
};
