# AGENTS.md

## Назначение

Основной MultipleSelect нового семейства Select. Самостоятельная реализация и
приватный props-контракт в multiple.tsx. Фасад семейства подключает NewSelect.Multiple.
Button-вариант не создаётся; пользовательский триггер задаётся через renderTrigger.

## Основа переноса

- Использованы существующие multi-select, use-multi-select, option-list и
  selected-value-list. Сохранены select-all, partial state, badges, удаление,
  maxVisibleOptions, renderOption/renderSelectedOption/renderOverflow.
- Surface, Placeholder и Empty переиспользуются из старого MultiSelect через
  локальные index.ts в рамках постепенной миграции по требованию пользователя.
  Они сохраняют desktop popup, Scrollbar и mobile sheet с кнопкой Применить.
- Старый MultiSelect сохраняется. Новое семейство экспортируется через @sellgar/kit
  как NewSelect/NewSelect.Multiple без пересечения с public Select.
- Floating.List остаётся смонтирован при закрытом popup для клавиатуры trigger-а.
  closeOnSelect=false; выбранные значения сообщаются сразу, Применить закрывает sheet.
- Прокрутка выбранной/активной опции использует существующий scrollItemIntoView
  с block: center, inline: nearest. Роль/id listbox применяются один раз внутри Surface.

## Props и выбор

- Без resolveKey value/onChange используют исходные TOption[]. С resolveKey —
  TResult[], включая объекты. Пустое значение — [], никогда null.
- Контракт controlled: отсутствующее value рассматривается как пустой массив,
  локальной копии value и defaultValue нет.
- isValueEqual по умолчанию Object.is; объектная проекция задаёт сравнение по
  бизнес-полям. Удаление и toggle используют то же сравнение, что отображение.
- Идентификаторы строк не зависят от resolveKey. useOptions перенесён из simple
  как приватная техническая механика без общего state и props между компонентами.
- resolveValue возвращает string|number по явному решению пользователя: стандартные
  выбранные значения используют Badge. Сложный визуал задаётся render-функциями.
- renderTrigger получает open/disabled/selectedOptions исходных опций. Native props
  пользователь задаёт на своём trigger-элементе с поддержкой props/ref Floating.Trigger.
- selectAllEnabled=true, selectAllText=Выбрать все, maxVisibleOptions=3,
  clearable=true, fixHeight=false сохраняют defaults старого MultiSelect.
- Select-all выбирает доступные options в порядке options; повторное нажатие
  очищает массив. Как в старом MultiSelect, заменяет выбор всей доступной коллекцией.
- disabled блокирует выбор и очистку; isOptionDisabled блокирует отдельные строки.
  Уже выбранную disabled-опцию можно удалить из badges, как в старой реализации.
- Native onFocus/onBlur относятся к стандартному trigger, не к open state.

## Структура

- option-list и selected-value-list — приватные коллекции, не отдельное семейство.
- IProps и сигнатуры render-функций приватные; их не экспортируют фасады.
- Generic arrow functions используют ранее согласованное исключение BASE-4.
- Компоненты дерева не создаются на этом этапе.

## Ограничения и проверка

- Для отображения значения options должны содержать выбранную опцию.
- Стандартная remove-иконка badges перенесена из старого SelectedValueList;
  изменение семантики общего Badge не входит в этот перенос.
- Storybook Kit/Controls/NewSelect/Multiple: Default, PropertyResult, ObjectResult,
  CustomTrigger, CustomRender, Disabled, Empty, WithoutSelectAll, AllDisabled,
  ReadOnlyValue и SelectedFarOption.
- Проверять controlled [], повторный toggle, select-all/partial, запрет disabled,
  очистку, удаление badge, overflow, кастомизации, клавиатуру, mobile и прокрутку.
