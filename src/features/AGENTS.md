# AGENTS.md

## Что это

Зарезервированный slice для runtime-фич библиотеки.

## Назначение

`features` предназначен для самостоятельных runtime-срезов, которые не входят в core UI и импортируются только точечно:

```ts
import { AlertProvider, useOpenAlert } from '@sellgar/kit/features/alert';
import { MessageProvider, useShowMessage } from '@sellgar/kit/features/message';
```

Общий import `@sellgar/kit/features` не вводится.

## Как реализован

- Сейчас каталог не содержит feature implementations.
- У `src/features` нет `index.ts`, потому что aggregate entrypoint запрещён.
- Каждая будущая feature должна иметь собственный каталог и собственный `index.ts`.

Ожидаемая форма feature-среза:

```text
src/features/<feature>/
  index.ts
  provider/
  hooks/
  model/
  service/
  ui/
  internals/
```

## Public API и локальные файлы

- Public API должен находиться только в `src/features/<feature>/index.ts`.
- Feature не экспортируется из `src/index.ts`.
- Feature не экспортируется через общий `src/features/index.ts`.

## Фактическое поведение

- На текущем этапе это документационная и архитектурная граница.
- Реальные runtime-фичи ещё не подключены.
- Consumer imports для feature-срезов должны появляться только после настройки package/build entrypoints.

## Зависимости

- Feature может импортировать `core` и `shared`.
- Feature может использовать `icons`, если UI фичи нуждается в иконках.
- `core`, `icons` и `shared` не должны импортировать `features`.

## Правила изменений

- Не добавлять feature-код в основной `@sellgar/kit`.
- Не создавать `@sellgar/kit/features`.
- Не смешивать runtime service/model слой с render-only core components.
- Provider, hooks, model/service и UI части держать внутри конкретной feature.

## Риски и точки внимания

- Feature-срезы легко увеличивают bundle, если случайно попадают в core entrypoint.
- Runtime-фича может иметь side effects; они должны быть локализованы в точечном feature import.
- До изменения build/package exports feature import считается целевым контрактом, а не гарантированно работающим текущим API.

## Технический долг

- `features/alert` и `features/message` пока описаны как целевая модель, но не реализованы в source и package exports.
- Нужно отдельно спроектировать build entrypoints для каждой feature.

## Проверка

- После появления feature-кода запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- После подключения feature entrypoint запускать `yarn build` в `library/kit`.
- Проверять, что feature import не добавляет runtime-код в основной `@sellgar/kit`.
