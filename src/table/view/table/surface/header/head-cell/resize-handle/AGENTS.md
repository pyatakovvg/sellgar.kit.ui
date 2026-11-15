# ResizeHandle

- Приватный управляющий компонент HeadCell. Владеет кнопкой захвата, разметкой двух индикаторов, их цветовыми CSS-правилами и pointer-down связью с browser-адаптером. Актуальные data-available, aria-disabled, description/title применяет TablePresentation из live geometry и видимой правой границы, без React render на scroll.
- Геометрию текущей колонки читает из HeadCellContext, команду resize получает из Context экземпляра Table. Собственного состояния геометрии нет.
- HeadCell определяет видимость и размещение ручки. ResizeHandle не скрывает себя и не решает, является ли колонка последней.
- Сохранять label, description, focus-visible, touch-action и data-атрибуты. Расчёты ширин и pointer capture остаются в runtime/browser.
- Фасад экспортирует только ResizeHandle. Новые stories и component tests в этот перенос не входят.

- ArrowLeft/ArrowRight вызывают ту же runtime-операцию через browser.resizeByKey с шагом 1;
  Shift задаёт 10. Колонки без resizable запрещены runtime; последняя пользовательская колонка разрешена. Browser ограничивает шаг видимым правым краем.
- Двойной клик сбрасывает ширину через browser/runtime. Native dblclick делегируется
  на стабильном root Table: pointer capture может перенаправить туда click target.
  Browser распознаёт собственную ручку по data-resize-column и фактической точке,
  не обрабатывает ручки вложенной таблицы. Подсказка кнопки сообщает о сбросе.
- Недоступный индикатор использует серый token icon-base-secondary, доступный —
  зелёный icon-status-success; opacity одного акцентного цвета не заменяет этот контракт.

- Pin использует ту же кнопку и native события. Browser выбирает отдельную pin
  операцию и viewport pointer axis. Физические ArrowLeft/Right и индикаторы
  согласованы с resizeEdge; позиционирование и центрирование принадлежат HeadCell.

- Удержание клавиши — одна resize-операция; keyup завершает её, потеря фокуса отменяет.
  Не вызывать внешние callbacks на повторном keydown.
