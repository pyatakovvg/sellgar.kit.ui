# Sort Indicator

- Приватный визуальный ребёнок HeadCell. Фасад экспортирует только SortIndicator.
- Читает текущую колонку из HeadCellContext, направление из Table environment.
- Не хранит сортировку и не вызывает callbacks. Отражает asc/desc или доступность
  сортировки; aria-sort и keyboard/click принадлежат HeadCell.
- Использует существующие kit icons и numbers tokens, не влияет на геометрию pin.
- Обычные React component tests и stories не создаются.
