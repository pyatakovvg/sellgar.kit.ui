# AGENTS.md

## Тип документа

Interaction AGENTS.

Путь: `src/core/systems/floating/dropdown`.

## Что это

`Dropdown` — interaction-компонент в срезе `core/systems/floating`.

## Назначение

Floating selection/menu interaction с options list и dropdown input reference.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `empty`, `option`.

## Как реализован

- Public/local entrypoint: `src/core/systems/floating/dropdown/index.ts`.
- Source: `src/core/systems/floating/dropdown/dropdown.tsx`.
- Child node: `src/core/systems/floating/dropdown/empty`.
- Child node: `src/core/systems/floating/dropdown/option`.
- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { Dropdown } from './dropdown.tsx';`
- Consumer import: `import { Dropdown } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Dropdown`, `IProps`.
- Props из `IProps`: `leadIcon`, `tailIcon`, `badge`, `size`, `fixHeight`, `target`, `optionKey`, `optionValue`, `options`, `value`, `tabIndex`, `placeholder`, `disabled`, `isClearable`, `onChange`, `onFocus`, `onBlur`, `templateValue`, `templateOption`.
- Локальные parts: `empty`, `option`.

## Контракт изменения

- Не менять локальные exports (`export { Dropdown } from './dropdown.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `leadIcon`, `tailIcon`, `badge`, `size`, `fixHeight`, `target`, `optionKey`, `optionValue`, `options`, `value`, `tabIndex`, `placeholder`, `disabled`, `isClearable`, `onChange`, `onFocus`, `onBlur`, `templateValue`, `templateOption`. Новые/изменённые props нужно отражать в story и документации.

## Фактическое поведение

- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`.
- Локальные imports: `./empty`, `./option`, `../../controls/select/placeholder`, `../internals/dropdown-input`, `../internals/floating-select`.

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
- Проверить hardcoded UI-тексты и i18n/API contract перед добавлением новых строк.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario не найден автоматически; перед поведенческой правкой найти parent scenario или добавить релевантный scenario.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
