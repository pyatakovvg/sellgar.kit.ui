# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/navigation/tab-menu/segmented`.

## Что это

`Segmented` — scoped subcomponent внутри `TabMenu`.

## Назначение

Рендерит `tablist` для segmented-варианта и передаёт visual variant в `TabMenu.Tab` через локальный context.

## Граница ответственности

- Отвечает за layout списка вкладок segmented-варианта.
- Не рендерит отдельную вкладку: это делает `TabMenu.Tab`.
- Не владеет active state: состояние хранит `TabMenu`.

## Как реализован

- Local entrypoint: `index.ts`.
- Source: `segmented.tsx`.
- Styles: `default.module.scss`.
- Использует общий внутренний `tab-list`.

## Public API и локальные файлы

- `export { Segmented } from './segmented.tsx';`
- Доступен как `TabMenu.Segmented`.
- Props: `size`, `shape`, `children`.

## Контракт изменения

- Не возвращать prop `type`; выбор variant должен оставаться через compound subcomponent.
- Не переносить active state в этот узел.
- Изменение имени `Segmented` ломает compound API.

## Фактическое поведение

- Создаёт `role="tablist"` через общий `TabList`.
- Передаёт `variant: 'segmented'`, `size`, `shape`.
- Растягивается по ширине родителя, чтобы вкладки могли делить доступное место.

## Зависимости

- React.
- `classnames`.
- Локальные imports: `../tab-list`, `../tab.context.ts`.

## Правила изменений

- Новые helpers держать рядом, если они нужны только segmented-варианту.
- Общую keyboard/focus логику менять в `tab-list`, а не дублировать здесь.

## Риски и точки внимания

- Изменения `flex`-модели могут сломать равномерное распределение вкладок.

## Технический долг

- Явный технический долг по текущему source на этом уровне не зафиксирован.

## Проверка

- `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`
- Storybook scenario: `../../clients/storybook/src/kit/navigation/tab-menu/tab-menu.stories.tsx`.
