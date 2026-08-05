# AGENTS.md

## Тип документа

Interaction AGENTS.

Путь: `src/core/components/controls/calendar`.

## Что это

`Calendar` — interaction-компонент в срезе `core/components/controls`.

## Назначение

Interaction-компонент календаря с выбором даты, месяца и опционального времени.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `day`, `day-disabled`, `header`, `inputs`, `utils`, `week-day`.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/calendar/index.ts`.
- Source: `src/core/components/controls/calendar/calendar.tsx`.
- Child node: `src/core/components/controls/calendar/day`.
- Child node: `src/core/components/controls/calendar/day-disabled`.
- Child node: `src/core/components/controls/calendar/header`.
- Child node: `src/core/components/controls/calendar/inputs`.
- Child node: `src/core/components/controls/calendar/utils`.
- Child node: `src/core/components/controls/calendar/week-day`.
- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Работает с датой/временем; проверять timezone, locale и controlled value loop.
- Имеет `value` prop; проверять controlled-сценарии и синхронизацию с внутренним state.
- Поддерживает keyboard navigation по датам: стрелки двигают активную дату, `PageUp`/`PageDown` переключают месяц, `Shift+PageUp`/`Shift+PageDown` переключают год.
- Использует roving focus в сетке дат: в Tab order находится только активная дата.
- `autoFocus` фокусирует активную дату при mount, чтобы parent interactions вроде `Datepicker` могли открыть календарь сразу в keyboard flow.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { Calendar } from './calendar.tsx';`
- Consumer import: `import { Calendar } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Calendar`.
- Props из `IProps`: `autoFocus`, `defaultValue`, `value`, `format`, `timeSelection`, `onChange`, `onCancel`, `displayTimeZone`.
- Локальные parts: `day`, `day-disabled`, `header`, `inputs`, `utils`, `week-day`.

## Контракт изменения

- Не менять локальные exports (`export { Calendar } from './calendar.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `autoFocus`, `defaultValue`, `value`, `format`, `timeSelection`, `onChange`, `onCancel`, `displayTimeZone`. Новые/изменённые props нужно отражать в story и документации.

## Фактическое поведение

- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Работает с датой/временем; проверять timezone, locale и controlled value loop.
- Имеет `value` prop; проверять controlled-сценарии и синхронизацию с внутренним state.
- Поддерживает keyboard navigation по датам: стрелки двигают активную дату, `PageUp`/`PageDown` переключают месяц, `Shift+PageUp`/`Shift+PageDown` переключают год.
- Использует roving focus в сетке дат: в Tab order находится только активная дата.
- `autoFocus` фокусирует активную дату при mount, чтобы parent interactions вроде `Datepicker` могли открыть календарь сразу в keyboard flow.
- `onCancel` прокидывается в inputs-блок и используется parent-компонентами для cancel lifecycle, например закрытия popover в `Datepicker`.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `moment-timezone`, `react`, `moment`.
- Локальные imports: `./day`, `./day-disabled`, `./week-day`, `./header`, `./inputs`, `./utils/get-days.utils.ts`, `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Есть key по index; при reorder/insert/remove возможны проблемы reconciliation.

## Технический долг

- Заменить index keys на стабильные ids там, где возможен reorder списка.
- Проверить hardcoded UI-тексты и i18n/API contract перед добавлением новых строк.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/core/components/controls/calendar/calendar.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
