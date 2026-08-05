# AGENTS.md

## Тип документа

Interaction AGENTS.

Путь: `src/core/components/controls/datepicker`.

## Что это

`Datepicker` — interaction-компонент в срезе `core/components/controls`.

## Назначение

Selection interaction, объединяющий SelectInput, Popover и Calendar для выбора даты.

`Datepicker` не является option-list select: в компоненте нет сущности `option`, поэтому API не должен содержать option-render props.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `option`, `placeholder`.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/datepicker/index.ts`.
- Source: `src/core/components/controls/datepicker/datepicker.tsx`.
- Child node: `src/core/components/controls/datepicker/option`.
- Child node: `src/core/components/controls/datepicker/placeholder`.
- Использует локальное React state для open-состояния; значение даты является controlled через `value`.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Работает с датой/временем; проверять timezone, locale и controlled value loop.
- Поддерживает `disabled`; disabled-состояние не должно запускать пользовательские действия.
- Имеет `value` prop как единственный источник выбранной даты.
- Trigger участвует в Tab order по умолчанию через `tabIndex = 0`; disabled исключает trigger из Tab order.
- Keyboard-focus определяется на `Popover.Trigger`, но визуально применяется к `SelectInput`, потому что именно `SelectInput` владеет border/background поля.
- При открытии передаёт `autoFocus` в `Calendar`, чтобы keyboard flow переходил с trigger на активную дату.
- Calendar cancel закрывает popover и не вызывает `onChange`.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { Datepicker } from './datepicker.tsx';`
- Consumer import: `import { Datepicker } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Datepicker`, `IProps`.
- Props из `IProps`: `tailIcon`, `badge`, `size`, `target`, `value`, `tabIndex`, `placeholder`, `disabled`, `isClearable`, `format`, `displayFormat`, `displayTimeZone`, `timeSelection`, `templateValue`, `onChange`, `onFocus`, `onBlur`.
- `templateValue` кастомизирует только отображение выбранного значения в trigger-е.
- `templateOption` не относится к доменной модели Datepicker, потому что options в компоненте нет.
- Локальные parts: `option`, `placeholder`.

## Контракт изменения

- Не менять локальные exports (`export { Datepicker } from './datepicker.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `tailIcon`, `badge`, `size`, `target`, `value`, `tabIndex`, `placeholder`, `disabled`, `isClearable`, `format`, `displayFormat`, `displayTimeZone`, `timeSelection`, `templateValue`, `onChange`, `onFocus`, `onBlur`. Новые/изменённые props нужно отражать в story и документации.
- Не переносить Select API механически: если новый prop требует option-list, item renderer или keyboard list navigation, сначала нужно определить календарную доменную сущность и проверить, что она реализуется внутри `Calendar`.

## Фактическое поведение

- Использует локальное React state для open-состояния; значение даты является controlled через `value`.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Работает с датой/временем; проверять timezone, locale и controlled value loop.
- Поддерживает `disabled`; disabled-состояние не должно запускать пользовательские действия.
- Имеет `value` prop как единственный источник выбранной даты.
- Trigger участвует в Tab order по умолчанию через `tabIndex = 0`; disabled исключает trigger из Tab order.
- Keyboard-focus определяется на `Popover.Trigger`, но визуально применяется к `SelectInput`, потому что именно `SelectInput` владеет border/background поля.
- При открытии передаёт `autoFocus` в `Calendar`, чтобы keyboard flow переходил с trigger на активную дату.
- Calendar cancel закрывает popover и не вызывает `onChange`.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `moment-timezone`, `react`, `moment`.
- Локальные imports: `../../../../icons`, `../calendar`, `../../floating/popover`, `../../../systems/floating/internals/select-input`, `./option`, `./placeholder`, `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Переданный consumer `className` может не merge-иться с внутренними CSS module classes.

## Технический долг

- Решить contract для consumer `className`: merge, запрет или отдельный slot API.
- Проверить hardcoded UI-тексты и i18n/API contract перед добавлением новых строк.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/core/components/controls/datepicker/datepicker.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
