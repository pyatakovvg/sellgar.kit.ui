# ExtendedOption

Готовая строка с leadIcon, label/caption, tailIcon, badge, toggle и expandable.
Импортировать через локальный index.ts или публичный @sellgar/kit.

- leadIcon, tailIcon, label и caption принимают ReactNode; badge принимает Badge.
- Текстовый label (string/number/bigint) получает стандартный Typography.
  Остальные ReactNode размещаются напрямую: в слот можно передать целый
  Checkbox с подписью, без внешних Typography и текстовых контейнеров.
- Стандартные текстовые label сохраняют типографику, размеры и ellipsis.
- Раскрытие/выбор дерева не принадлежат ExtendedOption. Потребитель передаёт
  готовую кнопку в leadIcon или tailIcon, checkbox — в подходящий слот.
- Стандартный expandable — декоративная стрелка справа; для отдельного
  действия раскрытия использовать слот с интерактивным компонентом.
- Не менять существующие exports или props-контракты при компоновке слотов.

Проверка: TypeScript библиотеки и stories Kit/Navigation/ExtendedOption,
включая Default и WithComponentLabel. Для slot-композиции дерева проверить
checkbox/label click, стрелку и отсутствие ошибок вложенности HTML.
