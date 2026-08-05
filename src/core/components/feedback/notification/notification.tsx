import { Static } from './static';
import { Default } from './default';

type TNotification = {
  Static: typeof Static;
  Default: typeof Default;
};

export const Notification: TNotification = Object.assign(
  {},
  {
    Static,
    Default,
  },
);
