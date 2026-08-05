# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/navigation/breadcrumb/item`.

## Что это

`BreadcrumbItem` — приватный scoped subcomponent внутри `Breadcrumb`.

## Назначение

Отвечает за визуальное отображение одного элемента breadcrumb и его
разделителя.

## Граница ответственности

- Отображает один crumb: обычный item или `more`-item.
- Отображает divider только по приватному флагу родителя.
- Не вычисляет текущий item и не владеет порядком trail.
- Не является самостоятельным public component и не экспортируется из
  `@sellgar/kit`.
- Не должен брать на себя navigation lifecycle, routing, focus management или
  keyboard interaction.

## Как реализован

- Локальный entrypoint: `src/core/components/navigation/breadcrumb/item/index.ts`.
- Source: `src/core/components/navigation/breadcrumb/item/breadcrumb-item.tsx`.
- Styles: `src/core/components/navigation/breadcrumb/item/default.module.scss`.
- Собственных child nodes нет.
- Использует `Typography` для текста и icon API для arrow divider.

## Public API и локальные файлы

- `export { BreadcrumbItem } from './breadcrumb-item.tsx';`
- Export доступен только ближайшему parent-компоненту `Breadcrumb`.
- Consumer import из `@sellgar/kit` запрещён и не поддерживается.
- Props из локального `IProps`: `divider`, `hasDivider`, `href`, `isCurrent`,
  `label`, `leadIcon`, `size`, `tailIcon`, `variant`.
- Props являются внутренним контрактом между `Breadcrumb` и `BreadcrumbItem`.

## Контракт изменения

- Не добавлять export из общего public API.
- Не переносить стили item в родительский `default.module.scss`.
- Не добавлять публичные props `isActive`, `isCurrent`, `showDivider`,
  `hasDivider` в `Breadcrumb`.
- Если появляется самостоятельное поведение navigation/focus/keyboard, сначала
  пересмотреть слой и согласовать новую ответственность.

## Фактическое поведение

- `variant="default"` отображает optional lead icon, label и optional tail icon.
- `variant="more"` отображает переданный `label`.
- Если передан `href` и item не current, content рендерится как ссылка.
- Если `href` не передан или item current, content рендерится как текстовый
  узел.
- `isCurrent` меняет визуальное состояние item, но не вычисляется внутри item.
- `hasDivider` отображает arrow или slash divider после item.
- Hover применяется только к link content.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `../../../../../icons`, `../../../content/typography`,
  `./default.module.scss`.

## Правила изменений

- Сохранять `index.ts` как локальный интерфейс scoped subcomponent.
- Source и styles должны оставаться рядом в этом каталоге.
- Не импортировать стили родителя.
- Не добавлять dependency на `features`, `shared` или runtime systems без
  отдельного решения.
- Не добавлять новые theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Divider является частью visual item, но решение показывать divider принимает
  только parent `Breadcrumb`.
- Текущий item определяется позицией в `items`; не выносить это в public props.
- Item без `href` не должен получать pointer cursor.
- Current item не должен рендериться ссылкой.

## Технический долг

- Явный долг на этом уровне не зафиксирован.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Parent Storybook scenario:
  `../../clients/storybook/src/kit/navigation/breadcrumb/breadcrumb.stories.tsx`.
