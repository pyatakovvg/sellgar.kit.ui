import React from 'react';

import s from './default.module.scss';

const Label: React.FC<React.PropsWithChildren> = (props) => {
  return <div className={s.label}>{props.children}</div>;
};

const Content: React.FC<React.PropsWithChildren> = (props) => {
  return <div className={s.content}>{props.children}</div>;
};

const Caption: React.FC<React.PropsWithChildren> = (props) => {
  return <div className={s.caption}>{props.children}</div>;
};

const FieldWrapperComponent: React.FC<React.PropsWithChildren> = (props) => {
  return (
    <div className={s.wrapper}>
      {React.Children.map(props.children, (child) => {
        if (React.isValidElement(child)) {
          return child;
        }
        return null;
      })}
    </div>
  );
};

type TFieldWrapper = typeof FieldWrapperComponent & {
  Label: typeof Label;
  Content: typeof Content;
  Caption: typeof Caption;
};

export const Field = Object.assign(FieldWrapperComponent, {
  Label,
  Content,
  Caption,
}) as TFieldWrapper;
