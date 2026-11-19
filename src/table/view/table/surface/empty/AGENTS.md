# Empty

- Приватный визуальный ребёнок Surface. Владеет root пустого состояния и его padding.
- Получает renderer из environment, передаёт измерения в browser/runtime с текущей generation.
- Surface определяет видимость по rowCount: вместо Header/Body отображает Empty, сохраняя контейнер и runtime.
- Фасад экспортирует только Empty. CSS Module принадлежит этому компоненту.
