import { SimpleSelect } from './simple';
import { MultipleSelect } from './multiple';
import { TreeSelect } from './tree';

export const NewSelect: typeof SimpleSelect & { Multiple: typeof MultipleSelect; Tree: typeof TreeSelect } =
  Object.assign(SimpleSelect, {
    Multiple: MultipleSelect,
    Tree: TreeSelect,
  });
