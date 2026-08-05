# AGENTS.md

## Тип документа

Interaction AGENTS.

Путь: `src/core/components/disclosure/accordion`.

## Что это

`Accordion` — interaction-компонент в срезе `core/components/disclosure`.

## Назначение

Управляемый disclosure-компонент с compound control для раскрытия и сворачивания контента.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `control`.

## Как реализован

- Public/local entrypoint: `src/core/components/disclosure/accordion/index.ts`.
- Source: `src/core/components/disclosure/accordion/accordion.tsx`.
- Child node: `src/core/components/disclosure/accordion/control`.
- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { Accordion } from './accordion.tsx';`
- Consumer import: `import { Accordion } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Accordion`.
- Props из `IProps`: `label`, `leadSlot1`, `leadSlot2`, `size`, `radius`, `description`, `tabIndex`, `defaultState`, `expanded`, `onState`.
- Локальные parts: `control`.

## Контракт изменения

- Не менять локальные exports (`export { Accordion } from './accordion.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `label`, `leadSlot1`, `leadSlot2`, `size`, `radius`, `description`, `tabIndex`, `defaultState`, `expanded`, `onState`. Новые/изменённые props нужно отражать в story и документации.

## Фактическое поведение

- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `./control`, `../../../components/content/typography`, `./default.module.scss`.

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
- Storybook scenario: `../../clients/storybook/src/kit/symbols/accordion/accordion.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
