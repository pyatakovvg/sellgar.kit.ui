# ResizeHandle

- Приватный управляющий компонент HeadCell. Владеет кнопкой захвата, двумя индикаторами, их цветами, подсказкой и pointer-down связью с browser-адаптером.
- Геометрию текущей колонки читает из HeadCellContext, команду resize получает из Context экземпляра Table. Собственного состояния геометрии нет.
- HeadCell определяет видимость и размещение ручки. ResizeHandle не скрывает себя и не решает, является ли колонка последней.
- Сохранять label, description, focus-visible, touch-action и data-атрибуты. Расчёты ширин и pointer capture остаются в runtime/browser.
- Фасад экспортирует только ResizeHandle. Новые stories и component tests в этот перенос не входят.
