# AGENTS.md

## Тип документа

Interaction AGENTS.

Путь: `src/core/components/overlay/modal`.

## Что это

`Modal` — controlled overlay interaction в срезе `core/components/overlay`.

## Назначение

Overlay interaction для диалогового слоя на базе OverlayDialog с close lifecycle.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.
- Делегирует open/close/focus/outside-press lifecycle в `OverlayDialog`; сам `Modal` отвечает за modal-specific layout, close slot и public API.

## Как реализован

- Public/local entrypoint: `src/core/components/overlay/modal/index.ts`.
- Source: `src/core/components/overlay/modal/modal.tsx`.
- Собственных child nodes нет.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Controlled `open` приходит от consumer; внутреннего open state в `Modal` нет.

## Public API и локальные файлы

- `export { Modal, useModalContext } from './modal.tsx';`
- Consumer import: `import { Modal } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `useModalContext`, `Close`, `ModalComponent`, `Modal`.
- Props из `IProps`: `closeOnEscape`, `closeOnOverlay`, `open`, `onRequestClose`, `onClose`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { Modal, useModalContext } from './modal.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `closeOnEscape`, `closeOnOverlay`, `open`, `onRequestClose`, `onClose`. Новые/изменённые props нужно отражать в story и документации.
- Static/compound members являются частью API; их имена и типы нельзя менять незаметно.
- `onRequestClose` может отменить закрытие через `false` или Promise; нельзя менять порядок `onRequestClose` -> `onClose` без отдельного решения.
- `Modal.Close` является public compound member и должен оставаться совместимым с native button props/ref.

## Фактическое поведение

- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- `OverlayDialog.Content` отдаёт `content.ref` и `getFloatingProps`; изменение target element ломает positioning/focus contract.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `../../../systems/floating/internals/overlay-dialog`, `./modal.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Главный риск — незаметно изменить close lifecycle, focus behavior или DOM target, на который завязан Floating UI.
- Controlled `open` не должен превращаться в implicit internal state без отдельного API-решения.

## Технический долг

- Нет отдельного loading/pending state для async `onRequestClose`.
- Нет явной документации aria-label/title contract для consumer modal content.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/symbols/modal/modal.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
