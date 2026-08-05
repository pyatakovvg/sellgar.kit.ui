# AGENTS.md

## Тип документа

Interaction AGENTS.

Путь: `src/core/components/controls/select`.

## Что это

`Select` — interaction-компонент в срезе `core/components/controls`.

## Назначение

Selection interaction для одиночного выбора из плоского списка options поверх
headless `Floating.Select`.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `empty`, `option`, `placeholder`.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/select/index.ts`.
- Source: `src/core/components/controls/select/select.tsx`.
- Child node: `src/core/components/controls/select/empty`.
- Child node: `src/core/components/controls/select/option`.
- Child node: `src/core/components/controls/select/placeholder`.
- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { Select } from './select.tsx';`
- Consumer import: `import { Select } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Select`, `IProps`.
- Props из `IProps`: `leadIcon`, `tailIcon`, `badge`, `size`, `fixHeight`, `target`, `optionKey`, `optionValue`, `options`, `value`, `tabIndex`, `placeholder`, `disabled`, `isClearable`, `onChange`, `onFocus`, `onBlur`, `templateValue`, `templateOption`.
- Локальные parts: `empty`, `option`, `placeholder`.

## Контракт изменения

- Не менять локальные exports (`export { Select } from './select.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `leadIcon`, `tailIcon`, `badge`, `size`, `fixHeight`, `target`, `optionKey`, `optionValue`, `options`, `value`, `tabIndex`, `placeholder`, `disabled`, `isClearable`, `onChange`, `onFocus`, `onBlur`, `templateValue`, `templateOption`. Новые/изменённые props нужно отражать в story и документации.
- `optionKey` должен указывать на стабильное и уникальное значение; он используется для React key и поиска selected option.
- `onFocus`/`onBlur` вызываются от open state после initialize-фазы; менять порядок вызовов нельзя без проверки форм.

## Фактическое поведение

- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`.
- Локальные imports: `./empty`, `./option`, `./placeholder`, `../../../systems/floating/internals/select-input`, `../../../systems/floating`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- В source есть `any`/широкие object shapes; типовой контракт допускает некорректные значения.
- Option keys строятся из `option[optionKey]`; неуникальные или нестабильные значения ломают selection/rendering.
- Placeholder и empty state содержат hardcoded тексты.

## Технический долг

- Уточнить типовой контракт вместо `any`/широких object shapes.
- Проверить hardcoded UI-тексты и i18n/API contract перед добавлением новых строк.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/symbols/select/select.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
