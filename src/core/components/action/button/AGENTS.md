# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/action/button`.

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

- Public/local entrypoint: `src/core/components/action/button/index.ts`.
- Source: `src/core/components/action/button/button.tsx`.
- Child node: `src/core/components/action/button/button-icon`.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Клонирует children; нужно сохранять порядок props override, keys и поведение невалидных children.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Поддерживает loading/process state: `inProcess` блокирует действия и default action без применения нативного `disabled`.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Рендерит native `<button>`; сохранять button semantics, React 19 `ref` prop, disabled behavior и form-related side effects.

## Public API и локальные файлы

- `export { Button } from './button.tsx';`
- Consumer import: `import { Button } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `ButtonComponent`, `Button`, `IProps`.
- Props из `IProps`: `style`, `size`, `target`, `shape`, `leadIcon`, `tailIcon`, `badge`, `inProcess`.
- Локальные parts: `button-icon`.

## Контракт изменения

- Не менять локальные exports (`export { Button } from './button.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `style`, `size`, `target`, `shape`, `leadIcon`, `tailIcon`, `badge`, `inProcess`. Новые/изменённые props нужно отражать в story и документации.
- Static/compound members являются частью API; их имена и типы нельзя менять незаметно.
- При `cloneElement` явно сохранять порядок приоритета props родителя и ребёнка.
- Native `<button>` нельзя заменять на другой element без пересмотра disabled, click и form behavior.
- `className` запрещён в props-контракте; внешний styling через consumer className не поддерживается.
- `inProcess` не является visual disabled state: не менять его на `disabled || inProcess` без отдельного решения.

## Фактическое поведение

- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Клонирует children; нужно сохранять порядок props override, keys и поведение невалидных children.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Поддерживает loading/process state: `inProcess` блокирует действия и default action без применения нативного `disabled`.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Рендерит native `<button>`; сохранять button semantics, React 19 `ref` prop, disabled behavior и form-related side effects.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `../../../../../icons`, `../../status/badge`, `../../feedback/animate`, `./button-icon`, `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Primitive не должен владеть overlay, routing, global feature state или сложным interaction lifecycle.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Consumer `className` запрещён на уровне `IProps`; не возвращать его без отдельного решения.
- `ref` реализован как React 19 prop и указывает на native `<button>`.
- `inProcess` блокирует click/key/mouse/pointer действия без disabled-визуала.

## Технический долг

- Поддерживать visual matrix story для `style x target x disabled/inProcess`, чтобы не терять состояние кнопок при изменениях SCSS.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/symbols/button/button.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
