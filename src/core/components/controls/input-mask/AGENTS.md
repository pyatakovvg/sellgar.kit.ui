# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/input-mask`.

## Что это

`InputMask` — компонент в срезе `core/components`.

## Назначение

Mask composition на базе Input и @react-input/mask, отдающий formatted и unformatted значения.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/input-mask/index.ts`.
- Source: `src/core/components/controls/input-mask/input-mask.tsx`.
- Собственных child nodes нет.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { InputMask } from './input-mask.tsx';`
- `export type { IProps as IInputMaskProps } from './input-mask.tsx';`
- Consumer import: `import { InputMask } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `InputMask`, `IProps`.
- Props из `IProps`: `mask`, `replacement`, `showMask`, `onChange`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { InputMask } from './input-mask.tsx';`, `export type { IProps as IInputMaskProps } from './input-mask.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `mask`, `replacement`, `showMask`, `onChange`. Новые/изменённые props нужно отражать в story и документации.
- Static/compound members являются частью API; их имена и типы нельзя менять незаметно.

## Фактическое поведение

- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`, `@react-input/mask`.
- Локальные imports: `../../../primitives/controls/input`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Composition может собирать primitives/subcomponents, но не должна становиться владельцем focus/open/selection lifecycle без переноса в `interactions`.
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
- Storybook scenario: `../../clients/storybook/src/kit/symbols/input-mask/input-mask.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
