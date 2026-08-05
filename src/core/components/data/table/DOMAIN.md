# Домен Table

## Назначение

`Table` — основной data-компонент `@tiyn/kit`, построенный вокруг
runtime-модели, а не вокруг React view-композиции.

Базовая архитектура:

```text
JSX schema -> column definitions -> table runtime -> render snapshot -> React view
```

Компонент находится в `src/core/components/data/table` и экспортируется через
core entrypoint `@tiyn/kit`.

## Базовый контракт MVP

- Внешний API остаётся декларативным JSX compound API.
- JSX children описывают схему колонок через static compound API или typed
  layered render-scope.
- Schema compiler распознает schema parts по identity локальных компонентов.
  Строковый `displayName` нужен только для DevTools и не является
  schema-dispatch механизмом.
- Runtime не импортирует React и не создаёт DOM.
- React adapter только компилирует schema, синхронизирует props и рендерит
  snapshot.
- Каждая runtime-нода имеет внутренний `nodeId`.
- Runtime-нода хранит ссылку на исходный объект из `data.nodes`.
- Каждая колонка имеет внутренний `columnId`, который создаётся compiler-ом и
  не является public prop.
- Линия (`line`) — отдельная render-сущность, не равная исходной строке данных.
- Ячейка (`cell`) — пересечение линии и колонки.
- Дубликаты `nodeId` и `columnId` считаются нарушением инварианта и приводят к
  ошибке.
- `nodeId` не извлекается из `id`, `uuid` или другого primary key данных.
- Для rows стабильность `nodeId` держится на object identity через `WeakMap`.
- Primitive rows не входят в public contract `Table`, потому что без ссылочной
  или внешней identity дубликаты примитивов невозможно различить корректно.

## Слои

```text
configuration
  -> render registry
  -> runtime
  -> adapter
  -> view
  -> react adapter
  -> storybook scenario
```

`configuration` содержит scoped JSX subcomponents и adapter, который переводит
детей `Table` в column definitions и render registry.

`render registry` связывает декларативные `Table.Cell` render-функции с
runtime-нейтральными `rendererId`. Runtime не вызывает эти функции напрямую.

`runtime` содержит платформенно-независимую модель таблицы: rows, columns,
nodes, tree projection, columns, lines, cells, snapshot.

`adapter` содержит browser/React поведенческие адаптеры и reactive feature
state, которые не должны попадать в view: например row click/double
click/context menu policy, interactive target guard, selection state, sort
interaction state, expansion state и timers.

`view` содержит React-компоненты, которые читают готовый snapshot: header cells,
lines, data cells и service cells.

`react adapter` живёт в `table.tsx`: создаёт runtime input, получает snapshot,
связывает schema render registry с view и передаёт callbacks во view.

## Domain Model

### TableRuntime

Корневой orchestrator. Владеет `NodeRuntime`, `ColumnRuntime` и `LineRuntime`.
На вход получает данные и column definitions. На выход отдаёт `TableSnapshot`.

Не отвечает за React, DOM, CSS, Storybook и browser events.

### NodeRuntime

Владеет runtime-нодами и индексом `nodeId -> node`.

Отвечает за:

- нормализацию входных `data.nodes`;
- внутреннюю identity таблицы;
- связь `node.data` с исходным объектом данных;
- tree metadata (`depth`, `parentNodeId`, `hasChildren`);
- поиск node по `nodeId`;
- порядок нод.

### TreeRuntime

Владеет projection видимых нод поверх плоского node graph.

Контракт MVP:

- `Table.tree.isUse` включает service tree column;
- `Table.tree.accessor` указывает поле с дочерними data nodes;
- `Table.tree.defaultExpanded` задаёт начальное раскрытое состояние;
- expanded/collapsed state хранится в adapter-слое как toggled `Set<nodeId>`;
- runtime не отдаёт `nodeId` наружу как public tree API.

TreeRuntime не создаёт DOM и не рендерит trigger. Он только фильтрует плоский
preorder-список нод по состоянию родителей и отдаёт visible nodes в
LineRuntime. Алгоритм projection должен оставаться однопроходным: если родитель
collapsed, всё его поддерево пропускается по `depth`, без повторного подъёма по
parent chain для каждой ноды.

Tree adapter удерживает toggled state только для `nodeId`, которые есть в
текущем runtime snapshot. Если rows/refetch удаляет ноду, её tree state
удаляется из adapter state.

### ColumnRuntime

Владеет column definitions.

Отвечает за:

- стабильные внутренние `columnId`;
- порядок колонок;
- параметры layout, которые относятся к колонке;
- проверку дубликатов.

### Column Pinning

`Table.Column.pinLeft` и `Table.Column.pinRight` задают sticky-позицию
пользовательской колонки. Service columns для selection и tree считаются system
columns и pin-ятся слева автоматически.

Pin offsets считаются не из declarative `width`, а из фактической rendered
ширины колонки:

- React adapter/view измеряет header cells через `ResizeObserver`;
- adapter передаёт `columnId -> width px` в runtime input;
- `ColumnLayoutRuntime` строит pin snapshot (`side`, `offset`, `isBoundary`);
- view применяет sticky styles только из layout snapshot.

Такой контракт позволяет поддерживать `width="minmax(...)"`, `1fr`,
`max-content` и будущий resize control без возврата DOM measurements в runtime.

### Surface

`Table.surface` задаёт режим размещения таблицы:

- `standalone` — таблица сама является самостоятельной поверхностью и получает
  внешний border/radius;
- `embedded` — таблица встраивается в другой контент, например expanded line, и
  не создаёт вложенную внешнюю рамку.

Surface является view-level контрактом. Runtime snapshot, columns, lines,
selection, tree, pinning и sort не должны зависеть от режима поверхности.

### Layout Integration

`Table.layout` задаёт, как таблица встроена в окружающий layout:

- `layout.scroll: 'internal'` — таблица создаёт собственный `Scrollbar`;
- `layout.scroll: 'external'` — таблица не создаёт scroll container, а
  скроллом владеет page, drawer body, modal content или другой внешний layout;
- `layout.stickyHeader` включает, отключает или настраивает `top` offset для
  sticky header.

Layout не заменяет `surface`. `surface` отвечает за визуальную оболочку, а
`layout` отвечает за интеграцию со scroll/sticky поведением окружения.

Layout является view-level контрактом. Runtime snapshot, tree projection,
selection, expansion, sort и pinning не должны зависеть от владельца scroll.

### Visual Style

`Table.style` задаёт visual style таблицы:

- `primary` — header default использует `background-surface-neutral`;
- `secondary` — header default использует
  `background-surface-neutral-subtle`.

Hover state применяется только к header с интерактивными controls: sort или
column actions. Headers без sort и column actions не должны менять фон при
hover.

Style является view-level контрактом. Runtime snapshot, columns, lines,
selection, tree, pinning и sort state не должны зависеть от visual style.

### Size

`Table.size` задаёт высоту body cells и empty cell:

- `lg` — 64px;
- `md` — 54px;
- `sm` — 40px.

Default size — `lg`.

Size не меняет header height, expanded container, column width, padding и
typography. Это view-level контракт: runtime snapshot, columns, lines,
selection, tree, pinning и sort state не должны зависеть от size.

### LineRuntime

Строит вертикальный render-поток из строк и колонок.

Первый MVP поддерживает:

- `data`;
- `empty`;
- `expanded`.

Будущие типы линий:

- `loading`;
- `group`;
- `summary`;
- `skeleton`.

React view обязан рендерить line как отдельную сущность. Даже если CSS layout
использует `display: contents`, row-level события и визуальное состояние должны
быть привязаны к line, а не размазаны по отдельным cells.

Текущий view использует CSS grid и `display: contents` для header/data/empty/
expanded lines. Поэтому DOM box у line отсутствует, но table/row/cell semantics
задаются явно через ARIA roles. Browser features, которым нужен реальный DOM
box, например last row observer, должны цепляться к concrete cell или отдельному
marker element, а не к line wrapper.

### CellRuntime

Создаёт descriptor одной ячейки по запросу render adapter.

Ячейка знает:

- `cellId`;
- `lineId`;
- `nodeId`;
- `columnId`;
- `columnIndex`;
- render descriptor.

Ячейка не хранится в line snapshot и не создаётся заранее для всей матрицы
`rows * columns`. Это снижает количество объектов в snapshot и оставляет cell
как render-time projection пары `node + column`.

Ячейка не владеет React content и не вызывает render-функции. Она отдаёт
`rendererId` и runtime context, а React adapter использует render registry.

### SelectionRuntime

Вычисляет selection snapshot и next selection state по `nodeId`.

Reactive selection state хранится в adapter-слое, а runtime получает
`selectedNodeIds` на вход. Это сохраняет React rerender contract и не отдаёт
selection state во view.

Первый срез selection поддерживает row selection через consumer-facing callback:

- `select.isUse`;
- `select.onSelect(rows)`;
- `toggleNodeSelection`.
- service selection column с checkbox в header/body.
- `Table.ControllerProvider`;
- `useTableControllerSelection<T>()`.

Selection не хранит исходные row objects и не сравнивает строки по business
primary key. Snapshot помечает `line.selected`, содержит retained
`selectedNodeIds`, а cell render context получает `rowSelected`.

Внутренний `nodeId` не выходит наружу как public selection contract. Consumer
получает выбранные исходные data objects, как в старой `Table`.

Selection controller не является controlled selection contract. Он не владеет
state и не принимает внешний список выбранных строк. Controller только
прокидывает наружу reactive snapshot текущего выбора и команды:

- `clear`;
- `selectAll`;
- `toggleAll`.

Команды controller-а должны повторять штатное поведение selection внутри Table.
`toggleAll` эквивалентен header checkbox. `selectAll` выбирает тот же scope,
который runtime использует для текущего selection режима. `clear` очищает
текущий внутренний выбор. Все команды должны проходить через тот же adapter
pipeline и вызывать `select.onSelect(rows)` при изменении выбора.

Один `Table.ControllerProvider` поддерживает один активный `Table`. Если
внешним controls нужно управлять несколькими таблицами, каждая таблица должна
получить собственный provider scope.

Хуки controller-а вне provider считаются ошибкой композиции и должны падать с
понятной ошибкой. `Table` без provider продолжает работать в обычном локальном
режиме.

Selection не должен занимать row click. Выбор строки происходит через checkbox
в service column. Row click, double click и context menu считаются отдельной
feature для внешних реакций.

Service selection column является runtime-колонкой, а не ручной вставкой React
view. Она должна проходить через общий column layout и давать selection cells в
каждой data line.

### Row Events

Row events — browser/React adapter feature поверх runtime snapshot.

Первый срез поддерживает:

- `row.handlers.click`;
- `row.handlers.doubleClick`;
- `row.handlers.contextMenu`;
- default interactive guard.

Interactive targets (`button`, `a`, `input`, `select`, `textarea`,
`[role="button"]`, `[data-row-event-ignore]`) не должны вызывать row handlers.
Это сохраняет независимость checkbox selection и внешних row reactions.

Row events живут в adapter-слое и получают только `data` line. `empty` и
будущие service lines не должны случайно иметь доступ к `line.node`.

Public row event payload не раскрывает runtime-ноду и внутренний `nodeId`.
Consumer получает исходный `row`, `rowIndex`, trigger и native event.

Row event handlers остаются на data line wrapper. Interactive controls внутри
cells обязаны ставить `data-row-event-ignore` или нативную интерактивную роль,
чтобы не перехватываться row event adapter.

### Last Row Trigger

Last row trigger — browser/React adapter feature поверх runtime snapshot.

Контракт:

- runtime не знает про `IntersectionObserver`, DOM и scroll containers;
- view выбирает последнюю `data` line из snapshot;
- observer цепляется к concrete cell последней `data` line, потому что line
  wrapper использует `display: contents` и не имеет DOM box;
- `empty` и `expanded` lines не являются trigger target;
- `root` остаётся `null`, чтобы trigger не зависел от того, скроллится page или
  вложенный container.

### Sort

Sort — header interaction feature поверх column snapshot.

Контракт повторяет старую таблицу по смыслу:

- `directionDefault`;
- `onToggle(direction)`;
- `onReset()`.

`Table` не сортирует `rows` внутри runtime. При клике по sortable header
adapter переключает локальное направление и вызывает внешний `onToggle`.
Consumer делает внешний запрос, сортировку или refetch и передаёт новый
`data.nodes` обратно в таблицу.

Отличие от старой таблицы: active sort привязан к `columnId`, а не к
визуальному индексу header cell. Это сохраняет состояние при reorder, hidden
columns и service columns.

Sort adapter удерживает active sort только для видимой sortable column. Если
active column удалена, скрыта или перестала быть sortable, локальный sort
snapshot сбрасывается.

### Column Actions

Column actions задаются внутри column schema через `Actions`, а не через
root-level props таблицы и не через обязательные идентификаторы колонок.

`Actions` является отдельной section внутри column scope рядом с `Head` и
`Cell`. Она включает action surface для конкретной data column.

`Action` является границей одного логического действия. Он владеет обязательным
интерактивным поведением:

- click/keyboard activation;
- disabled guard;
- menu close после action;
- event isolation от table/header/row handlers;
- базовые accessibility attributes.

Children render внутри `Action` отвечает только за визуальное содержимое пункта:
текст, переводы, иконки, pending view, цвет и форму. Table не знает бизнес
state action-а и не диктует визуальный компонент пункта.

Если у data column нет `Actions` или внутри `Actions` нет `Action`, header не
показывает dots menu.

### Expansion

Expansion — nodeId-based feature, которая проверяет способность runtime строить
несколько render lines из одной data row.

Контракт MVP:

- `Table.Expand` задаёт render slot для expanded content;
- `Table.ExpandTrigger` живёт внутри data cell и toggles текущий `nodeId`;
- expanded state хранится в adapter-слое как `Set<nodeId>`;
- runtime получает `expandedNodeIds` и строит `expanded` line сразу после
  соответствующей `data` line.

Expanded content не является cell и не владеет колонками. Он занимает всю
текущую grid ширину через `columnSpan`.

Expansion adapter удерживает expanded state только для `nodeId`, которые есть в
текущем runtime snapshot. Если rows/refetch удаляет ноду, её expanded state
удаляется из adapter state.

### Layered Typed JSX

TypeScript не протаскивает generic parent JSX component из
`data={{ nodes }}` внутрь статических compound children вроде `Table.Cell`.
Поэтому основной typed API строится как layered render-scope:

```tsx
<Table data={{ nodes: rows }}>
  {({ Column, Empty, Expand }) => (
    <>
      <Column>
        {({ Head, Cell }) => (
          <>
            <Head label="Terminal" />
            <Cell render={({ row }) => row.terminal} />
          </>
        )}
      </Column>

      <Expand render={({ row }) => row.merchant} />
      <Empty>No data</Empty>
    </>
  )}
</Table>
```

Слои намеренно ограничены:

- root scope отдаёт только `Column`, `Empty`, `Expand`;
- column scope отдаёт только `Head`, `Cell`;
- cell render scope отдаёт row context и `ExpandTrigger`.

Так тип `T` выводится из `data.nodes` один раз и протекает в `Cell.render` и
`Expand.render`, но schema parts не превращаются в общий мешок доступных
компонентов.

## Команды и controller bridge

Runtime command bus не реализован. React adapter собирает единый
`TableRuntimeInput`, а runtime синхронизируется через методы:

- `sync`;
- `createSnapshot`;
- `toggleNodeSelection`;
- `toggleAllNodesSelection`;
- `snapshot`.

Controller bridge живёт в React adapter-слое и не становится частью runtime.
Он используется для внешних UI controls, которые находятся вне DOM-ветки Table,
например header, bulk actions panel или footer модуля. Для reactive snapshot
controller должен использовать subscription-модель, совместимую с
`useSyncExternalStore`.

Будущие фичи должны добавляться как команды runtime, например:

- `selection.toggle`;
- `tree.toggle`;
- `rowExpansion.toggle`;
- `column.pin`;
- `column.resize`;
- `sort.set`;
- `viewport.set`.

## Render Snapshot

Snapshot — единственный объект, который React view должен читать из runtime.

Он содержит:

- node ids текущего runtime graph для adapter state retain;
- ordered columns;
- ordered lines;
- visual index линии;
- line ids для стабильных React keys.

Cell descriptors создаются render adapter по запросу для конкретной пары
`node + column`, а не хранятся внутри line snapshot.

## Ограничения MVP

Первый срез намеренно не реализует:

- virtualization;
- user-controlled column resize;
- keyboard navigation.

Эти фичи должны добавляться как отдельные runtime-модули, а не как логика
внутри React renderer.
