# TreeOption

Приватный адаптер готового ExtendedOption: Checkbox в leadIcon, Button.Icon
в tailIcon и стандартный badge. Не создаёт собственной DOM-разметки и стилей строки.
Выбор чекбокса не окрашивает строку целиком, как в Figma.

- Checkbox controlled: checked/isIndeterminate приходят от владельца,
  native onChange вызывает onCheck ровно один раз.
- Click/keydown нативного checkbox/label не всплывают в выбор всей строки. Нативный click
  не отменяется: preventDefault ломает синхронизацию DOM checked и React value.
- Pointerdown checkbox сохраняет фокус combobox; click остаётся нативным.
- Checkbox исключён из Tab/ARIA: выбор представлен aria-checked treeitem.
- Стрелка — готовый Button.Icon, исключённый из Tab; её click не выбирает строку,
  pointerdown сохраняет фокус combobox.
- Не дублировать разметку и стили кнопки, текста, badge или содержимого ExtendedOption.

Недоступная ветвь сохраняет интерактивные стрелку и навигацию. Disabled
применяется к её checkbox и выбору потомков; целый ExtendedOption блокируется только
для недоступного листа, где нет самостоятельного действия раскрытия.
