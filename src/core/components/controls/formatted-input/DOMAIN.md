# Домен FormattedInput

## Назначение

`FormattedInput` — экспериментальный controlled primitive поверх собственного web editor engine.

Компонент нужен как низкоуровневая основа для будущих специализированных редакторов ввода: маски, чисел, сумм, дат, времени и посимвольного display formatting.

## Базовый контракт

- `value` на входе — raw value.
- `onChange` отдаёт raw value.
- Компонент controlled-only.
- Первый UI target — single-line, но core document model не должен запрещать будущий textarea.
- Без plugins editor работает как identity: что ввели, то отображается и выходит наружу.
- Нативный `<input>` или `<textarea>` не используется как editor surface.
- Browser runtime создаёт собственный focusable surface и DOM view parts.
- Caret/selection state живёт в domain/browser editor, а видимое выделение синхронизируется в native DOM Selection.
- Визуальную модель значения строит web projection, DOM создаёт browser renderer.
- `focus`, `blur`, `selection`, `copy`, `cut`, `paste`, `disabled`, `readOnly`, `ref`, `aria-*`, `data-*` и input props должны сохранять native-like contract.
- Mobile input hints (`inputMode`, `enterKeyHint`, `autoCapitalize`, `autoCorrect`, `spellCheck`) являются browser/adapter contract, а не plugin contract.
- React `ref` отдаёт public `FormattedInput` instance, а не DOM node.
- DOM surface доступен через `instance.getElement()`.

## Слои

```text
domain
  -> editor command/transaction
  -> web projection
  -> browser runtime/render
  -> framework adapter
```

`domain` хранит document model: symbols, groups, lines, document, position, caret, selection, editor state.

`editor` применяет commands к state и возвращает transaction result.

`projection` строит web render model без React и DOM runtime.

`browser runtime` переводит DOM events в commands, рендерит projection в DOM и синхронизирует native DOM Selection.

`framework adapter` только монтирует browser runtime, синхронизирует props и отдаёт ref.

## Domain Model

### SymbolConfig

Символ — конфигурация отображаемого/редактируемого знака.

Отвечает за:

- `char`;
- роль `editable | literal | separator | placeholder`;
- edit flags: `editable`, `removable`, `raw`;
- CSS-compatible style config;
- raw/display text serialization.

Не отвечает за:

- позицию в документе;
- parent line/group;
- React/DOM render;
- keyboard/mouse behavior.

### SymbolNode

`SymbolNode` связывает symbol config с местом в документе.

Отвечает за:

- parent ids: line/group;
- ordinal;
- `rawOffset`;
- `visualOffset`.

### Group

Группа — композиция symbol nodes.

На текущем этапе identity editor использует одну editable group. Будущие mask/date/money plugins смогут создавать semantic groups.

### Line

Line — композиция groups.

Даже при single-line UI core использует line model, чтобы не переписывать document model при переходе к textarea.

### Document

Document — композиция lines.

Отвечает за:

- доступ к symbols;
- raw serialization;
- display serialization.

### Position, Caret, Selection

Caret — доменная позиция между символами, не DOM `selectionStart`.

На текущем этапе raw/visual offsets совпадают. При formatted display будет добавлен mapping layer.

Selection содержит anchor/focus caret и direction.

## Commands

Текущие editor commands:

- `insertText`;
- `replaceSelection`;
- `deleteBackward`;
- `deleteForward`;
- `pasteText`;
- `copySelection`;
- `cutSelection`;
- `moveCaret`;
- `setSelection`.

DOM event не меняет raw value напрямую:

```text
DOM event -> browser controller -> command -> transaction -> next state -> projection -> render
```

## Transactions

Transaction result содержит:

- `before`;
- `command`;
- `operations`;
- `after`;
- `clipboardText`.

Любая команда должна возвращать transaction result, даже если она noop.

## Clipboard

Command/instance clipboard contract raw-only:

- copy отдаёт raw selection;
- cut отдаёт raw selection и меняет state;
- paste принимает raw text и проходит через editor command.

Browser clipboard events используют native DOM Selection для native context menu:

- copy/cut кладут в системный clipboard display selection;
- paste читает plain text и пропускает его через editor command/plugin flow.

## Web Projection

Projection строит web-oriented render model:

- lines;
- symbol boxes;
- caret box;
- selection box.

Caret/selection boxes описывают позицию state и используются browser runtime для синхронизации native DOM Selection, а не для отдельного custom overlay.

Projection может описывать:

- className;
- data attrs;
- CSS variables;
- inline style config.

Projection не создаёт DOM и не импортирует React.

## Mask Plugin

Маска — editor plugin, который владеет raw/display mapping и command semantics.

Инварианты:

- raw literals входят в raw;
- raw literals стоят на фиксированных позициях;
- raw literals всегда отображаются;
- raw literals не удаляются пользователем;
- slots редактируемые;
- mask задаётся явным массивом `literal | separator | slot` tokens;
- token может задавать `className`, а slot дополнительно может задавать
  `placeholderClassName` и `valueClassName`;
- если классы не заданы, символ наследует CSS от контейнера;
- insert и paste сдвигают editable values вправо;
- значения, вышедшие за capacity маски после сдвига вправо, обрезаются;
- cut, delete, backspace и delete forward сдвигают editable values влево;
- paste вставляет только допустимую последовательность;
- если paste содержит ожидаемый literal в нужной позиции, literal consume-ится и не дублируется;
- display separators не входят в raw.

Примеры:

```text
mask: 7 __ __
paste: 1234
display: 7 12 34
raw: 71234
```

```text
mask: 7 __ __
paste: 7234
display: 7 23 4_
raw: 7234
```

```text
mask: 7 __ 8 __
paste: 1234
display: 7 12 8 34
raw: 712834
```

```text
mask: 7 __ 8 __
paste: 712845
display: 7 12 8 45
raw: 712845
```

## Number, Money, Date, Time

Числа, суммы, даты и время должны быть отдельными editor plugins.

Перед реализацией каждого plugin нужно отдельно зафиксировать raw contract:

- number: строка с точкой, локализованная строка или другое представление;
- money: currency в raw или только display;
- date: ISO, digits-only, timestamp или пользовательская строка;
- time: `HH:mm`, digits-only или другой raw формат.

## Amount Plugin

Сумма — editor plugin поверх `FormattedInput`.

Editor raw contract:

- canonical draft string;
- десятичный разделитель в raw — `.`;
- display десятичный разделитель — `,`;
- display группирует целую часть по `ru-RU`: `1 234 567,89`;
- промежуточные состояния вроде `-`, `+`, `0.` живут только во внутреннем draft-слое;
- ввод `.`, `,` или numpad decimal переводит в дробную часть;
- raw с завершающим десятичным разделителем вроде `6785.` остаётся editor
  draft, но числовая проекция равна `6785`;
- ввод `-` ставит отрицательный знак независимо от позиции каретки;
- ввод `+` снимает отрицательный знак независимо от позиции каретки;
- `Delete` на ведущем `0` в дробной сумме вида `0.56` схлопывает значение до
  `0`;
- дробная часть ограничена `fractionDigits`, сейчас максимум 2;
- дробные нули в draft сохраняются во время редактирования: `0.05` и `1.20`
  не схлопываются через number formatting;
- leading zeros нормализуются: `01` становится `1`, но `0.` сохраняется;
- paste принимает разные display formats и нормализуется в amount raw/display;
- верхняя граница суммы всегда ограничена безопасным JS `number` внутри
  amount plugin;
- настройки `max` и `maxIntegerDigits` могут только уменьшать внутренний hard
  limit, но не отключать и не расширять его;
- ограничения `min`, `max`, `maxIntegerDigits`, `allowNegative`,
  `allowPositiveSign` задаются настройками plugin;
- `symbolClassNames` задаёт посимвольные CSS classes для `sign`,
  `negativeSign`, `positiveSign`, `integer`, `fraction`, `decimalSeparator`,
  `groupSeparator`;
- amount plugin не создаёт групповые DOM wrappers для целой или дробной части:
  range-level decorations должны проектироваться отдельным decorator layer.

`Intl.NumberFormat` можно использовать для display formatting, но он не парсит
пользовательский ввод. Поэтому parsing/normalization остаются ответственностью
amount plugin.

Готовый React component contract вида `value?: number` и
`onChange(value: number | undefined)` не является частью базового
`formatted-input` primitive. Такой wrapper должен жить рядом с компонентом,
который переиспользует `FormattedInput` с `FormattedInputAmountPlugin`.

## Date Plugin

Дата — editor plugin поверх `FormattedInput`.

External raw contract:

- наружу уходит только ISO-like string по `outputFormat`;
- для первого сценария output по умолчанию:
  `YYYY-MM-DD'T'HH:mm:ssXXX`;
- если display содержит только дату, время подставляется из defaults:
  `00:00:00`;
- offset по умолчанию `+00:00`, но настраивается через plugin config;
- неполный ввод живёт как внутренний editor draft и не вызывает `onChange`;
- неполный или семантически невалидный draft не перетирает внешний raw:
  действует политика `preserveLastValid`;
- полный валидный ввод `04.06.2026` отдаёт
  `2026-06-04T00:00:00+00:00`;
- полная очистка отдаёт пустую строку;
- удаление сегмента очищает display slots этого сегмента, например
  `04.06.2026` -> `04.__.2026`, но не эмитит `_` наружу;
- если редактируемый сегмент становится невалидным, date plugin очищает этот
  сегмент в display draft и сохраняет внешний raw в последнем валидном
  состоянии;
- display/input format компилируется из шаблона, первый сценарий:
  `DD.MM.YYYY`;
- шаблон компилируется в positional slots/separators автоматически, без ручной
  настройки `MaskPlugin`;
- positional syntax остаётся масочной механикой, но semantic validation живёт в
  date plugin;
- месяц `00` и `13` не допускаются;
- день `00` и значения больше `31` не допускаются;
- полная календарная дата проверяется после заполнения всех date slots:
  `31.02.2026` не коммитится в external raw;
- paste принимает ISO-like date/time string и display digits/separators,
  затем нормализует в date draft и ISO output.

`Date`/`Intl.DateTimeFormat` можно использовать для display/output helpers, но
domain model должен сохранять строковые parts, потому ISO-like values могут
содержать precision/offset, которые нельзя без потерь сводить к JS `Date`.

## Текущий технический этап

Реализованы базовые шаги editor flow:

- domain skeleton;
- identity document builder;
- caret/selection engine;
- identity edit transactions;
- clipboard transactions.

Текущий этап:

- plugin flow;
- first mask token/rule model;
- first mask transaction strategy.

Не входит в текущий этап:

- date/money/number transaction strategy;
- visual/raw mapping для formatted display;
- IME/composition model;
- полноценный textarea UI.

## Plugin Contract

Первый plugin contract живёт в `plugins`.

Текущий уровень:

- `IFormattedInputPlugin`;
- `FormattedInputPluginContext`;
- `FormattedInputPluginPipeline`;
- phase-based execution;
- mask token/rule config;
- mask plugin transaction strategy.

Контракт подключён к `FormattedInputBrowserEditor` как internal runtime flow.

Текущие фазы:

- `createState`;
- `dispatchCommand`;
- `afterTransaction`;
- `buildProjection`;
- `afterProjection`.

Планируемая runtime-точка подключения:

```text
new FormattedInputBrowserEditor({
  root,
  value,
  ...
  plugins,
})
```

React adapter не должен знать про mask/date/money semantics. Он может только
создать browser editor и передать runtime configuration, если отдельный API будет
согласован.

## Public Instance

`FormattedInput` отдаёт наружу стабильный instance facade.

Instance нужен для программного управления редактором:

- `focus`;
- `blur`;
- `getElement`;
- `getRawValue`;
- `getSelection`;
- `dispatch`;
- `setCaret`;
- `setSelection`;
- `insertText`;
- `pasteText`;
- `copySelection`;
- `cutSelection`;
- `deleteBackward`;
- `deleteForward`.

Все методы, которые создают editor command, должны проходить через тот же
plugin pipeline, что и keyboard, pointer и clipboard события browser runtime.
Запрещено добавлять второй путь изменения raw value в обход transaction flow.
