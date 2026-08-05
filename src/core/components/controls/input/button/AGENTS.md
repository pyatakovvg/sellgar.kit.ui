# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/input/button`.

## Что это

`Button` — компонент в срезе `core/components`.

## Назначение

Основной action primitive. Поддерживает размеры, стили, target states, icons, badge и процессное состояние.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `button-icon`.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/input/button/index.ts`.
- Source: `src/core/components/controls/input/button/button.tsx`.
- Child node: `src/core/components/controls/input/button/button-icon`.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Поддерживает loading/process state; проверять блокировку действий и визуальное состояние.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Рендерит native `<button>`; сохранять button semantics, disabled behavior и form-related side effects.

## Public API и локальные файлы

- `export { Button } from './button.tsx';`
- Consumer import: прямой public import из `@sellgar/kit` не подтверждён; использовать через ближайший parent/component API.
- Exported/source names: `ButtonComponent`, `Button`, `IProps`.
- Props из `IProps`: `buttonType`, `size`, `tailIcon`, `inProcess`.
- Локальные parts: `button-icon`.

## Контракт изменения

- Не менять локальные exports (`export { Button } from './button.tsx';`) без оценки public API.
- Узел является scoped/internal для ближайшего родителя; не выводить его в public barrels без отдельного решения.
- Props contract: `buttonType`, `size`, `tailIcon`, `inProcess`. Новые/изменённые props нужно отражать в story и документации.
- Static/compound members являются частью API; их имена и типы нельзя менять незаметно.
- Native `<button>` нельзя заменять на другой element без пересмотра disabled, click и form behavior.

## Фактическое поведение

- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Поддерживает loading/process state; проверять блокировку действий и визуальное состояние.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Рендерит native `<button>`; сохранять button semantics, disabled behavior и form-related side effects.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `../../../../../../icons`, `../../../feedback/animate`, `./button-icon`, `./default.module.scss`.

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
- Storybook scenario: `../../clients/storybook/src/kit/symbols/button/button.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
