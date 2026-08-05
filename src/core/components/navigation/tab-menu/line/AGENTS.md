# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/navigation/tab-menu/line`.

## Что это

`Line` — scoped subcomponent внутри `TabMenu`.

## Назначение

Рендерит `tablist` для line-варианта и передаёт visual variant в `TabMenu.Tab` через локальный context.

## Граница ответственности

- Отвечает за layout списка вкладок line-варианта.
- Не рендерит отдельную вкладку: это делает `TabMenu.Tab`.
- Не владеет active state: состояние хранит `TabMenu`.

## Как реализован

- Local entrypoint: `index.ts`.
- Source: `line.tsx`.
- Styles: `default.module.scss`.
- Использует общий внутренний `tab-list`.

## Public API и локальные файлы

- `export { Line } from './line.tsx';`
- Доступен как `TabMenu.Line`.
- Props: `size`, `children`.

## Контракт изменения

- Не возвращать prop `type`; выбор variant должен оставаться через compound subcomponent.
- Не переносить active state в этот узел.
- Изменение имени `Line` ломает compound API.

## Фактическое поведение

- Создаёт `role="tablist"` через общий `TabList`.
- Передаёт `variant: 'line'`, `size`.
- `shape` фиксирован как `rounded`, потому что line-вариант не использует shape в визуальном contract.

## Зависимости

- React.
- `classnames`.
- Локальные imports: `../tab-list`, `../tab.context.ts`.

## Правила изменений

- Новые helpers держать рядом, если они нужны только line-варианту.
- Общую keyboard/focus логику менять в `tab-list`, а не дублировать здесь.

## Риски и точки внимания

- У line-варианта активное состояние выражено нижней линией; изменения padding могут вызвать визуальные скачки.

## Технический долг

- Явный технический долг по текущему source на этом уровне не зафиксирован.

## Проверка

- `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`
- Storybook scenario: `../../clients/storybook/src/kit/navigation/tab-menu/tab-menu.stories.tsx`.
