# AGENTS.md

## Тип документа

Interaction AGENTS.

Путь: `src/core/components/layout/scrollbar`.

## Что это

`Scrollbar` — layout-компонент в срезе `core/components/layout`.

## Назначение

Единый div-like scroll host с собственной графикой полос прокрутки.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/layout/scrollbar/index.ts`.
- Source: `src/core/components/layout/scrollbar/scrollbar.tsx`.
- Собственных child nodes нет.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { Scrollbar } from './scrollbar.tsx';`
- Consumer import: `import { Scrollbar } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Scrollbar`.
- Props из `IProps`: `className`, `children`, `ref`, стандартные `data-*`, `aria-*` и DOM-события root host.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { Scrollbar } from './scrollbar.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `className`, `children`, `ref`, стандартные `data-*`, `aria-*` и DOM-события root host. Новые/изменённые props нужно отражать в story и документации.
- `Scrollbar` должен восприниматься потребителем как один `div`-like host: `className` применяется к root, `ref` указывает на root, а внутренние viewport/content/track/thumb являются private implementation.
- Не добавлять внешние props для настройки внутренних слоёв, track/thumb, content wrapper, options/events/defer или inline style contract без отдельного решения.

## Фактическое поведение

- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Внутренний viewport должен оставаться ближайшим scroll container для children, иначе ломаются сценарии `scrollIntoView` в select-family controls.
- Track/thumb должны оставаться sibling overlay-элементами к viewport и не участвовать в layout потребителя.

## Технический долг

- Проверить touch/drag сценарии на мобильных устройствах отдельно от desktop Storybook.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/layout/scrollbar/scrollbar.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
