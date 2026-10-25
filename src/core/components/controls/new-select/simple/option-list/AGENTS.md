# AGENTS.md

## Назначение

Приватный список опций SimpleSelect. Владеет отображением коллекции,
пустого состояния и интерактивных строк. Локальный фасад экспортирует OptionList;
наружу из simple и семейства Select он не экспортируется.

## Контракт

- Приватный generic IProps находится в option-list.tsx.
- items — готовые состояния строк из существующего Floating.Select.
- resolveValue получает исходную option из технической строки и возвращает
  ReactNode для стандартного SelectOption.
- renderOption(option, meta) повторяет механизм старого select/option-list:
  заменяет SelectOption, получая исходную опцию, index и состояния
  isActive/isDisabled/isSelected. События и ARIA остаются у внешней строки.
- Отсутствующий renderOption сохраняет стандартное отображение через resolveValue.
- React key — внутренний item.value от Floating.Select. Это техническая
  идентичность строки, не результат resolveKey публичного Select.
- События, ref, active, disabled и selected берутся из состояния строки.
- Список не преобразует результат выбора и не хранит value/open.
- Семантика listbox и прокрутка остаются в Surface; список не дублирует role/id.
- SelectOption и существующий Empty переиспользуются без копирования разметки.
- Generic arrow function разрешён согласованным исключением BASE-4.
- Список получает состояния от Floating.Select своего SimpleSelect и используется
  внутри его Surface. Это внутренняя композиция селекта, не самостоятельный
  control для размещения в форме. Собственный keyboard runtime не создаётся.
- Не подключать его как реализацию multiple/tree: их списки должны учитывать
  собственные контракты.
