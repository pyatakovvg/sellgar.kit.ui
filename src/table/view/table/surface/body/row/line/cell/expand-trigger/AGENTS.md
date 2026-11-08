# Expand Trigger

- Приватная нативная кнопка существующего Cell render scope.
- Получает состояние из RowContext и вызывает browser.toggleExpanded для этой строки.
- Children являются существующим публичным React/render-prop контрактом; новый API не вводится.

- Visual root имеет собственный CSS Module: transparent reset, наследуемые font/color,
  native disabled и focus-visible. Стили браузерной кнопки не должны менять визуал ячейки.
