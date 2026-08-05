# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/media/image`.

## Что это

`Image` — компонент в срезе `core/components`.

## Назначение

Media primitive с состояниями loading/error и встроенными Process/Exception subcomponents.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерние узлы: `exception`, `process`.

## Как реализован

- Public/local entrypoint: `src/core/components/media/image/index.ts`.
- Source: `src/core/components/media/image/image.tsx`.
- Child node: `src/core/components/media/image/exception`.
- Child node: `src/core/components/media/image/process`.
- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Работает с refs; изменение DOM target или ref type может быть breaking change.

## Public API и локальные файлы

- `export { Image } from './image.tsx';`
- Consumer import: `import { Image } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Image`.
- Props из `IProps`: `width`, `height`.
- Локальные parts: `exception`, `process`.

## Контракт изменения

- Не менять локальные exports (`export { Image } from './image.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `width`, `height`. Новые/изменённые props нужно отражать в story и документации.

## Фактическое поведение

- Использует локальное React state; при изменениях проверять синхронизацию с props и callbacks.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Работает с refs; изменение DOM target или ref type может быть breaking change.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `./process`, `./exception`, `./image.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Primitive не должен владеть overlay, routing, global feature state или сложным interaction lifecycle.
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
- Storybook scenario: `../../clients/storybook/src/kit/symbols/image/image.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
