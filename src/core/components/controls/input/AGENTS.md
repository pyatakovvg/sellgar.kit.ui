# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/input`.

## Что это

`Input` — компонент в срезе `core/components`.

## Назначение

Базовый text control primitive с icons, badge, focus wrapper и optional action button.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `button`.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/input/index.ts`.
- Source: `src/core/components/controls/input/input.tsx`.
- Child node: `src/core/components/controls/input/button`.
- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Клонирует children; нужно сохранять порядок props override, keys и поведение невалидных children.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Рендерит native `<input>`; сохранять value/onChange contract и accessibility attributes.

## Public API и локальные файлы

- `export { Input } from './input.tsx';`
- `export type { IProps as IInputProps } from './input.tsx';`
- Consumer import: `import { Input } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Input`, `IProps`.
- Props из `IProps`: `ref`, `inputType`, `leadIcon`, `tailIcon`, `badge`, `size`, `target`, `button`.
- Локальные parts: `button`.

## Контракт изменения

- Не менять локальные exports (`export { Input } from './input.tsx';`, `export type { IProps as IInputProps } from './input.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `ref`, `inputType`, `leadIcon`, `tailIcon`, `badge`, `size`, `target`, `button`. Новые/изменённые props нужно отражать в story и документации.
- Static/compound members являются частью API; их имена и типы нельзя менять незаметно.
- При `cloneElement` явно сохранять порядок приоритета props родителя и ребёнка.
- Native `<input>` нельзя менять без пересмотра value/onChange/focus/accessibility contract.

## Фактическое поведение

- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Клонирует children; нужно сохранять порядок props override, keys и поведение невалидных children.
- Имеет compound/static API через `Object.assign`; static members являются частью consumer contract.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Рендерит native `<input>`; сохранять value/onChange contract и accessibility attributes.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `../../status/badge`, `./button`, `./default.module.scss`.

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
- Storybook scenario: `../../clients/storybook/src/kit/symbols/input/input.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
