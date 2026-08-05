import React from 'react';

import { Process } from './process';
import { Exception } from './exception';

import cn from 'classnames';
import s from './image.module.scss';

interface IProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'width' | 'height'> {
  width?: number;
  height?: number;
}

export const Image: React.FC<IProps> = (props) => {
  const imgRef = React.useRef<HTMLImageElement>(null);

  const [isError, setError] = React.useState(false);
  const [isLoading, setLoading] = React.useState(true);

  const imageClassName = React.useMemo(
    () =>
      cn(s.image, props.className, {
        [s.hide]: isLoading || isError,
      }),
    [props.className, isLoading, isError],
  );

  React.useEffect(() => {
    const image = imgRef.current;

    const handleLoad = () => {
      setError(false);
      setLoading(false);
    };

    const handleError = () => {
      setError(true);
      setLoading(false);
    };

    if (!image) {
      return void 0;
    }

    setError(false);
    setLoading(true);

    if (image.complete) {
      if (image.naturalWidth > 0) {
        handleLoad();
      } else {
        handleError();
      }

      return void 0;
    }

    image.addEventListener('load', handleLoad);
    image.addEventListener('error', handleError);

    return () => {
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };
  }, [props.src]);

  return (
    <div className={s.wrapper} style={{ width: props.width ?? 'auto', height: props.height ?? 'auto' }}>
      {isError && (
        <div className={s.process}>
          <Exception />
        </div>
      )}
      {isLoading && (
        <div className={s.exception}>
          <Process />
        </div>
      )}
      <img ref={imgRef} {...props} className={imageClassName} alt={'image'} />
    </div>
  );
};
