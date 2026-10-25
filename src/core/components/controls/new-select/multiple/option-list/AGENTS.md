# AGENTS.md

Приватный список MultipleSelect, адаптированный из multi-select/option-list.
Отображает готовые состояния Floating.List, не хранит бизнес-выбор или open.
Select-all — отдельная техническая строка, не передаётся в renderOption.
Renderer получает исходный TOption, index без select-all и состояния строки.
Ref, обработчики и ARIA остаются у внешней строки; keys — технические item.value.
Стандартные SelectOption, Badge, Divider и существующий Empty переиспользуются.
Компонент и приватный IProps находятся в option-list.tsx; фасад только OptionList.
