# HeaderActions

- Приватный control HeadCell; читает декларации действий через environment и контекст колонки.
- Владеет open state. Использует kit Popover для positioning, portal, focus и dismiss.
- HeadCell монтирует control только при непустом наборе Actions; удаление деклараций сбрасывает open state. Focusable Trigger явно использует role="button".
- Действия отображаются нативными кнопками внутри group; Tab/Enter и disabled сохраняются.
- Фасад экспортирует только HeaderActions. Декларации и callbacks принадлежат configurator.
