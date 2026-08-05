# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/navigation/nav-bar`.

## Что это

`NavBar` — компонент в срезе `core/components/navigation`.

## Назначение

Navigation interaction для верхней панели приложения.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/navigation/nav-bar/index.ts`.
- Source: `src/core/components/navigation/nav-bar/nav-bar.tsx`.
- Собственных child nodes нет.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.

## Public API и локальные файлы

- `export { NavBar } from './nav-bar.tsx';`
- Consumer import: `import { NavBar } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `NavBar`.
- Props описаны внешним типом `TItem`; перед изменением открыть файл с типом и обновить этот документ.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { NavBar } from './nav-bar.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Static/compound members являются частью API; их имена и типы нельзя менять незаметно.

## Фактическое поведение

- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `../../../components`, `./nav-bar.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Главный риск — незаметно изменить props, DOM structure или визуальный contract через основной import `@sellgar/kit`.

## Технический долг

- Явный технический долг по текущему source на этом уровне не зафиксирован; при новых находках дополнять этот раздел конкретными фактами.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/subcomponents/nav-bar/nav-bar.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
