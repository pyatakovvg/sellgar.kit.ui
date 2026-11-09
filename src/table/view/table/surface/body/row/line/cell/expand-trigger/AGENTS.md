# Expand Trigger

- Нативная кнопка Cell render scope; совместимый публичный alias — Table.ExpandTrigger
  и named ExpandTrigger из @sellgar/kit/table. Работает внутри потомков Table.Cell.
- Получает состояние из RowContext и вызывает browser.toggleExpanded для этой строки.
- Click не всплывает в primary action строки, в том числе при отключённом default guard.
- Children являются существующим публичным React/render-prop контрактом; новый API не вводится.

- Visual root имеет собственный CSS Module: transparent reset, наследуемые font/color,
  native disabled и focus-visible. Стили браузерной кнопки не должны менять визуал ячейки.
