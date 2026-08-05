# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/multi-select`.

## Что это

`MultiSelect` — компонент в срезе `core/components/controls`.

## Назначение

Selection interaction для множественного выбора с badges, select-all и floating options layer.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `button`, `empty`, `option`, `option-list`, `placeholder`, `surface`.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/multi-select/index.ts`.
- Source: `src/core/components/controls/multi-select/multi-select.tsx`.
- Child node: `src/core/components/controls/multi-select/button`.
- Child node: `src/core/components/controls/multi-select/empty`.
- Child node: `src/core/components/controls/multi-select/option`.
- Child node: `src/core/components/controls/multi-select/option-list`.
- Child node: `src/core/components/controls/multi-select/placeholder`.
- Child node: `src/core/components/controls/multi-select/surface`.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Основной selection state вынесен в локальный hook `useMultiSelect`; изменения root component нужно проверять вместе с этим hook.

## Public API и локальные файлы

- `export { MultiSelect } from './multi-select.tsx';`
- Consumer import: `import { MultiSelect } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `MultiSelect`.
- Props описаны внешним типом `IMultiSelectInputProps`; перед изменением открыть файл с типом и обновить этот документ.
- Локальные parts: `button`, `empty`, `option`, `option-list`, `placeholder`, `surface`.

## Контракт изменения

- Не менять локальные exports (`export { MultiSelect } from './multi-select.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Static/compound members являются частью API; их имена и типы нельзя менять незаметно.
- `MultiSelect.Button` является public compound member и не должен исчезать или менять назначение без breaking-change решения.
- `value`, `options`, `optionKey`, `optionValue`, `onChange`, `selectAllEnabled`, `maxDisplayBadges` описаны в `IMultiSelectInputProps` и являются частью consumer contract.

## Фактическое поведение

- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Focus/blur callbacks синхронизированы с controlled open state без таймеров.
- Options layer построен на `core/systems/floating` и локальном `option-list`.

## Зависимости

- Внешние runtime imports: `react`.
- Локальные imports: `../../../../icons`, `../../../systems/floating`, `../../../systems/floating/internals/select-input`, `./option-list`, `./placeholder`, `./surface`, `./multi-select.props.tsx`, `./use-multi-select.tsx`, `./button/button-component.tsx`, `./default.module.scss`, `../../status/badge`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- В source есть `any`/широкие object shapes; типовой контракт допускает некорректные значения.
- Selection state хранится отдельно от options; пересоздание options/value требует проверки синхронизации.
- Badge rendering зависит от `optionKey` uniqueness и `maxDisplayBadges`.

## Технический долг

- Уточнить типовой контракт вместо `any`/широких object shapes.
- Проверить hardcoded UI-тексты и i18n/API contract перед добавлением новых строк.
- Проверить controlled open/focus callbacks на быстрых open/close сценариях.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/symbols/multi-select/multi-select.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
