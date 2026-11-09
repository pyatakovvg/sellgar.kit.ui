# Table Cell

- Cell получает элементы коллекции row/column, отображает renderer и измеряет содержимое.
- ExpandTrigger и TreeTrigger передаются в существующий render scope; внешний владелец не импортирует приватный компонент.
- Минимальную высоту и кеш измерений контролирует runtime.
- observeCell всегда измеряет высоту; ширина контента регистрируется только при
  column.measureContent=true. Явный minWidth (включая 0) отключает эту часть.

- Горизонтальные pin удерживаются нативным sticky по готовому pinInset; не
  компенсировать scroll через React transform. Непрозрачный фон и локальный z-index
  закрывают центр. В портальном Header pin получают постоянные displayOffset;
  scroll-transform применяется только к центральным ячейкам. Все размеры — numbers.

- Разделитель pin повторяет legacy Table: --numbers-3 только справа у последнего
  левого pin и слева у первого правого pin. Между pin одной группы полос нет.
  Разделитель numbers3 центрируется на геометрической границе через ::after;
  контент обрезается отдельно, ширина колонки не меняется.

- Grid placement и pin coordinates применяет browser TablePresentation; React inline geometry здесь не задавать.
