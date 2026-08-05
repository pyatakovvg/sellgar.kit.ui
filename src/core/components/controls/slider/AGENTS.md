# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/slider`.

## Что это

`Slider` — компонент в срезе `core/components`.

## Назначение

Numeric/range control primitive на базе react-slider.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/slider/index.ts`.
- Source: `src/core/components/controls/slider/slider.tsx`.
- Собственных child nodes нет.
- Stateless/render-only component: явного локального state, effects, refs или browser API в основном source не обнаружено.

## Public API и локальные файлы

- `export { Slider } from './slider.tsx';`
- Consumer import: `import { Slider } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Slider`.
- Props описаны внешним типом `IProps`; перед изменением открыть файл с типом и обновить этот документ.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { Slider } from './slider.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.

## Фактическое поведение

- Stateless/render-only component: явного локального state, effects, refs или browser API в основном source не обнаружено.

## Зависимости

- Внешние runtime imports: `react`, `react-slider`.
- Локальные imports: `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Primitive не должен владеть overlay, routing, global feature state или сложным interaction lifecycle.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Переданный consumer `className` может не merge-иться с внутренними CSS module classes.

## Технический долг

- Решить contract для consumer `className`: merge, запрет или отдельный slot API.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/symbols/slider/slider.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
