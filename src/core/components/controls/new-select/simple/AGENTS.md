# AGENTS.md

## Что это

Самостоятельный одиночный Select нового семейства. Точка входа — `index.ts`.
Компонент и его props не зависят от других реализаций Select.

## Реализация

- Приватный IProps и generic-сигнатуры находятся в `simple.tsx`.
- Единственный экспорт фасада — SimpleSelect. Props и hooks не экспортируются.
- `hooks/use-options.hook.ts`: техническая идентичность строк по исходным опциям,
  независимая от результата resolveKey. Не хранит выбранное значение.
- `simple.tsx`: композиция Floating.Select, SelectInput, SelectOption и существующих
  Surface, Placeholder и Empty старого Select. Свой popup runtime не создаётся.
- `option-list/`: приватный список опций SimpleSelect. Получает готовые состояния
  строк его Floating.Select и resolveValue. Разметка строк и их стили принадлежат
  списку; наружу из SimpleSelect он не экспортируется.
- SimpleSelect определяет выбор и resolveKey; OptionList не хранит и не
  преобразует value. Новый список не использует optionKey/optionValue.
- Список опций является внутренней частью селекта. Самостоятельное семейство
  списков не создаётся; существующий отдельный SelectList не изменяется.
- Floating.Select смонтирован и при закрытом popup, чтобы навигация trigger-а
  была зарегистрирована до открытия.
- Для Floating.Select задан scrollItemIntoView с block: center и inline: nearest.
  Выбранная при открытии и активная с клавиатуры строка стремятся к середине
  видимой области; у краёв списка прокрутка ограничена доступным диапазоном.
  Используется существующая прокрутка useListNavigation без отдельного effect.
- Floating автоматически выбирает popover или sheet по своему mobileQuery
  (по умолчанию max-width: 767px), включая смену ширины при открытом списке.
- На время постепенной миграции переиспользуются Surface, Placeholder и Empty
  из старого Select через их index.ts.
  Это временные зависимости от старого Select по требованию переиспользовать
  существующую реализацию. Общее размещение этих компонентов ещё не определено;
  не считать их новым публичным API и не распространять глубокие импорты.
- Существующий Surface сохраняет desktop popover и мобильный sheet с заголовком,
  крестиком, кнопкой Закрыть, backdrop и блокировкой прокрутки.
- listProps применяются только к списку внутри Surface; ref и вычисленные стили
  позиционирования — к внешней поверхности. Роль/id listbox не дублируются.

## Props и состояние

- `resolveValue` обязателен и возвращает ReactNode для отображения опции.
- `renderOption(option, meta)` перенесён из старого Select: заменяет стандартный
  SelectOption целиком, получает исходную опцию и index/isActive/isDisabled/isSelected.
  Интерактивная оболочка, ref, события и ARIA остаются у OptionList/Floating.Select.
  На выбранное представление в trigger это не влияет: оно использует resolveValue.
  Callback не пробрасывается в DOM как атрибут SelectInput.
- `renderTrigger({ open, disabled, selectedOption })` заменяет стандартный SelectInput.
  selectedOption — исходная опция, независимо от результата resolveKey.
  Callback возвращает один ReactElement, который существующий Floating.Trigger
  подключает к своему ref, ARIA и событиям. Компонент потребителя должен пробрасывать
  эти props/ref до своего интерактивного DOM-узла и учитывать state.disabled.
- Без renderTrigger сохраняются стандартное поле, placeholder, очистка и native
  props SelectInput. При кастомном trigger его native props задаются на элементе
  renderer-а; props стандартного SelectInput на него автоматически не переносятся.
- renderTrigger не пробрасывается в DOM. Дополнительные Button-варианты селекта
  не создаются: кнопка задаётся через этот callback.
- Без `resolveKey` value/onChange работают с TOption.
- С `resolveKey` они работают с произвольным TResult. Пустой выбор — undefined.
- Компонент controlled: value приходит от потребителя, изменение сообщается через
  onChange. Локальной копии value и defaultValue нет.
- `isValueEqual` по умолчанию Object.is. Для новых объектов, возвращаемых
  resolver-ом, потребитель задаёт сравнение по бизнес-полям.
- `isOptionDisabled` определяет недоступные опции без требования поля disabled.
- onFocus/onBlur — события trigger-а, а не открытия popup.
- clearable по умолчанию false; очистка доступна крестиком и Delete/Backspace.

## Правила структуры

- Применяется fe-react-component-structure из payment-terminal.workspace.
- Согласованное исключение BASE-4: generic-компонент объявляется через const и
  generic arrow function; IProps остаётся приватным в файле компонента.
- Негeneric-компоненты используют React.FC.
- Новые props, helpers и коллекции не выносятся в общие контракты семейства.
- Storybook-story разрешена прямым запросом пользователя.

## Ограничения первого этапа

- Options — полная коллекция для определения выбранной опции. Для отсутствующего
  в ней value пока виден placeholder; async и resolver отсутствующих данных не реализованы.
- При refetch новых экземпляров объектов идентификаторы строк пересоздаются;
  восстановление selection определяется isValueEqual.
- Clear-иконка наследует разметку SelectInput. Клавиатурная очистка реализована
  на trigger-е; изменение общего SelectInput — отдельная задача.
- Fallback-тексты Select... и Нет данных перенесены из старой реализации.

## Проверка

Storybook: Kit/Controls/NewSelect/Simple. TypeScript, ESLint и Prettier для новых файлов.
В браузере проверить scalar/object
результат, controlled value={undefined}, запрет выбора disabled, очистку,
открытие ArrowDown и закрытие Escape, перестановку options.
Проверять мобильный sheet, закрытие по backdrop и переходы через breakpoint
в обе стороны при открытом списке; значение выбора должно сохраняться.
CustomRender проверяет замену представления опции и состояния renderer-а.
CustomTrigger проверяет кастомную кнопку, open/disabled, выбор исходной опции,
открытие ArrowDown, навигацию и возврат фокуса после Escape.
SelectedFarOption: 60 опций, выбрана 40-я; при открытии она должна оказаться
в середине видимой области существующего Scrollbar без прокрутки страницы Storybook.
