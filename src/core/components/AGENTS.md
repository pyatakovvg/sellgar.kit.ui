# AGENTS.md

## AGENTS узла

Путь: `src/core/components`

## Что это

Структурный каталог `components`, который задает границу ответственности для дочерних узлов.

## Назначение

Компонентный слой core UI. Здесь живут публично воспринимаемые UI-kit компоненты, сгруппированные по пользовательскому смыслу.

## Как реализован

- Публичная точка входа каталога оформлена через локальный `index.ts`.
- Собственной реализации на этом уровне нет; узел группирует дочерние каталоги.
- Дочерние части: `action`, `content`, `controls`, `data`, `disclosure`, `feedback`, `layout`, `media`, `navigation`, `overlay`, `status`, `user`.

## Public API и локальные файлы

- `export * from './action'`
- `export * from './content'`
- `export * from './controls'`
- `export * from './data'`
- `export * from './disclosure'`
- `export * from './feedback'`
- `export * from './layout'`
- `export * from './media'`
- `export * from './navigation'`
- `export * from './overlay'`
- `export * from './status'`
- `export * from './user'`

## Зависимости

- Специальные внешние/runtime зависимости в source не обнаружены.

## Правила изменений

- Сохранять публичный import через ближайший `index.ts`; прямые обходные импорты внутрь узла не добавлять.
- Не менять имена exports, props и compound subcomponents без явного решения о breaking change.
- Внутренние styles, helpers и subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не возвращать верхнеуровневые каталоги `primitives`, `compositions` и `interactions`.

## Риски и точки внимания

- Главный риск: незаметно изменить внешний визуальный или props-контракт через основной импорт `@sellgar/kit`.

## Технический долг

- Явный технический долг по текущему source на этом уровне не зафиксирован; сохранять раздел и дополнять его при новых находках.

## Проверка

- После изменения компонента запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports или сборки запускать `yarn build` в `library/kit`.
- Если есть Storybook story для компонента, проверять соответствующий сценарий в `clients/storybook/src/kit`.
