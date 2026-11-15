# Table Selection Controller

- Публичный Table.ControllerProvider создаёт scope одного Table.
  useTableControllerSelection<T> возвращает snapshot и clear/selectAll/toggleAll.
- runtime/selection-controller только подключает SelectionRuntime и перенаправляет
  подписки/команды. Не копировать state в Provider и не подключать legacy store.
- Table читает controller до установки внутреннего null boundary: вложенные Table
  не наследуют подключение родителя, но могут иметь собственный Provider.
- Несколько активных Table в одном scope — понятная ошибка. Disconnect очищает
  подключение и уведомляет consumers, не меняя состояние самой Table.
