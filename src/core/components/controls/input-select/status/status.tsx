import React from 'react';

import { Empty } from '../empty';

interface IProps {
  loading: boolean;
  pending: boolean;
  search: string;
  error?: string;
}

export const Status: React.FC<IProps> = (props) => {
  return (
    <Empty
      title={
        props.pending || props.loading
          ? 'Поиск…'
          : (props.error ?? (props.search ? 'Ничего не найдено' : 'Введите запрос для поиска'))
      }
    />
  );
};
