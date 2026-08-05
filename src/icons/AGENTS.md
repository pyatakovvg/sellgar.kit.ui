# AGENTS.md

## Что это

Отдельный icon slice библиотеки `@sellgar/kit`.

## Назначение

Каталог отвечает за public icon API, который должен потребляться через отдельный import:

```ts
import { AddLineIcon } from '@sellgar/kit/icons';
```

Иконки не являются частью core UI entrypoint `@sellgar/kit`.

## Как реализован

- Public entrypoint каталога: `src/icons/index.ts`.
- Generated React icon components лежат в `src/icons/generated`.
- `index.ts` явно экспортирует generated icons из `generated`.
- Визуальный wrapper-компонент `Icon` не находится здесь. Он относится к `src/core/components/content/icon`.

## Public API и локальные файлы

- Public API: exports из `src/icons/index.ts`.
- Generated implementation: `src/icons/generated/*.icon.tsx`.
- Добавление, удаление или переименование icon export является изменением public API `@sellgar/kit/icons`.

## Фактическое поведение

- Компоненты иконок являются render-only React components.
- Каталог большой по количеству файлов и влияет на размер icons entrypoint.
- `core` может импортировать отдельные иконки из этого slice, но `icons` не должен импортировать `core`.

## Зависимости

- React runtime.
- Generated SVG/JSX components.

## Правила изменений

- Не добавлять иконки в основной `src/index.ts`.
- Не создавать общий public import `@sellgar/kit/icons/generated`.
- Не смешивать generated icons и hand-written helpers в одном каталоге.
- При изменении набора иконок синхронизировать `src/icons/index.ts`.
- Не перечислять полный icon set в документации; source of truth это `src/icons/index.ts`.

## Риски и точки внимания

- Неправильный export ломает consumer imports из `@sellgar/kit/icons`.
- Массовый icon set может раздувать bundle, если consumer build не tree-shake-ит icon entrypoint.
- Регенерация icon set должна рассматриваться как отдельное изменение с проверкой размера сборки.

## Технический долг

- Нет manifest-файла, который фиксирует источник icon set и правила регенерации.
- Нужна отдельная проверка tree-shaking стратегии для `@sellgar/kit/icons`.

## Проверка

- После изменения icon exports запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public API или сборки запускать `yarn build` в `library/kit`.
- Проверять, что import из `@sellgar/kit/icons` резолвит изменённые иконки.
