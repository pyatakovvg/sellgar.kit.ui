# Table Line

- Line владеет main grid, click/doubleClick/contextMenu и коллекцией Cell.
- Высоту и ширины получает из snapshot и RowContext; математику не дублирует.
- Pending single click отменяется doubleClick/contextMenu и при unmount.
- Последняя Line передаёт browser observer свой DOM-узел строки, без зависимости от ячеек.

- Выбор строки читается отдельной подпиской SelectionRuntime; selected меняет
  только подсветку/ARIA. Клик самой строки не становится командой выбора.
