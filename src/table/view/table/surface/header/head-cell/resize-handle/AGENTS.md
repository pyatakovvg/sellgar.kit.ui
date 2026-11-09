# ResizeHandle

- Приватный управляющий компонент HeadCell. Владеет кнопкой захвата, двумя индикаторами, их цветами, подсказкой и pointer-down связью с browser-адаптером.
- Геометрию текущей колонки читает из HeadCellContext, команду resize получает из Context экземпляра Table. Собственного состояния геометрии нет.
- HeadCell определяет видимость и размещение ручки. ResizeHandle не скрывает себя и не решает, является ли колонка последней.
- Сохранять label, description, focus-visible, touch-action и data-атрибуты. Расчёты ширин и pointer capture остаются в runtime/browser.
- Фасад экспортирует только ResizeHandle. Новые stories и component tests в этот перенос не входят.

- ArrowLeft/ArrowRight вызывают ту же runtime-операцию через browser.resizeBy с шагом 1;
  Shift задаёт 10. Последняя и запрещённые колонки по-прежнему запрещены runtime.
- Двойной клик сбрасывает ширину через browser/runtime. Native dblclick делегируется
  на стабильном root Table: pointer capture может перенаправить туда click target.
  Browser распознаёт собственную ручку по data-resize-column и фактической точке,
  не обрабатывает ручки вложенной таблицы. Подсказка кнопки сообщает о сбросе.
- Недоступный индикатор использует серый token icon-base-secondary, доступный —
  зелёный icon-status-success; opacity одного акцентного цвета не заменяет этот контракт.

- Pin использует ту же кнопку и native события. Browser выбирает отдельную pin
  операцию и viewport pointer axis. Физические ArrowLeft/Right и индикаторы
  согласованы с resizeEdge; позиционирование и центрирование принадлежат HeadCell.
