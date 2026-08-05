# AGENTS.md

## AGENTS узла

Путь: `src/core/components/controls/calendar/utils`

## Что это

Структурный каталог `utils`, который задает границу ответственности для дочерних узлов.

## Назначение

Структурный узел utils, группирующий дочерние компоненты одного уровня ответственности.

## Как реализован

- Локальный `index.ts` отсутствует; каталог не должен использоваться как public entrypoint без отдельного решения.
- Основная реализация лежит в `src/core/components/controls/calendar/utils/factory-day.utils.ts`, `src/core/components/controls/calendar/utils/get-days.utils.ts`.
- Дочерних компонентных узлов нет.

## Public API и локальные файлы

- Типы/интерфейсы в source: `IDay`.
- Source: `src/core/components/controls/calendar/utils/factory-day.utils.ts`
- Source: `src/core/components/controls/calendar/utils/get-days.utils.ts`

## Зависимости

- date/time dependencies

## Правила изменений

- Сохранять публичный import через ближайший `index.ts`; прямые обходные импорты внутрь узла не добавлять.
- Не менять имена exports, props и compound subcomponents без явного решения о breaking change.
- Внутренние styles, helpers и subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Interaction-компоненты обязаны явно сохранять контракты focus/open/selection/scroll/data-state.

## Риски и точки внимания

- Использует moment/timezone: изменения форматов, timezone и start/end of day могут быть breaking для дат.

## Технический долг

- Явный технический долг по текущему source на этом уровне не зафиксирован; сохранять раздел и дополнять его при новых находках.

## Проверка

- После изменения компонента запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports или сборки запускать `yarn build` в `library/kit`.
- Если есть Storybook story для компонента, проверять соответствующий сценарий в `clients/storybook/src/kit`.
