# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/navigation/breadcrumb`.

## Что это

`Breadcrumb` — компонент в срезе `core/components`.

## Назначение

Навигационная композиция для отображения пути и разделителей между уровнями.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерний узел `item` является приватной частью реализации и не экспортируется
  наружу.

## Как реализован

- Public/local entrypoint: `src/core/components/navigation/breadcrumb/index.ts`.
- Source: `src/core/components/navigation/breadcrumb/breadcrumb.tsx`.
- Internal item source: `src/core/components/navigation/breadcrumb/item/breadcrumb-item.tsx`.
- Internal item styles: `src/core/components/navigation/breadcrumb/item/default.module.scss`.
- Internal item docs: `src/core/components/navigation/breadcrumb/item/AGENTS.md`.
- Root-компонент принимает модель `items`, вычисляет current item и наличие
  divider по позиции элемента в `items`.

## Public API и локальные файлы

- `export { Breadcrumb } from './breadcrumb.tsx';`
- Consumer import: `import { Breadcrumb } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Breadcrumb`.
- Props из `IProps`: `size`, `divider`, `items`.
- `items[number]`: `label`, `href`, `leadIcon`, `tailIcon`, `variant`.
- Локальный part `item` не является public API.

## Контракт изменения

- Не менять локальные exports (`export { Breadcrumb } from './breadcrumb.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `size`, `divider`, `items`.
- Активный item и наличие разделителя являются внутренней производной от позиции
  элемента в `items` и не должны выноситься в публичные props.
- Для навигации используется только `href` в item model; `onClick` не является
  частью контракта Breadcrumb.
- Новые/изменённые props нужно отражать в story и документации.

## Фактическое поведение

- Принимает массив `items` и рендерит trail.
- Последний `default` item считается current и не рендерится ссылкой, даже если
  `href` передан.
- Не-current item с `href` передаётся в item как link.
- Divider отображается между элементами, но не после последнего элемента.
- Не владеет routing, focus management или keyboard navigation.

## Зависимости

- Внешние runtime imports: `react`.
- Локальные imports: `./item`, `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Composition может собирать primitives/subcomponents, но не должна становиться владельцем focus/open/selection lifecycle без переноса в `interactions`.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Текущий item определяется позицией в `items`; не выносить это в public props.
- `item` является scoped subcomponent; не экспортировать его через public API.

## Технический долг

- Явный долг на этом уровне не зафиксирован.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/navigation/breadcrumb/breadcrumb.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
