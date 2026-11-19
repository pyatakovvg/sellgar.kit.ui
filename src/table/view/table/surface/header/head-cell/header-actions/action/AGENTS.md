# Action

- Приватная кнопка одного действия HeaderActions. Получает renderer и callback закрытия от владельца коллекции.
- Сохраняет native disabled/keyboard contract. При выполнении вызывает onAction и закрывает Popover.
- Фасад экспортирует только Action; visual reset принадлежит собственному CSS Module.
