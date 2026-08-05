# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/status/dot`.

## Что это

`Dot` — компонент в срезе `core/components`.

## Назначение

Status primitive для компактного цветового индикатора.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/status/dot/index.ts`.
- Source: `src/core/components/status/dot/dot.tsx`.
- Собственных child nodes нет.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.

## Public API и локальные файлы

- `export { Dot } from './dot.tsx';`
- Consumer import: `import { Dot } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Dot`.
- Props из `IProps`: `size`, `color`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { Dot } from './dot.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `size`, `color`. Новые/изменённые props нужно отражать в story и документации.

## Фактическое поведение

- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `./default.module.scss`.

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
- Storybook scenario: `../../clients/storybook/src/kit/misc/divider/dot.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
