# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/multi-select/button`.

## Что это

`MultiSelect.Button` — compound-компонент в срезе `core/components/controls`.

## Назначение

Action-trigger для `MultiSelect` с тем же options layer, select-all и floating behavior,
что у основного `MultiSelect`.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: локальный `index.ts` не найден.
- Source: `src/core/components/controls/multi-select/button/button-component.tsx`.
- Собственных child nodes нет.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- Нет явных локальных exports.
- Consumer import: прямой public import из `@sellgar/kit` не подтверждён; использовать через ближайший parent/component API.
- Exported/source names: `ButtonComponent`.
- Props описаны внешним типом `IMultiSelectButtonProps`; перед изменением открыть файл с типом и обновить этот документ.
- Локальных parts нет.

## Контракт изменения

- Узел является scoped/internal для ближайшего родителя; не выводить его в public barrels без отдельного решения.

## Фактическое поведение

- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`.
- Локальные imports: `../../../../../icons`, `../../../../systems/floating`, `../../../action/button`, `../option-list`, `../surface`, `../use-multi-select.tsx`, `../multi-select.props.tsx`.

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
- Storybook scenario: `../../clients/storybook/src/kit/symbols/button/button.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
