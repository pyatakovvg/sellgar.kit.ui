# Table Subpackage

## Назначение и scope

Новая таблица разрабатывается в `src/table` с отдельным публичным entrypoint `@sellgar/kit/table`. Читать корневой `../../AGENTS.md` и локальный `README.md`.

Реализован первый геометрический срез: конфигуратор, core, runtime, браузерный адаптер и React view. Публичный `Table` подключён в модуле продуктов и на всех трёх уровнях списка склада Admin UI. Перенос остальных consumers требует отдельной задачи.

## Границы

- Публичные компоненты и типы экспортировать явно через `index.ts` по мере реализации.
- Конфигуратор разрешает width/minWidth/maxWidth вида `var(--numbers-X)` в логические числа до core; числовой API сохраняется. Неизвестные numbers tokens отклоняются.
- Конфигуратор владеет интерпретацией React-деклараций; React-типы и render callbacks не должны проникать в математическое ядро.
- Core не зависит от React, DOM, CSS и runtime.
- Runtime связывает core с измерениями и событиями среды, хранит состояние экземпляра.
- View владеет React-отображением, DOM, CSS Grid и применением токенов; геометрию получает из snapshot.
- Не создавать пустые каталоги или реализации слоёв заранее.
- Не переносить существующую таблицу из `core` и не связывать с ней новый подпакет без отдельной задачи миграции.
- Не добавлять новый entrypoint в основной `src/index.ts`.
- Визуальный контракт берётся из существующего Table: размеры sm/md/lg, фон header, типографика, padding, горизонтальные разделители, вертикальное выравнивание и hover. Экспериментальное оформление стенда не переносить.
- Конфигуратор вычисляет ID колонок по React key или пути декларации с сохранением пустых условных позиций и границ Fragment. Порядковый sourceIndex отвечает только за порядок. Перестановка динамического массива требует key. Исчезновение колонки освобождает её runtime state, возвращение использует актуальную декларацию.
- Runtime создаётся на экземпляр Table. Table назначает собственные ID и сохраняет идентичность объектов через WeakMap; ключи данных не используются. Не хранить состояние таблиц в singleton.
- Browser-адаптер владеет DOM-подписками, нормализацией координат, захватом указателя и scroll anchoring. Core/runtime model не импортируют React, DOM и CSS.
- Selection, sort и lastRowTrigger реализованы; не подключать legacy adapters. Границы текущего среза описаны в `README.md` и `docs/table-migration-contract.md`.

## Контракт и проверки

Поведение таблицы определяется [техническим заданием](../../docs/table-layout-spec.md); открытые вопросы в нём не считать принятыми решениями.

При изменении exports проверять разрешение `@sellgar/kit/table`, TypeScript и Vite build. Сборка должна выпускать отдельные JavaScript entrypoint и декларации. Generated output не редактировать вручную и не включать в исходный change scope.

- Resize включается только явным Column.resizable=true, включая последнюю колонку. Runtime добавляет постоянный внутренний компенсатор в конец центра: пользовательские auto получают ширину первыми, остаток занимает компенсатор. При ширине 0 его grid track/DOM не отображаются. Отсутствие пользовательской auto допустимо. Browser ограничивает движущуюся границу справа видимым viewport с учётом grab offset/scale, повторно проверяет итог перед pointerup и только затем вызывает onResize. Выступ ручки за Header не должен создавать scroll.

- Tree поддерживается через core preorder/visibility и runtime disclosure по rowId.
  `TreeTrigger` передаётся через Cell.render; не подключать legacy tree adapters.

- `core/pinning` — отдельная чистая математика общего бюджета обеих сторон и
  независимого resize pin. Читай его локальный AGENTS. Обычный `core/layout`
  не импортировать в этот модуль. Есть бюджет/resize готовых ширин и инициализация
  одного либо набора pin из auto.base/fixed.declaredWidth. Набор сжимает часть сверх
  min пропорционально, не меняя существующие pin. Подключён к runtime и public Table. Pin-resize UI подключён через отдельную runtime-операцию.

- `core/geometry/table-layout.ts` согласует готовые pinWidth с обычным состоянием
  всей схемы. Pin исключаются из центра; бюджет берётся из видимого viewport,
  общая поверхность вложенной таблицы передаётся отдельно. `projectColumns`
  рассчитывает позиции при scroll без повторного расчёта ширин. Это внутренний
  pure core, подключённый к runtime. View применяет готовый pinInset нативным
  горизонтальным sticky, а displayOffset — для pin портального Header.
  Читай локальный AGENTS геометрии.

- `runtime/columns/column-runtime.ts` владеет состоянием колонок, resize и nested demand.
  TableRuntime отвечает за строки/измерения и общий snapshot. Для pin заполнение
  центра обеспечивает тот же компенсатор; reserve по умолчанию — 50 логических numbers. При нехватке бюджета pin целиком приостанавливаются
  без потери сохранённых ширин и восстанавливаются при возвращении места.
  Читай локальный AGENTS runtime/columns. Public Table передаёт
  необязательный layout.pinning.reserve (включая 0); controls pin/unpin пока нет. Resize включается явно.

- Критичная DOM-геометрия имеет одного владельца: `runtime/browser/table-presentation.ts`.
  Он применяет snapshot синхронно при publish, до native scroll correction. View
  не дублирует width/height/top/grid/pin/portal coordinates через React styles.
  После React commit browser согласует только вновь смонтированный состав.
  Токены сериализует `runtime/browser/numbers.ts`; DOM adapter не импортирует View.
- Измерительные observers регистрируются по DOM identity; смена геометрического
  epoch инициирует повторное измерение в browser flush без React re-registration.
  Проверку версии входящих измерений в runtime сохранять.

## Сортировка, догрузка и контекст ячейки

- ColumnSort в runtime/columns хранит активный запрос сортировки по columnId.
  Callbacks onToggle/onReset остаются внешним контрактом; Table не сортирует data.nodes.
  Скрытие/удаление/отключение sort освобождает активную колонку; default не вызывает onToggle.
- LastRowObserver наблюдает последнюю отображаемую data line полного списка nodes
  с учётом раскрытия дерева, а не последнюю строку render window. Строка наблюдается
  целиком через IntersectionObserver с фактическим scroll owner. Threshold учитывает высоту,
  а не площадь; горизонтальное обрезание строки не блокирует догрузку.
  Native browser refresh запрашивает актуальное пересечение. Уведомление соответствует
  входу в область наблюдения; повторные записи IO при неизменной видимости и виртуальный
  remount видимой строки его не повторяют. Выход, включая удаление из render window,
  разрешает новое событие при возвращении. Отключение lastRowTrigger очищает наблюдение.
  Результат запроса, hasMore, pending и retry принадлежат внешнему коду.
- useCellData/useRowExpanded экспортируются из @sellgar/kit/table и читают контекст
  нового экземпляра. Не использовать legacy hooks из основного @sellgar/kit с новой Table.
- Compound Table.Column/Head/Cell/Empty/Expand/ExpandTrigger совместимы с render scopes.
  Selection и внешний controller описаны ниже.

## Выбор строк

- `select={{ isUse: true, onSelect }}` добавляет служебную колонку слева. Её ID
  задаёт core/column, размер var(--numbers-40) разрешается конфигуратором; resize
  отключён. Геометрия и pin budget общие с остальными колонками.
- core/selection содержит чистые операции include/exclude и каскадного выбора.
  runtime/selection владеет состоянием экземпляра, отдельными подписками и snapshot;
  scroll/resize/measurements не пересчитывают выбор, выбор не публикует геометрию.
- Идентичность берётся из существующего RowIdentities, обязательных новых ключей нет.
  Retain использует все записи, а не виртуальное окно или раскрытую часть дерева.
- Режим exclude выбирает и догружаемые записи, сохраняя исключения. Внешний API
  отдаёт только исходные объекты текущего data.nodes/дерева, не серверный query.
- Дерево выбирает поддерево и нормализует родителей снизу вверх без рекурсии.
  Сохранено legacy-правило: сворачивание частично выбранной ветви очищает её выбор;
  полностью выбранная ветвь сохраняется. Координатор находится в Table environment,
  геометрический TableRuntime не знает selection.
- onSelect вызывается при изменении выбранных объектов/их порядка, включая догрузку
  и удаление. При начальном пустом выборе, нейтральном рендере и scroll не вызывается.
- Table.ControllerProvider и useTableControllerSelection экспортируются из
  @sellgar/kit/table отдельно от legacy hooks. Controller только подключает один
  SelectionRuntime, не зеркалит state. Table обрывает наследование его контекста
  внутри себя: nested Table независима; собственный вложенный provider разрешён.
- Чекбоксы изолированы от row events нативным interactive guard. Состояние checked
  не используется как React key: изменение выбора не перемонтирует input.
- Проверки алгоритмов: node --test --test-isolation=none tests/table-selection.test.ts
  из library/sellgar.kit.ui на Node 24+. Сравнение с legacy и глубокое дерево входят в тесты.

- React получает стабильный render snapshot, browser — актуальный live snapshot.
  Не возвращать непрерывные scroll offsets в React-подписку. Ограниченное окно
  перезаполняется до достижения края; предыдущие окна не накапливать.
- TablePresentation кеширует только статическую DOM-геометрию по runtime revision
  и размерам viewport. Native scroll продолжает обновлять header/portal. После
  React commit browser.present() обязательно инвалидирует кеш для новых узлов.
  Нейтральный nested constraint не должен порождать новое publish.
- Виртуализацию проверять быстрым нативным wheel по двум осям и со сменой направления.
  Счётчик рендеров либо screenshot после остановки не доказывают отсутствие пустот.
