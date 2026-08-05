# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/content/chip`.

## Что это

`Chip` — компонент в срезе `core/components`.

## Назначение

Интерактивная композиция короткого selectable/removable/content маркера с
настраиваемыми lead/tail областями.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не
  экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/content/chip/index.ts`.
- Source: `src/core/components/content/chip/chip.tsx`.
- Stateless/render-only component: явного локального state, effects, refs или browser API в основном source не обнаружено.

## Public API и локальные файлы

- `export { Chip } from './chip.tsx';`
- Consumer import: `import { Chip } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Chip`.
- Props из `IProps`: button HTML attributes кроме `children`, `className`,
  `disabled` и `type`, а также `size`, `shape`, `isSelected`, `isStatic`,
  `disabled`, `leadIcon`, `tailIcon`, `label`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { Chip } from './chip.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: button HTML attributes кроме `children`, `className`,
  `disabled` и `type`, а также `size`, `shape`, `isSelected`, `isStatic`,
  `disabled`, `leadIcon`, `tailIcon`, `label`. Новые/изменённые props нужно
  отражать в story и документации.

## Фактическое поведение

- Stateless/render-only component: явного локального state, effects, refs или browser API в основном source не обнаружено.
- Root element — нативный `button`, потому что Chip интерактивен и должен
  поддерживать keyboard focus и `focus-visible`.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Composition может собирать primitives/subcomponents, но не должна становиться владельцем focus/open/selection lifecycle без переноса в `interactions`.
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
- Storybook scenario: `../../clients/storybook/src/kit/content/chip/chip.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
