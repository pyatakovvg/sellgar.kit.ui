# AGENTS.md

## AGENTS узла

Путь: `src/core/systems/floating/internals`

## Что это

Структурный каталог `internals`, который задает границу ответственности для дочерних узлов.

## Назначение

Внутренний слой floating primitives. Не является самостоятельной продуктовой поверхностью и обслуживает Select, Popover, Dropdown, Modal и Drawer.

## Как реализован

- Локальный `index.ts` отсутствует; каталог не должен использоваться как public entrypoint без отдельного решения.
- Собственной реализации на этом уровне нет; узел группирует дочерние каталоги.
- Дочерние части: `dropdown-input`, `floating-select`, `overlay-dialog`, `select-input`.

## Public API и локальные файлы

- Публичный export на этом уровне не найден; узел работает как внутренняя группа или структурный каталог.
- Дочерний узел: `src/core/systems/floating/internals/dropdown-input`
- Дочерний узел: `src/core/systems/floating/internals/floating-select`
- Дочерний узел: `src/core/systems/floating/internals/overlay-dialog`
- Дочерний узел: `src/core/systems/floating/internals/select-input`

## Зависимости

- Специальные внешние/runtime зависимости в source не обнаружены.

## Правила изменений

- Сохранять публичный import через ближайший `index.ts`; прямые обходные импорты внутрь узла не добавлять.
- Не менять имена exports, props и compound subcomponents без явного решения о breaking change.
- Внутренние styles, helpers и subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Interaction-компоненты обязаны явно сохранять контракты focus/open/selection/scroll/data-state.

## Риски и точки внимания

- Главный риск: незаметно изменить внешний визуальный или props-контракт через основной импорт `@sellgar/kit`.

## Технический долг

- Явный технический долг по текущему source на этом уровне не зафиксирован; сохранять раздел и дополнять его при новых находках.

## Проверка

- После изменения компонента запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports или сборки запускать `yarn build` в `library/kit`.
- Если есть Storybook story для компонента, проверять соответствующий сценарий в `clients/storybook/src/kit`.
