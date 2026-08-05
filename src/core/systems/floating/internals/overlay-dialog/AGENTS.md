# AGENTS.md

## Тип документа

Interaction AGENTS.

Путь: `src/core/systems/floating/internals/overlay-dialog`.

## Что это

`OverlayDialog` — interaction-компонент в срезе `core/systems/floating`.

## Назначение

Внутренний overlay/floating dialog primitive для Modal, Drawer и похожих overlay controls.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/systems/floating/internals/overlay-dialog/index.ts`.
- Source: `src/core/systems/floating/internals/overlay-dialog/overlay-dialog.tsx`.
- Собственных child nodes нет.
- Клонирует children; нужно сохранять порядок props override, keys и поведение невалидных children.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Использует React context; provider/hook contract нельзя менять без оценки downstream components.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Владеет floating/open/focus lifecycle через Floating UI; проверять keyboard, blur/click outside, portal и mobile behavior.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Рендерит native `<button>`; сохранять button semantics, disabled behavior и form-related side effects.

## Public API и локальные файлы

- `export { OverlayDialog, useOverlayDialogContext } from './overlay-dialog.tsx';`
- `export { useOverlayDialog } from './use-overlay-dialog.ts';`
- `export type { TOverlayCloseReason, TOverlayDialogOptions } from './use-overlay-dialog.ts';`
- Consumer import: прямой public import из `@sellgar/kit` не подтверждён; использовать через ближайший parent/component API.
- Exported/source names: `useOverlayDialogContext`, `OverlayDialog`.
- Props описаны внешним типом `IOverlayDialogContentProps`; перед изменением открыть файл с типом и обновить этот документ.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { OverlayDialog, useOverlayDialogContext } from './overlay-dialog.tsx';`, `export { useOverlayDialog } from './use-overlay-dialog.ts';`, `export type { TOverlayCloseReason, TOverlayDialogOptions } from './use-overlay-dialog.ts';`) без оценки public API.
- Узел является scoped/internal для ближайшего родителя; не выводить его в public barrels без отдельного решения.
- Static/compound members являются частью API; их имена и типы нельзя менять незаметно.
- При `cloneElement` явно сохранять порядок приоритета props родителя и ребёнка.
- Native `<button>` нельзя заменять на другой element без пересмотра disabled, click и form behavior.

## Фактическое поведение

- Клонирует children; нужно сохранять порядок props override, keys и поведение невалидных children.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Использует React context; provider/hook contract нельзя менять без оценки downstream components.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Владеет floating/open/focus lifecycle через Floating UI; проверять keyboard, blur/click outside, portal и mobile behavior.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Рендерит native `<button>`; сохранять button semantics, disabled behavior и form-related side effects.

## Зависимости

- Внешние runtime imports: `react`, `@floating-ui/react`, `classnames`.
- Локальные imports: `../../../../../icons`, `./use-overlay-dialog.ts`, `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- В source есть `any`/широкие object shapes; типовой контракт допускает некорректные значения.

## Технический долг

- Уточнить типовой контракт вместо `any`/широких object shapes.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario не найден автоматически; перед поведенческой правкой найти parent scenario или добавить релевантный scenario.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
