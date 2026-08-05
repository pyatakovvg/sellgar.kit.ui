# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/input-numeral`.

## Что это

`InputNumeral` — компонент в срезе `core/components`.

## Назначение

Number-format composition с controlled formatted value, decimal/negative rules и maxValue.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/input-numeral/index.ts`.
- Source: `src/core/components/controls/input-numeral/input-numeral.tsx`.
- Собственных child nodes нет.
- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Имеет `value` prop; проверять controlled-сценарии и синхронизацию с внутренним state.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { InputNumeral } from './input-numeral.tsx';`
- Consumer import: `import { InputNumeral } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `InputNumeralComponent`, `InputNumeral`, `IProps`.
- Props из `IProps`: `value`, `defaultValue`, `maxValue`, `allowDecimal`, `allowNegative`, `onChange`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { InputNumeral } from './input-numeral.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `value`, `defaultValue`, `maxValue`, `allowDecimal`, `allowNegative`, `onChange`. Новые/изменённые props нужно отражать в story и документации.
- Static/compound members являются частью API; их имена и типы нельзя менять незаметно.

## Фактическое поведение

- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Имеет `value` prop; проверять controlled-сценарии и синхронизацию с внутренним state.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`, `@react-input/number-format`.
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
- Storybook scenario: `../../clients/storybook/src/kit/symbols/input-numeral/input-numeral.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
