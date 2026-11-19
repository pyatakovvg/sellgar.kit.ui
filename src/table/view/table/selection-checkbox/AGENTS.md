# Table Selection Checkbox

- Приватный control Table для служебных header/body cells. Использует kit Checkbox.
- Без rowId переключает весь scope; с rowId — запись/поддерево. Читает отдельный
  SelectionRuntime, не snapshot геометрии. Нативный input сохраняется при смене
  checked/mixed; не использовать state как React key.
- Flex-root убирает строчный baseline-зазор kit Checkbox. Header/body cells
  центрируют фактическую высоту контрола, без текстового места под baseline.
  Локальные стили находятся в default.module.scss.
- Checkbox/input/label изолированы от row events существующим interactive guard.
