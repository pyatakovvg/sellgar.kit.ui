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

## Проверка

- `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`
- Storybook scenario:
  `clients/storybook/src/kit/systems/floating/floating/floating.stories.tsx`
