# Table Header

- Header отображает единственный rowgroup/row по геометрии runtime. headerFloating вычисляется runtime, Вертикальный CSS sticky не используется.
- Обычное положение находится в потоке surface, fixed применяется только при закреплении. Slot заменяет естественную высоту ровно на время выноса.
- React portal target создаётся один раз hook useHeaderMount. Его DOM-контейнер переносится browser-адаптером в локальный overlay host Table и обратно, без перемонтирования React-детей и без второй копии хедера.
- Контейнер остаётся внутри Table и её stacking context. В document.body хедер не переносится.
- Browser сохраняет фокус при переносе; активный resize захватывает pointer на стабильном root Table. Cleanup при unmount отменяет resize и удаляет созданный mount.
- Горизонтальное движение обычного хедера выполняет нативный scroll. В потоке pin удерживаются нативным горизонтальным sticky. В портальном
  положении только центральные ячейки получают -scroll от browser HeaderScroll; pin стоят на постоянных
  displayOffset. Общий Header получает только вертикальный translate.
  Clipping viewport применяется к внешнему портальному слою.

- Surface не монтирует Header при ошибке геометрии. Возврат после ошибки создаёт
  новый mount/slot и повторяет placement. Нельзя оставлять mount
  в отсоединённом flow-slot после восстановления.
- Координаты портального слоя нормализуются измеренным fixed origin browser-адаптера,
  включая transformed ancestor; viewport coordinates напрямую в fixed layer не применять.

- Горизонтальный transform центра не задаётся React snapshot. Browser HeaderScroll
  привязывает центральные ячейки к ScrollTimeline фактического scroll owner.
  Layout effect после commit согласует состав виртуального окна и положение flow/portal.
  Scroll не пересоздаёт анимации; pin и вертикальный translate в timeline не входят.
  При отсутствии ScrollTimeline browser обновляет transform напрямую; при возврате
  в поток, смене owner или unmount анимации и прямые стили удаляются.

- Flow/portal target, slot height, fixed layer bounds и вертикальный transform
  применяет TablePresentation на runtime publish. React не задаёт эти свойства.
  При возврате mount сначала вставляется в flow-slot, затем снимается резерв
  высоты, чтобы не уменьшать native scroll extent между операциями.
