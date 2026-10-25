# AGENTS.md

Приватная коллекция выбранных опций MultipleSelect, перенесённая из старого
selected-value-list с адаптацией optionKey/optionValue к техническому id и resolveValue.
Сохраняет Badge, remove-иконку, maxVisibleOptions и overflow, не хранит selection.
Render-функции получают исходные опции и прежние disabled/removable/selected/onRemove
либо disabled/hiddenCount/hiddenOptions. Метаданные не экспортируются отдельно.
onRemove передаёт исходную опцию владельцу; преобразование resolveKey — у MultipleSelect.
resolveValue — string|number по решению пользователя; сложное отображение — renderer.
Keys строятся по техническому id строки. Стили перенесены из старого компонента.
Фасад экспортирует только SelectedValueList; IProps остаётся в TSX.
