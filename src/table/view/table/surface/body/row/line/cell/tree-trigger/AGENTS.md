# TreeTrigger

- Внутренняя кнопка раскрытия ветви, доступная через `Cell.render` scope.
- Состояние получает из RowContext, команду передаёт browser/runtime; дерево не хранит в React.
- Клик кнопки исключается стандартным guard из primary row action.
