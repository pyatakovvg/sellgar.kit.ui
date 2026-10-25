# AGENTS.md

## Тип документа

Системный AGENTS.

Путь: `src/core/systems/floating/floating`.

## Что это

`Floating` — headless runtime-абстракция для floating/popup поведения.

## Назначение

Дать единый слой open/position/focus/dismiss/presentation поверх
`@floating-ui/react` без визуала и без доменной логики select/date/menu.

## Граница ответственности

- Отвечает только за поведение floating-слоя.
- Не импортирует visual-компоненты кита, CSS modules, иконки, тексты,
  `DropDownWrapper`, `SelectInput`, `Calendar`, `Button`, `Typography`.
- Не владеет selection/value/listbox логикой.
- Визуал полностью принадлежит компоненту, который использует `Floating`.

## Public API и локальные файлы

- `export { Floating } from './floating.tsx';`
- `export type { ... } from './floating.tsx';`
- Compound API: `Floating.Trigger`, `Floating.Content`.

## Правила изменений

- Сохранять headless-инвариант: никакого визуала внутри абстракции.
- Для новых сценариев list/select/multi/action добавлять отдельные
  behavior-слои поверх базового `Floating`, а не расширять root десятками
  доменных props.
- Desktop/mobile поведение задаётся presentation strategy, но visual shell
  рисует потребитель.
- Состояния отдавать через slot state/render prop и context внутренних parts.
- Floating.Trigger сначала передаёт keydown зарегистрированной навигации списка,
  затем общим reference interactions. Обработанный списоком Enter/Space вызывает
  preventDefault, поэтому useClick не переключает popup поверх выбора. Это важно
  для multiple с closeOnSelect=false; отдельный keyboard runtime не добавляется.
- Floating.List и Floating.Select принимают scrollItemIntoView и передают его
  существующему useListNavigation. По умолчанию true (прежнее nearest-поведение);
  потребитель может передать ScrollIntoViewOptions или false. Root Floating
  не управляет прокруткой выбранных опций и не получает новых selection props.

## Проверка

- `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`
- Storybook scenario:
  `clients/storybook/src/kit/systems/floating/floating/floating.stories.tsx`

## Навигация дерева

Floating.List дополнительно принимает role=tree, activeIndex/onNavigate и
onKeyDown. Controlled activeIndex позволяет потребителю перейти к родителю
или ребёнку. Предотвращённый onKeyDown не передаётся стандартной навигации.
List не знает о потомках, раскрытии, листах или каскадном выборе. В treeitem
семантику level/expanded/checked задаёт владелец. Для tree List сохраняет явно
переданный aria-selected, не добавляя его к дереву с aria-checked. Для listbox
aria-selected вычисляет сам List; menu не получает selection-атрибут.
Старые listbox/menu сохраняют
прежний внутренний activeIndex и keyboard-поведение.

Для tree начальный selectedIndex фиксируется на открытии. Дальнейшие изменения
каскадного выбора не вызывают повторную начальную фокусировку и scroll. При
следующем открытии снимок пересчитывается. Активная строка при взаимодействии
управляется отдельно через activeIndex/onNavigate. Listbox/menu используют
прежний selectedIndex без этого изменения.

В tree useListNavigation не сбрасывает activeIndex при pointerleave: hover
подключён готовым getItemProps, а последний активный узел сохраняется для
дальнейшего Left/Right/Enter/Space. Floating.Trigger принимает нативный role;
TreeSelect задаёт combobox и для стандартного поля, и для custom trigger.
