# AGENTS.md

## Тип документа

Interaction AGENTS.

Путь: `src/core/components/overlay/popover`.

## Что это

`Popover` — overlay-компонент в срезе `core/components/overlay`.

## Назначение

Floating interaction с compound Trigger/Content, controlled/uncontrolled open и Floating UI positioning.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/overlay/popover/index.ts`.
- Source: `src/core/components/overlay/popover/popover.tsx`.
- Собственных child nodes нет.
- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Использует React context; provider/hook contract нельзя менять без оценки downstream components.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Владеет floating/open/focus lifecycle через Floating UI; проверять keyboard, blur/click outside, portal и mobile behavior.
- Trigger reference wrapper участвует в focus lifecycle, но не должен рисовать visual focus state за вложенные input-like controls.
- Поддерживает `disabled`; disabled-состояние не должно запускать пользовательские действия.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { Popover } from './popover.tsx';`
- Consumer import: `import { Popover } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `usePopoverContext`, `Popover`.
- Props из `IProps`: `initialOpen`, `open`, `placement`, `disabled`, `role`, `sizeToReference`, `onOpenChange`.
- Props из `Popover.Trigger`: `icon`, `ariaLabel`, `tabIndex`, `onFocus`, `onBlur`, `onKeyDown`, `children`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { Popover } from './popover.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `initialOpen`, `open`, `placement`, `disabled`, `role`, `sizeToReference`, `onOpenChange`. Новые/изменённые props нужно отражать в story и документации.
- Static/compound members являются частью API; их имена и типы нельзя менять незаметно.
- `Popover.Trigger.tabIndex` управляет focus order reference-wrapper и не должен подменять open/focus lifecycle самого `Popover`.
- `Popover.Trigger.onFocus` и `Popover.Trigger.onBlur` нужны для parent interactions, которым нужно связать DOM focus reference-wrapper с собственным визуальным состоянием.
- Focusable `Popover.Trigger` открывается и закрывается по `Enter`/`Space` через Floating UI reference lifecycle.

## Фактическое поведение

- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Использует React context; provider/hook contract нельзя менять без оценки downstream components.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Владеет floating/open/focus lifecycle через Floating UI; проверять keyboard, blur/click outside, portal и mobile behavior.
- Trigger reference wrapper участвует в focus lifecycle, но не должен рисовать visual focus state за вложенные input-like controls.
- Поддерживает `disabled`; disabled-состояние не должно запускать пользовательские действия.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `@floating-ui/react`, `react`, `classnames`.
- Локальные imports: `../../../../icons`, `../../..`, `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
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
- Storybook scenario: `../../clients/storybook/src/kit/symbols/popover/popover.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
