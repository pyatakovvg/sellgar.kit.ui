# AGENTS.md

## AGENTS узла

Путь: `src/icons/generated`

## Что это

Generated-каталог с React-компонентами иконок для отдельного icons slice.

## Назначение

Хранит большой сгенерированный набор icon components, который экспортируется через `src/icons/index.ts` и должен потребляться через публичный импорт `@sellgar/kit/icons`.

## Как реализован

- Каждый файл `*.icon.tsx` содержит один React icon component.
- Каталог не имеет собственного `index.ts`; public surface собирается выше, в `src/icons/index.ts`.
- Файлы считаются generated output внутри source tree: ручная правка отдельной иконки допустима только как временная точечная правка с последующей регенерацией набора.

## Public API и локальные файлы

- Публичный API этого узла не находится внутри каталога `generated`.
- Public export должен проходить через `src/icons/index.ts`.
- Добавление, удаление или переименование icon component является изменением public API `@sellgar/kit/icons`.

## Фактическое поведение

- Компоненты иконок являются render-only React components.
- Каталог большой по количеству файлов и влияет на размер icons entrypoint.
- Сам каталог не должен зависеть от core components, features или theme runtime.

## Зависимости

- React runtime.
- SVG/JSX contract конкретной иконки.

## Правила изменений

- Не добавлять локальные barrels внутрь `generated` без отдельного решения по сборке icons entrypoint.
- Не импортировать generated icons напрямую из consumer-кода; использовать `@sellgar/kit/icons`.
- При регенерации проверять, что `src/icons/index.ts` синхронизирован с фактическим набором файлов.
- Не смешивать generated icons с hand-written icon helpers.

## Риски и точки внимания

- Любое изменение набора влияет на public imports consumers.
- Большой icon set может раздувать chunk, если icons entrypoint или consumer build не tree-shake-ится корректно.
- Массовая регенерация должна рассматриваться как отдельное изменение с проверкой размера сборки.

## Технический долг

- Icons entrypoint остаётся крупным; нужна отдельная проверка tree-shaking и стратегии subpath/chunking для `@sellgar/kit/icons`.
- Нет явного manifest-файла генерации, который описывает источник icon set и правила обновления.

## Проверка

- После изменения icon set запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- После изменения exports или сборки запускать `yarn build` в `library/kit`.
- Проверять, что consumer import `@sellgar/kit/icons` резолвит изменённые иконки.
