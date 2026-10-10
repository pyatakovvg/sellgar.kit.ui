# SelectTree

Публичный generic-компонент одиночного выбора из вложенных options.

## Контракт

- Импорт: `import { SelectTree } from '@sellgar/kit'`.
- `accessor` задаёт поле дочерних узлов, например `children`.
- `optionKey` задаёт уникальный во всём дереве ключ типа `string | number`.
- `optionValue` задаёт поле отображаемого названия.
- `value` и `onChange` работают с ключом исходного узла, включая `0` и пустую строку.
- `options` — вложенный массив; все уровни видны сразу, ветки не сворачиваются.
- `templateOption` и `templateValue` получают исходный узел.
- Дополнительные visual/focus/disabled/clear props наследуются от `Select`.

## Реализация

- Источник восстановленного поведения: исторический `SelectTree` из коммита
  `d2931f1`, удалённый в `0e64ac2`.
- Общий обход дерева принадлежит `shared/utils/tree-options/tree-options.mapper.ts`.
- Внутренний `controls/tree-option` отображает название и маркеры глубины для обоих controls.
- Popup/sheet, клавиатура, очистка, focus и selection принадлежат текущему `Select`
  и его `Floating` infrastructure. Не дублировать эти механизмы здесь.
- Сохранять generic-контракт исходных узлов; не заменять его индексной сигнатурой
  или `any` ради `React.FC`.
- Mapper, props и внутренний TreeOption не экспортируются из публичного фасада.

## Проверка

Из корня kit: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
Ручная проверка: вложенный узел, controlled-изменение value/options, числовой ключ `0`,
очистка, пустое дерево, disabled и выбор клавиатурой; mobile sheet наследуется от `Select`.
