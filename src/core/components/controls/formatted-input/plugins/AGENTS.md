# AGENTS.md

## Тип документа

Структурный AGENTS.

Путь: `src/core/components/controls/formatted-input/plugins`.

## Что это

`plugins` — каталог formatter/editor plugins для `FormattedInput`.

## Назначение

Узел зарезервирован под `maskPlugin`, `numberPlugin`, `moneyPlugin`, `datePlugin`, `timePlugin` и дополнительные projection/style plugins.

## Граница ответственности

- Содержит базовый plugin contract.
- Содержит token model и первый runtime `maskPlugin`.
- Plugins должны расширять editor model/commands/projection, а не React adapter.
- Display/projection plugins не должны менять raw value.
- Не хранить React adapter logic в plugins.

## Как реализован

- Public/local entrypoint: `plugins/index.ts`.
- `plugin.ts` описывает единый plugin contract `execute(context): context`.
- `pipeline.ts` выполняет plugins в порядке priority.
- `mask` содержит mask token/rule config, token style config и transaction strategy.

## Public API и локальные файлы

- `plugins/index.ts` экспортирует plugin contract, pipeline, mask plugin и amount plugin.
- Plugins должны экспортироваться через ближайший `index.ts`.
- Прямые imports во внутренние файлы plugin-каталогов запрещены при наличии `index.ts`.

## Контракт изменения

- Перед добавлением каждого editor plugin зафиксировать raw contract в `DOMAIN.md`, если plugin меняет raw semantics.
- Не добавлять совместимую композицию нескольких raw-owning plugins без отдельной модели разрешения конфликтов.
- Если plugin меняет длину value или display, он обязан вернуть корректную selection.
- Paste/cut/delete semantics должны быть описаны рядом с plugin.

## Фактическое поведение

- Plugin contract описан через mutable flow context.
- Browser runtime вызывает pipeline на фазах `createState`, `dispatchCommand`, `afterTransaction`, `buildProjection`, `afterProjection`.
- Mask token model готовит literal, separator и slot rules.
- Mask transaction strategy подключена через `dispatchCommand` phase.
- Mask token style config прокидывается в symbol projection через `className`.
- Amount plugin подключён через `createState` и `dispatchCommand`, хранит
  canonical draft string внутри editor и форматирует display в RU-like amount view.

## Зависимости

- Plugins должны зависеть от `../core`.
- React dependency допустима только для render plugins после отдельного решения; по умолчанию plugins должны оставаться без React.

## Правила изменений

- Маску, даты, суммы и числа реализовывать отдельными plugins, а не внутри React adapter.
- Держать parser/normalizer/editor plugin рядом с соответствующим plugin, пока они не нужны нескольким plugins.
- Не добавлять внешние зависимости без оценки bundle size.

## Риски и точки внимания

- `maskPlugin` должен поддержать raw literals, insert-shift-right, delete-shift-left и capacity truncation.
- Если mask token не задаёт CSS class, символ должен наследовать стили контейнера.
- `numberPlugin`, `datePlugin`, `timePlugin` требуют отдельного raw contract.
- `amountPlugin` имеет отдельный raw contract: editor plugin работает с
  canonical draft string.
- Clipboard behavior должен оставаться raw-only.

## Технический долг

- Нет React-level API для передачи plugins.
- Нет mask parser.
- Нет shared test matrix для plugins.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для каждого plugin добавлять Storybook scenario и целевые проверки edit/paste/delete/caret.
