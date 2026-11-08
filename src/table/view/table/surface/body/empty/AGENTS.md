# Empty

- Приватный визуальный ребёнок Body. Владеет root пустого состояния и его padding.
- Получает renderer из environment, передаёт измерения в browser/runtime с текущей generation.
- Body определяет видимость по rowCount; Empty не скрывает себя и не вычисляет геометрию.
- Фасад экспортирует только Empty. CSS Module принадлежит этому компоненту.
