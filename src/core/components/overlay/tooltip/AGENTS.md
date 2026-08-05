# AGENTS.md

## Тип документа

Interaction AGENTS.

Путь: `src/core/components/overlay/tooltip`.

## Что это

`ToolTip` — overlay-компонент в срезе `core/components/overlay`.

## Назначение

Floating interaction для подсказок с hover/focus trigger, arrow и compound content slots.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `balloon`.

## Как реализован

- Public/local entrypoint: `src/core/components/overlay/tooltip/index.ts`.
- Source: `src/core/components/overlay/tooltip/tooltip.tsx`.
- Child node: `src/core/components/overlay/tooltip/balloon`.
- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Клонирует children; нужно сохранять порядок props override, keys и поведение невалидных children.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Использует React context; provider/hook contract нельзя менять без оценки downstream components.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Владеет floating/open/focus lifecycle через Floating UI; проверять keyboard, blur/click outside, portal и mobile behavior.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { ToolTip } from './tooltip.tsx';`
- `export { useTooltip, useTooltipContext } from './tooltip.tsx';`
- Consumer import: `import { ToolTip } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `useTooltip`, `useTooltipContext`, `Content`, `ToolTip`, `IProps`.
- Props из `IProps`: `initialOpen`, `placement`, `open`, `onOpenChange`, `size`.
- Локальные parts: `balloon`.

## Контракт изменения

- Не менять локальные exports (`export { ToolTip } from './tooltip.tsx';`, `export { useTooltip, useTooltipContext } from './tooltip.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `initialOpen`, `placement`, `open`, `onOpenChange`, `size`. Новые/изменённые props нужно отражать в story и документации.
- Static/compound members являются частью API; их имена и типы нельзя менять незаметно.
- При `cloneElement` явно сохранять порядок приоритета props родителя и ребёнка.

## Фактическое поведение

- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Клонирует children; нужно сохранять порядок props override, keys и поведение невалидных children.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Использует React context; provider/hook contract нельзя менять без оценки downstream components.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Владеет floating/open/focus lifecycle через Floating UI; проверять keyboard, blur/click outside, portal и mobile behavior.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`, `@floating-ui/react`, `classnames`.
- Локальные imports: `../../../../icons`, `./balloon`, `../../../components/content/typography`, `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Переданный consumer `className` может не merge-иться с внутренними CSS module classes.

## Технический долг

- Решить contract для consumer `className`: merge, запрет или отдельный slot API.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/symbols/tooltip/tooltip.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
