# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/textarea`.

## Что это

`Textarea` — компонент в срезе `core/components`.

## Назначение

Multiline text control primitive.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/textarea/index.ts`.
- Source: `src/core/components/controls/textarea/textarea.tsx`.
- Собственных child nodes нет.
- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { Textarea } from './textarea.tsx';`
- Consumer import: `import { Textarea } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Textarea`, `IProps`.
- Props из `IProps`: `ref`, `size`, `target`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { Textarea } from './textarea.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `ref`, `size`, `target`. Новые/изменённые props нужно отражать в story и документации.

## Фактическое поведение

- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Primitive не должен владеть overlay, routing, global feature state или сложным interaction lifecycle.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- В source есть `any`/широкие object shapes; типовой контракт допускает некорректные значения.
- Переданный consumer `className` может не merge-иться с внутренними CSS module classes.

## Технический долг

- Уточнить типовой контракт вместо `any`/широких object shapes.
- Решить contract для consumer `className`: merge, запрет или отдельный slot API.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario не найден автоматически; перед поведенческой правкой найти parent scenario или добавить релевантный scenario.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
