# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/action/button-link`.

## Что это

`ButtonLink` — компонент в срезе `core/components`.

## Назначение

Action primitive, который визуально ведет себя как кнопка, но семантически является ссылкой.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/action/button-link/index.ts`.
- Source: `src/core/components/action/button-link/button-link.tsx`.
- Собственных child nodes нет.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Клонирует children; нужно сохранять порядок props override, keys и поведение невалидных children.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Рендерит native `<button>`; сохранять button semantics, disabled behavior и form-related side effects.

## Public API и локальные файлы

- `export { ButtonLink } from './button-link.tsx';`
- Consumer import: `import { ButtonLink } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `ButtonLink`, `IProps`.
- Props из `IProps`: `size`, `target`, `leadIcon`, `tailIcon`, `badge`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { ButtonLink } from './button-link.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `size`, `target`, `leadIcon`, `tailIcon`, `badge`. Новые/изменённые props нужно отражать в story и документации.
- При `cloneElement` явно сохранять порядок приоритета props родителя и ребёнка.
- Native `<button>` нельзя заменять на другой element без пересмотра disabled, click и form behavior.

## Фактическое поведение

- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Клонирует children; нужно сохранять порядок props override, keys и поведение невалидных children.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Рендерит native `<button>`; сохранять button semantics, disabled behavior и form-related side effects.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `../../status/badge`, `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Primitive не должен владеть overlay, routing, global feature state или сложным interaction lifecycle.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Переданный consumer `className` может не merge-иться с внутренними CSS module classes.
- Native button не forward-ит ref; добавление ref support требует явного API-решения.

## Технический долг

- Решить contract для consumer `className`: merge, запрет или отдельный slot API.
- Решить, нужен ли `forwardRef`, и зафиксировать ref target.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/symbols/button-link/button-link.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
