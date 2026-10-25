import { Option as OptionComponent } from './option.tsx';
import { OptionPresentation } from './presentation';

export const Option = Object.assign(OptionComponent, {
  Presentation: OptionPresentation,
});
