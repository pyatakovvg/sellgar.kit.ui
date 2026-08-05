# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/layout/divider`.

## Что это

`Divider` — компонент в срезе `core/components`.

## Назначение

Layout primitive для визуального разделения контента.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/layout/divider/index.ts`.
- Source: `src/core/components/layout/divider/divider.tsx`.
- Собственных child nodes нет.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { Divider } from './divider.tsx';`
- Consumer import: `import { Divider } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Divider`, `IProps`.
- Props описаны внешним типом `IProps`; перед изменением открыть файл с типом и обновить этот документ.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { Divider } from './divider.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.

## Фактическое поведение

- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`.
- Локальные imports: `../../..`, `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Primitive не должен владеть overlay, routing, global feature state или сложным interaction lifecycle.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Главный риск — незаметно изменить props, DOM structure или визуальный contract через основной import `@sellgar/kit`.

## Технический долг

- Явный технический долг по текущему source на этом уровне не зафиксирован; при новых находках дополнять этот раздел конкретными фактами.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/misc/divider/divider.stories.tsx`.
- Storybook scenario: `../../clients/storybook/src/kit/misc/divider/dot.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
