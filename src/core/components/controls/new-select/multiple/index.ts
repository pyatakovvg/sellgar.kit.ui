import { MultipleSelect as MultipleSelectComponent } from './multiple.tsx';
import { MultipleTreeSelect } from './tree';

export const MultipleSelect: typeof MultipleSelectComponent & { Tree: typeof MultipleTreeSelect } = Object.assign(
  MultipleSelectComponent,
  { Tree: MultipleTreeSelect },
);
