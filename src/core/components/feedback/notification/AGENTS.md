# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/feedback/notification`.

## Что это

`Notification` — компонент в срезе `core/components`.

## Назначение

Feedback composition для уведомлений с default/static вариантами.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `default`, `static`.

## Как реализован

- Public/local entrypoint: `src/core/components/feedback/notification/index.ts`.
- Source: `src/core/components/feedback/notification/notification.tsx`.
- Child node: `src/core/components/feedback/notification/default`.
- Child node: `src/core/components/feedback/notification/static`.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.

## Public API и локальные файлы

- `export { Notification } from './notification.tsx';`
- Consumer import: `import { Notification } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Notification`.
- Собственный interface `IProps` в локальном source не объявлен; props contract задаётся imported/React props или ближайшим parent component.
- Локальные parts: `default`, `static`.

## Контракт изменения

- Не менять локальные exports (`export { Notification } from './notification.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Static/compound members являются частью API; их имена и типы нельзя менять незаметно.

## Фактическое поведение

- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.

## Зависимости

- Локальные imports: `./static`, `./default`.

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
- Storybook scenario: `../../clients/storybook/src/kit/symbols/notification/notification-default.stories.tsx`.
- Storybook scenario: `../../clients/storybook/src/kit/symbols/notification/notification-static.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
