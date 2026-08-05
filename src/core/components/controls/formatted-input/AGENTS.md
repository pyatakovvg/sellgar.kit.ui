# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/controls/formatted-input`.

## Что это

`FormattedInput` — экспериментальный controlled primitive поверх собственного editor engine.

## Назначение

Компонент задаёт низкоуровневую основу для будущих input-like редакторов с масками, форматированием чисел, сумм, дат, времени и посимвольным display rendering.

## Граница ответственности

- Отвечает за controlled raw value contract.
- Отвечает за собственный editor surface, focus, keyboard/pointer/clipboard bridge, selection и ref.
- Отвечает за запуск editor command/transaction flow.
- Не реализует готовую маску, дату, сумму или number formatting в базовом editor.
- Не заменяет текущий `Input`.
- Не владеет overlay, floating, global state или feature runtime.
- Если конкретный formatter начинает владеть сложным focus/keyboard/selection lifecycle, его wrapper или готовый scenario нужно рассматривать для `core/components`, а не расширять primitive без отдельного решения.

## Как реализован

- Public/local entrypoint: `index.ts`.
- Source: `formatted-input.tsx`.
- Core editor: `core`.
- Browser editor runtime: `browser`.
- React adapter: `adapters/react`.
- Plugins: `plugins`.
- Доменная документация: `DOMAIN.md`.
- Компонент controlled-only: принимает `value` и вызывает `onChange(value, meta)`.
- Без plugins editor работает как identity editor.
- Plugins подключаются в `FormattedInputBrowserEditor` как runtime flow.
- Визуальная модель строится через web projection, а browser runtime рендерит projection в DOM.
- React adapter только монтирует browser runtime в DOM-контейнер и синхронизирует props.
- Нативный `<input>` или `<textarea>` не используется как editor surface.

## Public API и локальные файлы

- `FormattedInput`
- `IFormattedInputReactProps`
- `FormattedInputMaskPlugin`
- `FormattedInputAmountPlugin`
- Consumer import: `import { FormattedInput } from '@sellgar/kit'`.
- Internal core/editor/projection types не экспортируются через public barrel компонента.

## Контракт изменения

- Не менять controlled raw contract без отдельного решения.
- Не менять смысл `value` и `onChange`: оба работают с raw.
- Не добавлять готовый mask/date/money behavior в базовый editor без выделения в plugin.
- Не делать текущий `Input` зависимым от `FormattedInput` в рамках экспериментального этапа.
- Plugin API добавлять только через `plugins` и ближайший `index.ts`.
- Native-like props, `ref`, `disabled`, `readOnly`, `aria-*`, `data-*` и mobile input hints должны оставаться доступными.

## Фактическое поведение

- Controlled-only.
- Single-line UI на текущем этапе.
- Core model уже поддерживает document -> lines -> groups -> symbols.
- Core содержит caret/selection model, transaction engine и web projection.
- Browser runtime переводит DOM events в editor commands, рендерит projection и синхронизирует native DOM Selection.
- React adapter не рендерит символы, каретку, выделение и не владеет raw value.
- React adapter отдаёт через `ref` public instance facade, а не DOM node.
- DOM node доступен через `instance.getElement()`.
- Browser runtime управляет mobile hints на DOM surface: `inputMode`, `enterKeyHint`, `autoCapitalize`, `autoCorrect`, `spellCheck`.
- Programmatic copy/cut/paste проходят через editor commands в identity mode.
- Browser copy/cut events используют native DOM Selection для системного context menu.
- Visual/raw mapping без plugins 1:1.
- Mask plugin владеет собственным raw/display mapping на уровне command flow.
- Amount plugin владеет собственным string draft raw/display mapping.
- Готовые wrapper-компоненты для суммы, даты, денег и других доменов не
  размещаются в этом primitive: они должны жить в месте реализации компонента,
  который переиспользует `FormattedInput` с нужным plugin.

## Зависимости

- Внешние runtime imports: `react`.
- Локальные imports: `./core`, `./browser`.
- Нет зависимости от `features`, `icons`, `interactions` или `shared`.

## Правила изменений

- Сохранять editor-first архитектуру.
- Держать domain/editor/projection рядом с компонентом, пока они не используются несколькими соседними узлами.
- Держать framework adapters тонкими: mount, lifecycle, props sync, ref.
- Programmatic instance methods должны идти через command/transaction/plugin flow.
- Runtime render, keyboard, pointer и clipboard logic держать вне React adapter.
- Не добавлять `any`.
- Не добавлять ad hoc formatter в компонент вместо отдельного plugin.
- Не добавлять theme tokens или component styling без отдельного визуального решения.

## Риски и точки внимания

- Высокий риск регрессий вокруг caret, selection, copy, cut и paste.
- Display value может отличаться от raw value; для этого нужен отдельный mapping layer.
- Для mask plugin критичны insert-shift-right, delete-shift-left и capacity truncation.
- Для number/money/date/time нужно сначала фиксировать raw contract.

## Технический долг

- Нет mask parser.
- Нет React-level API для передачи plugins.
- Нет полноценного token-level render props API.
- Нет visual/raw mapping для formatted display.
- Нет IME/composition model.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/core/components/controls/formatted-input/formatted-input.stories.tsx`.
- Ручные проверки: focus, blur, selection, typing, paste, cut, copy, disabled, readOnly и controlled value update.
