# MultiSelectTree

Controlled-мультиселект дерева. Импорт: `import { MultiSelectTree } from '@sellgar/kit'`.

- `options`, `accessor`, `optionKey`, `optionValue` аналогичны SelectTree.
- `value` обязателен и содержит массив ключей. `onChange` возвращает все выбранные
  узлы, включая полностью выбранных родителей, в порядке обхода дерева.
- Выбор родителя выбирает всю ветку; снятие выбора очищает ветку.
- При снятии потомка его родители становятся частично выбранными.
- Если выбраны все дети, родитель автоматически считается выбранным.
- Controlled-массив с ключом родителя раскрывается во всю ветку для отображения.
- Поле дочерних узлов может иметь любое указанное в `accessor` имя.
- Ключи уникальны во всём дереве; `0` и пустая строка валидны.
- `templateOption` получает исходный узел и заменяет его визуальное содержимое
  после checkbox. `templateValue` возвращает текст badge; `renderBadge` позволяет
  полностью настроить badge и получает исходный узел с guarded remove callback.
- Popup/sheet, keyboard navigation и select-all принадлежат текущему MultiSelect.
- Selection-алгоритм находится в `selection/tree-selection.ts`; общий mapper —
  `shared/utils/tree-options`, отображение глубины — `controls/tree-option`.
- Сохранять generic-контракт без `any` и type assertions.

Проверять выбор/снятие ветки, partial-parent, completion-parent, select-all,
badge removal, controlled updates, очистку, disabled и клавиатуру.
