# AGENTS.md

## Тип документа

Interaction AGENTS.

Путь: `src/core/systems/floating/internals/floating-select`.

## Что это

`Select` — interaction-компонент в срезе `core/systems/floating`.

## Назначение

Внутренняя selection/floating система для Select и MultiSelect.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/systems/floating/internals/floating-select/index.ts`.
- Source: `src/core/systems/floating/internals/floating-select/select.tsx`.
- Source: `src/core/systems/floating/internals/floating-select/use-is-mobile-hook.ts`.
- Собственных child nodes нет.
- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Использует React context; provider/hook contract нельзя менять без оценки downstream components.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Владеет floating/open/focus lifecycle через Floating UI; проверять keyboard, blur/click outside, portal и mobile behavior.
- Reference wrapper получает keyboard focus visual через `:focus-visible`; не переносить это состояние в `SelectInput`.
- Использует browser API; SSR/test окружения требуют guard или mock.
- Поддерживает `disabled`; disabled-состояние не должно запускать пользовательские действия.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { Select } from './select.tsx';`
- `export type { TSelectContext } from './select.tsx';`
- Consumer import: прямой public import из `@sellgar/kit` не подтверждён; использовать через ближайший parent/component API.
- Exported/source names: `useSelectContext`, `Select`, `useIsMobile`, `TSelectContext`.
- Props из `IProps`: `tabIndex`, `initialOpen`, `initialSelectedIndex`, `open`, `disabled`, `selectedIndex`, `setOpen`, `onSelect`, `onFocus`, `onBlur`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { Select } from './select.tsx';`, `export type { TSelectContext } from './select.tsx';`) без оценки public API.
- Узел является scoped/internal для ближайшего родителя; не выводить его в public barrels без отдельного решения.
- Props contract: `tabIndex`, `initialOpen`, `initialSelectedIndex`, `open`, `disabled`, `selectedIndex`, `setOpen`, `onSelect`, `onFocus`, `onBlur`. Новые/изменённые props нужно отражать в story и документации.
- Static/compound members являются частью API; их имена и типы нельзя менять незаметно.
- Это internal API для `Select`, `MultiSelect` и похожих controls; нельзя выводить его в public `@sellgar/kit` без отдельного решения.
- Controlled `open`/`selectedIndex` должны оставаться синхронизированы с context и option callbacks.

## Фактическое поведение

- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Использует React context; provider/hook contract нельзя менять без оценки downstream components.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Владеет floating/open/focus lifecycle через Floating UI; проверять keyboard, blur/click outside, portal и mobile behavior.
- Reference wrapper получает keyboard focus visual через `:focus-visible`; не переносить это состояние в `SelectInput`.
- Использует browser API; SSR/test окружения требуют guard или mock.
- Поддерживает `disabled`; disabled-состояние не должно запускать пользовательские действия.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `@floating-ui/react`, `react`, `classnames`.
- Локальные imports: `../../../../../icons`, `../../../..`, `./default.module.scss`, `./use-is-mobile-hook.ts`, `../../../../components`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Любое изменение focus manager, dismiss/click behavior, portal или mobile branch влияет на все Select-family controls.
- `useIsMobile` опирается на `window.matchMedia`; тесты и SSR требуют guard/mock.
- Option indexing должен оставаться стабильным между trigger, keyboard navigation и rendered options.

## Технический долг

- Нет отдельного public story; проверять через Select и MultiSelect scenarios.
- Есть browser API dependency через `matchMedia`; нужно формализовать test/SSR contract.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario не найден автоматически; перед поведенческой правкой найти parent scenario или добавить релевантный scenario.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
