# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/action/button-icon`.

## Что это

`ButtonIcon` — компонент в срезе `core/components`.

## Назначение

Icon-only action primitive для компактных кнопок инструментов и действий.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/action/button-icon/index.ts`.
- Source: `src/core/components/action/button-icon/button-icon.tsx`.
- Собственных child nodes нет.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Рендерит native `<button>`; сохранять button semantics, disabled behavior и form-related side effects.

## Public API и локальные файлы

- `export { ButtonIcon } from './button-icon.tsx';`
- Consumer import: `import { ButtonIcon } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `ButtonIcon`, `IProps`.
- Props из `IProps`: `size`, `shape`, `leadIcon`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { ButtonIcon } from './button-icon.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `size`, `shape`, `leadIcon`. Новые/изменённые props нужно отражать в story и документации.
- Native `<button>` нельзя заменять на другой element без пересмотра disabled, click и form behavior.

## Фактическое поведение

- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Рендерит native `<button>`; сохранять button semantics, disabled behavior и form-related side effects.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `./button-icon.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Primitive не должен владеть overlay, routing, global feature state или сложным interaction lifecycle.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Переданный consumer `className` может не merge-иться с внутренними CSS module classes.
- Native button не forward-ит ref; добавление ref support требует явного API-решения.

## Технический долг

- Решить contract для consumer `className`: merge, запрет или отдельный slot API.
- Решить, нужен ли `forwardRef`, и зафиксировать ref target.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/symbols/button-icon/button-icon.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
