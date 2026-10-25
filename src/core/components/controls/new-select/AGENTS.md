# AGENTS.md

## Что это

Новое изолированное семейство селектов: реализованы simple, multiple, tree и multiple/tree.
Локальный index.ts собирает NewSelect, NewSelect.Multiple, NewSelect.Tree и NewSelect.Multiple.Tree через фасады.
Они экспортируются через основной @sellgar/kit параллельно со старыми Select/MultiSelect.
Имя NewSelect временное на период миграции, чтобы не пересекаться с public Select.

## Границы

- Simple, multiple, tree и multiple/tree имеют самостоятельные props и реализации.
- Фасад только собирает компоненты; не объединяет их props и состояние.
- Использовать существующие Floating и визуальные компоненты кита.
- Список опций — приватная часть конкретного селекта. Его связь с Floating.Select
  остаётся внутренней. Самостоятельное семейство new-select-list реализует
  отдельный inline-список; оно не импортирует эти приватные списки.
- Старые public Select/MultiSelect не заменяются. Stories используют NewSelect
  через @sellgar/kit; глубокие импорты source в stories не нужны.
- Фасады экспортируют только компоненты. Props остаются приватными.
- Применяется fe-react-component-structure; для generic-компонентов согласовано
  объявление generic arrow function вместо React.FC с приватным IProps.

## Согласованный контракт

- `resolveKey(option)` необязателен: определяет произвольный результат выбора,
  включая объект. Без него результатом является исходная опция.
- `resolveValue(option)` определяет отображение исходной опции.
- `onChange` получает один аргумент; отсутствие single-значения — `undefined`.
- Multiple получает/возвращает массив; пустой выбор — []. resolveValue у Multiple
  возвращает string|number по решению пользователя для стандартных badges.
- Идентичность строк не определяется результатом `resolveKey`.
- Каждый компонент семейства поддерживает renderTrigger для замены стандартного
  триггера. Отдельные Button-разновидности не создаются. Callback возвращает
  ReactElement для существующего Floating.Trigger; его state описывается в props
  конкретного компонента. Single отдаёт selectedOption, multiple — selectedOptions.
- Кастомизация trigger не объединяет props и механику выбора разных селектов.

## Проверка

- TypeScript: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`
  из `library/kit`.
- Проверять вывод типов без resolver, с primitive и object результатами, а также
  controlled очистку, disabled и клавиатуру.

## Дерево

- Tree выбирает только листья; нажатие на ветвь переключает раскрытие.
- Multiple.Tree каскадно выбирает доступные листья; родительские checked/mixed
  вычисляются из value. Стрелка раскрытия не выбирает значения.
- resolveChildren не требует определённого имени поля дочерних узлов.
- Общий systems/tree ограничен обходом/идентичностью/раскрытием/активной строкой.
  Контракты выбора каждого компонента остаются отдельными.
- Каскадный выбор Multiple.Tree использует systems/tree-selection совместно
  с NewSelectList.Multiple.Tree; визуальные компоненты и props остаются отдельными.

- Tree и Multiple.Tree принимают defaultExpanded (по умолчанию true). Он задаёт
  начальное раскрытие всех ветвей; false сворачивает все ветви. Повторное открытие
  popup и выбранное значение не переопределяют ручное раскрытие пользователя.
