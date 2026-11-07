# Table Row

- Row владеет Context конкретной строки и композицией Line/Expanded.
- Line владеет событиями строки и коллекцией Cell; Expanded измеряет только раскрытый блок.
- Высоты main/expanded, состояние раскрытия и порядок строк принадлежат runtime.
- События назначаются Line, поэтому вложенные таблицы не запускают row handlers родителей.
- Единственный click откладывается на 220 ms при наличии doubleClick; второй клик отменяет pending click. При unmount таймер очищается.
- Cell и ExpandTrigger приватны для Line. Внешний renderer получает готовый ExpandTrigger через render scope.
