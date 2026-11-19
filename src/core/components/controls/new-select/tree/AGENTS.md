# NewSelect.Tree

Самостоятельный controlled селект одиночного листа. Props приватны в tree.tsx;
фасад семейства только добавляет Tree к NewSelect.

- resolveChildren читает произвольную структуру исходных опций. Пустой массив
  и undefined означают лист; async/lazy loading не добавлены.
- Нажатие/Enter/Space на ветви раскрывает или сворачивает её без onChange.
- Выбираются только листья, пустое значение — undefined. resolveKey может
  возвращать произвольный TResult; без него возвращается исходный TOption.
- isValueEqual сравнивает результаты. Ветка в value не считается выбором.
- renderOption получает исходную опцию, index, depth, isBranch/isExpanded и
  обычные состояния строки. Оболочка с событиями и ARIA остаётся приватной.
- renderTrigger имеет тот же контракт, что у simple: open/disabled/selectedOption.
- Используются старые Select Surface/Placeholder/Empty в рамках постепенной
  миграции. Новый popup, sheet или scrollbar не создаются.
- Технический systems/tree хранит раскрытие/активную строку, не selection.
  Disabled ветвь блокирует выбор поддерева; раскрытие остаётся доступным. Существующий Floating.List прокручивает видимый выбранный лист к центру.
- Floating.List используется с role=tree и controlled activeIndex. Left/Right
  обрабатывает дерево; Up/Down/Home/End — готовая навигация Floating.
- Generic arrow function разрешена пользователем вместо React.FC.

Stories: Kit/Controls/NewSelect/Tree. Проверять primitive/object resolver,
ветви без выбора, keyboard, disabled, custom option/trigger, mobile и scroll.

## Начальное раскрытие

- defaultExpanded?: boolean, по умолчанию true — всё дерево раскрыто.
- false изначально сворачивает все ветви, включая путь к выбранному листу.
- Это начальное значение при монтировании, без сброса при открытии popup или
  изменении prop. Пользовательские переключения сохраняются между открытиями.
- Prop исключается перед native spread, selection-контракт не меняется.
- Stories InitiallyExpanded/InitiallyCollapsed используют глубокое дерево;
  SelectedInCollapsedTree проверяет, что value не раскрывает предков.

## Выбор ветвей

- `selectBranches?: boolean` (по умолчанию false) разрешает выбирать любой доступный узел.
- В этом режиме клик/Enter/Space на строке выбирает узел и закрывает popup; отдельная
  кнопка стрелки раскрывает ветку. Left/Right сохраняют навигацию дерева.
- В value допускается ветвь. Disabled-ветвь по-прежнему можно раскрыть, но нельзя выбрать.
- Используется для родительской категории; имена категорий и фильтрация поддерева
  принадлежат feature, не kit.
