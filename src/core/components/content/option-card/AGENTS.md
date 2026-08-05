# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/content/option-card`.

## Что это

`OptionCard` — компонент в срезе `core/components`.

## Назначение

Content/action composition для выбора карточкой.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/content/option-card/index.ts`.
- Source: `src/core/components/content/option-card/option-card.tsx`.
- Собственных child nodes нет.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Использует React context; provider/hook contract нельзя менять без оценки downstream components.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { OptionCard } from './option-card.tsx';`
- Consumer import: `import { OptionCard } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `OptionCard`.
- Props описаны внешним типом `Props`; перед изменением открыть файл с типом и обновить этот документ.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { OptionCard } from './option-card.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Static/compound members являются частью API; их имена и типы нельзя менять незаметно.

## Фактическое поведение

- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Использует React context; provider/hook contract нельзя менять без оценки downstream components.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `./option-card.module.css`, `../../../primitives/content/typography`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Composition может собирать primitives/subcomponents, но не должна становиться владельцем focus/open/selection lifecycle без переноса в `interactions`.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Переданный consumer `className` может не merge-иться с внутренними CSS module classes.

## Технический долг

- Решить contract для consumer `className`: merge, запрет или отдельный slot API.
- Проверить hardcoded UI-тексты и i18n/API contract перед добавлением новых строк.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/symbols/option-card/option-card.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
