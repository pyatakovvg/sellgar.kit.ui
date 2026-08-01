# AGENTS.md

## Тип документа

Компонентный AGENTS.

## Что это

`Table` — основной data-компонент внутри `src/core/components/data`,
построенный вокруг локального table runtime.

## Назначение

Компонент нужен для табличного отображения данных, где rows, columns, lines и
cells являются доменными сущностями, а React выступает только renderer adapter.

## Граница ответственности

- Отвечает за runtime-first table contract.
- Не выносит локальный runtime в `core/systems`, пока runtime обслуживает
  только `Table`.
- Не добавляет virtualization без отдельного проектного среза.

## Как реализован

- Public/local entrypoint: `index.ts`.
- React adapter: `table.tsx`.
- Стили принадлежат view-компонентам в `view/*.module.scss`; общий
  `default.module.scss` для Table не использовать.
- JSX schema parts: `configuration`.
- Platform-independent runtime: `runtime`.
- React view components: `view`.
- Browser/React behavior adapters: `adapter`.
- Доменная модель описана в `DOMAIN.md`.

## Public API и локальные файлы

- `Table` экспортируется через `index.ts`.
- Compound API MVP: `Table.Column`, `Table.Head`, `Table.Cell`, `Table.Empty`.
- `Table.ControllerProvider` создаёт controller scope для внешних controls
  таблицы.
- `useTableControllerSelection<T>()` возвращает reactive selection snapshot и
  внешние команды выбора из ближайшего `Table.ControllerProvider`.
- Основной typed API: layered render-scope.
  - root scope: `Column`, `Empty`, `Expand`;
  - column scope: `Head`, `Actions`, `Cell`;
  - cell render scope: row context и `ExpandTrigger`.
- Expansion API MVP: `Table.Expand`, `Table.ExpandTrigger`.
- `Table.Column.sort` повторяет внешний handler contract старой таблицы:
  `directionDefault`, `onToggle`, `onReset`.
- `Table.Column.pinLeft` и `Table.Column.pinRight` повторяют pinning
  contract старой таблицы.
- `Table.Column.Actions` задаёт action surface конкретной data column.
  `Actions.Action` владеет обязательным интерактивным поведением пункта меню,
  а children render отвечает только за визуальное содержимое.
- `Table.select` включает selection column и отдаёт наружу выбранные data
  objects через `onSelect(rows)`.
- Selection controller не меняет ownership выбора: state остаётся внутри
  Table, а provider/hook только прокидывают наружу текущий snapshot и команды
  `clear`, `selectAll`, `toggleAll`.
- `Table.tree` включает tree projection по accessor и service tree column.
- `Table.surface` задаёт режим размещения таблицы: самостоятельная поверхность
  `standalone` или встраиваемый вариант `embedded`.
- `Table.layout` задаёт интеграцию с окружающим layout: владелец scroll и
  sticky header offset.
- `Table.style` задаёт visual style таблицы: `primary` или `secondary`.
- `Table.size` задаёт высоту body/empty cells: `sm`, `md` или `lg`.
- Допустимый consumer import: `import { Table } from '@tiyn/kit'`.
- Public type facade экспортирует только props/config/render-scope типы, которые
  уже участвуют в consumer contract.
- `configuration` и `runtime` являются implementation details.
  Runtime classes, snapshots и внутренние `nodeId` не должны становиться public
  type API.

## Контракт изменения

- Переименование `Table`, `Column`, `Head`, `Cell`, `Empty` или props
  compound API считается изменением public API.
- `nodeId` и внутренний `columnId` должны оставаться стабильными для stateful-фич.
- Дубликаты ids должны оставаться ошибкой инварианта, а не silent fallback.
- React view renderer не должен становиться владельцем selection/tree/sort
  state.
- Browser/React adapters владеют reactive feature state, а runtime получает
  state на вход и строит snapshot.
- Root scope не должен отдавать `Head`, `Cell` или `ExpandTrigger`.
- Column scope не должен отдавать root-only parts вроде `Empty` или `Expand`.

## Фактическое поведение

- MVP строит `data`, `empty` и `expanded` lines.
- Каждая data line состоит из cells всех columns.
- Empty line создаётся runtime только при наличии `Table.Empty` в schema.
- Expanded line создаётся runtime после data line, если row раскрыта через
  `Table.ExpandTrigger` и в schema есть `Table.Expand`.
- Tree mode рекурсивно нормализует `data.nodes`, хранит `depth`,
  `parentNodeId`, `hasChildren` в runtime-ноду и строит visible-node
  projection через `TreeRuntime`.
- Sort не сортирует rows внутри `Table`: header interaction только вызывает
  внешний `onToggle`, после чего consumer передаёт новые `data.nodes`.
- Data nodes нормализуются в runtime-ноды.
- Runtime-нода имеет внутренний `nodeId` и ссылку на исходный объект данных.
- `nodeId` не извлекается из `id`, `uuid` или другого primary key данных.
- Для rows стабильность `nodeId` держится на object identity через `WeakMap`.
- Primitive rows не входят в public contract `Table`, потому что для них нельзя
  обеспечить стабильную identity без внешнего ключа.
- Line snapshot не хранит массив cells; cell descriptor создаётся лениво при
  render адаптации конкретной `node + column` пары.
- Public selection API не отдаёт наружу `nodeId`; consumer получает выбранные
  исходные data objects.
- Внешний selection controller повторяет штатное поведение Table selection и не
  принимает пользовательские `nodeId` или business ids.
- Columns компилируются из JSX children в column definitions.
- Runtime не использует React и DOM.

## Зависимости

- Runtime dependencies: отсутствуют.
- React adapter зависит от `react` и локальных modules.
- Стили используют CSS variables UI-kit.

## Правила изменений

- Новые runtime-сущности держать внутри `table/runtime`, пока они не нужны
  другим компонентам.
- Новые compound schema parts держать внутри `table/configuration`.
- Новые React render adapters держать внутри `table/view`.
- Новые browser/React behavior adapters держать внутри `table/adapter`.
- Controller provider/hooks держать в `table/adapter`, потому что это
  React-level bridge к adapter state, а не runtime-сущность.
- Новые view styles держать рядом с конкретным view-владельцем в
  `table/view/*.module.scss`, а не в общем stylesheet на уровне компонента.
- Browser-only features вроде `IntersectionObserver` держать в adapter/view
  слоях, не в runtime.
- Новые schema parts добавлять только в тот scope, где они допустимы по
  композиции.
- Schema compiler должен распознавать локальные schema parts по component
  identity, а не по строковому `displayName`.
- Не импортировать `features` из `Table`.
- Sort state хранить по `columnId`, не по visual/source index колонки.
- Selection state хранить в adapter-слое по `nodeId`, не по data object
  identity и не по primary key данных.
- Внешние controller-команды должны вызывать тот же selection pipeline, что и
  view controls, включая `select.onSelect(rows)`.
- Один `Table.ControllerProvider` поддерживает один активный `Table`.
- Expand state хранить по `nodeId`, не по data object identity и не по primary
  key данных.
- Tree expanded/collapsed state хранить по `nodeId`, но не отдавать `nodeId`
  наружу как public API.
- Tree projection должен использовать preorder-порядок `NodeRuntime` и
  однопроходный skip collapsed subtree по `depth`, без parent-chain lookup для
  каждой ноды.
- Row event payload не должен отдавать наружу runtime-ноду или `nodeId`;
  consumer получает исходный `row`, `rowIndex`, trigger и native event.
- Adapter state, который ссылается на `nodeId`, должен очищаться по текущим
  `nodeIds` runtime snapshot после rows/refetch.
- Sort state должен очищаться, если active column удалена, скрыта или перестала
  быть sortable.
- Pinning offsets должны считаться по measured column widths из adapter/view
  слоя; runtime не должен читать DOM.
- Service columns `selection` и `tree` должны оставаться pinned left.
- Surface mode должен оставаться view-level контрактом и не попадать в runtime
  snapshot.
- Layout mode должен оставаться view-level контрактом и не попадать в runtime
  snapshot.
- Table style должен оставаться view-level контрактом и не попадать в runtime
  snapshot.
- Table size должен оставаться view-level контрактом и не попадать в runtime
  snapshot.
- Table size должен менять только высоту body/empty cells, не header, expanded
  container, ширину колонок, padding или typography.
- Header hover state применять только для headers с интерактивными controls:
  sortable header или column actions.
- Last row trigger должен наблюдать последнюю `data` line через concrete DOM
  target, а не через scroll position math.
- Не добавлять theme tokens без отдельного решения.
- Не хранить reactive feature state внутри view-компонентов.

## Риски и точки внимания

- Public export `Table` расширяет `@tiyn/kit` core API.
- Public export `useTableControllerSelection` расширяет controller API таблицы.
- Row object identity нестабильна при refetch, если consumer каждый раз
  создаёт новые object instances.
- Дальнейшие feature-срезы требуют отдельных Storybook-сценариев.

## Технический долг

- Нет virtualization.
- Нет user-controlled resize column width.
- Нет command bus.
- Нет automated tests для runtime.
- Identity contract нужно стабилизировать отдельным срезом, если consumer
  должен сохранять selection/tree/expand state между refetch с новыми object
  instances.

## Проверка

- `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`
- Storybook scenario: `Kit/Data/Table`.
