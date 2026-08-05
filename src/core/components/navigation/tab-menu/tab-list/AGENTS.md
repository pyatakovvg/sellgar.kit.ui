# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/navigation/tab-menu/tab-list`.

## Что это

`TabList` — внутренний runtime helper внутри `TabMenu`.

## Назначение

Единая реализация `role="tablist"`, variant context и keyboard navigation для `TabMenu.Fill`, `TabMenu.Line`, `TabMenu.Segmented`.

## Граница ответственности

- Отвечает за keyboard navigation внутри списка вкладок.
- Не владеет visual styles конкретного варианта.
- Не рендерит отдельную вкладку.
- Не владеет active state: состояние хранит `TabMenu`.

## Как реализован

- Local entrypoint: `index.ts`.
- Source: `tab-list.tsx`.
- Использует DOM query только внутри keyboard handler.

## Public API и локальные файлы

- `export { TabList } from './tab-list.tsx';`
- Не является public API `@sellgar/kit`.
- Props: `variant`, `size`, `shape`, `className`, `children`.

## Контракт изменения

- Keyboard behavior должен пропускать disabled tabs.
- `ArrowLeft`, `ArrowRight`, `Home`, `End` должны перемещать фокус и активную вкладку.
- Не добавлять public export наружу без отдельного решения.

## Фактическое поведение

- Создаёт `role="tablist"`.
- Обрабатывает `ArrowLeft`, `ArrowRight`, `Home`, `End`.
- Выбирает доступные tabs через `button[data-tab-menu-tab="true"]:not(:disabled)`.

## Зависимости

- React.
- Локальные imports: `../tab.context.ts`.

## Правила изменений

- Не добавлять сюда visual styles конкретных вариантов.
- Не использовать глобальные selectors вне текущего tablist.

## Риски и точки внимания

- DOM query зависит от data attributes в `TabMenu.Tab`; менять их только вместе.
- Keyboard behavior проверять в Storybook вручную.

## Технический долг

- Явный технический долг по текущему source на этом уровне не зафиксирован.

## Проверка

- `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`
- Storybook scenario: `../../clients/storybook/src/kit/navigation/tab-menu/tab-menu.stories.tsx`.
