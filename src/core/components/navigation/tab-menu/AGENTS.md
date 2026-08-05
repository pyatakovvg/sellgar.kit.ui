# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/navigation/tab-menu`.

## Что это

`TabMenu` — компонент в срезе `core/components`.

## Назначение

Navigation component с compound-вариантами `Fill`, `Line`, `Segmented`, общим `Tab` и active tab context.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `fill`, `line`, `segmented`, `tab`, `tab-list`.

## Как реализован

- Public/local entrypoint: `src/core/components/navigation/tab-menu/index.ts`.
- Source: `src/core/components/navigation/tab-menu/tab-menu.tsx`.
- Child node: `src/core/components/navigation/tab-menu/fill`.
- Child node: `src/core/components/navigation/tab-menu/line`.
- Child node: `src/core/components/navigation/tab-menu/segmented`.
- Child node: `src/core/components/navigation/tab-menu/tab`.
- Child node: `src/core/components/navigation/tab-menu/tab-list`.
- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Использует React context; provider/hook contract нельзя менять без оценки downstream components.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { TabMenu } from './tab-menu.tsx';`
- Consumer import: `import { TabMenu } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `TabMenu`.
- Compound API: `TabMenu.Fill`, `TabMenu.Line`, `TabMenu.Segmented`, `TabMenu.Tab`, `TabMenu.Content`.
- Props из `IProps`: `defaultTabName`.
- Локальные parts: `fill`, `line`, `segmented`, `tab`, `tab-list`.

## Контракт изменения

- Не менять локальные exports (`export { TabMenu } from './tab-menu.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `defaultTabName`. Новые/изменённые props нужно отражать в story и документации.
- Static/compound members `Fill`, `Line`, `Segmented`, `Tab`, `Content` являются public contract.
- Визуальный variant выбирается сабкомпонентом, а не prop `type`.
- Static/compound members являются частью API; их имена и типы нельзя менять незаметно.

## Фактическое поведение

- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Использует React context; provider/hook contract нельзя менять без оценки downstream components.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`.
- Локальные imports: `./fill`, `./line`, `./segmented`, `./tab`, `./tab.context.ts`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Composition может собирать primitives/subcomponents, но не должна становиться владельцем focus/open/selection lifecycle без переноса в `interactions`.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Главный риск — незаметно изменить props, DOM structure или compound contract через основной import `@sellgar/kit`.
- Компонент реализует tablist/tab/tabpanel semantics; keyboard и focus behavior нужно проверять вручную.

## Технический долг

- Компонент пока остаётся uncontrolled по `defaultTabName`; controlled API не спроектирован.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/navigation/tab-menu/tab-menu.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
