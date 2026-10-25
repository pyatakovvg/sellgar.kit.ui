# NewSelect.Multiple.Tree

Самостоятельная реализация multiple tree с приватным props-контрактом. Фасад
multiple/index.ts добавляет её как Tree, не смешивая props с плоским Multiple.

- Controlled value/onChange — массивы выбранных листьев; пустое значение [].
  Родители никогда не становятся результатами выбора.
- resolveChildren читает исходное дерево, resolveValue возвращает string|number
  для стандартных badges, resolveKey необязателен и возвращает произвольный TResult.
- Чекбокс/строка ветви выбирает или снимает все доступные листья поддерева.
  При частичном выборе нажатие дополняет его до полного. Другие ветви сохраняются.
- Стрелка независимо раскрывает/сворачивает ветвь, не меняя выбор.
- Состояния родителей и Все категории вычисляются из value. Копий selection
  и отдельных значений для родительских чекбоксов нет.
- Disabled ветвь блокирует выбор поддерева, но раскрывается/сворачивается мышью и клавиатурой. Disabled листья исключены из группового
  выбора. Строка Все категории имеет счётчик всех листьев, включая disabled;
  это число значений дерева, а не число видимых строк или выбранных элементов.
- renderOption дополнен depth/isBranch/isExpanded/isIndeterminate/onCheck/onToggle;
  onToggle предназначен для стрелки кастомной строки. Её обработчик должен
  остановить всплытие, чтобы не вызвать каскадный выбор оболочки.
- renderTrigger получает open/disabled/selectedOptions с исходными листьями.
  renderSelectedOption/renderOverflow сохраняют контракт плоского multiple.
- Surface/Placeholder/Empty переиспользуют старый MultiSelect. Мобильная кнопка
  Применить закрывает sheet; onChange вызывается сразу при выборе.
- Существующий Scrollbar и useListNavigation центрируют выбранную строку.
  Скрытый выбранный лист не раскрывает предков автоматически.
- Общий systems/tree не содержит props/value/каскадной логики селектов.
- Чистые функции systems/tree-selection используются совместно с новым
  самостоятельным NewSelectList.Multiple.Tree; props и визуальная часть раздельны.
- Generic arrow function разрешена пользователем вместо React.FC.

Референс: Figma eApdaMYHG82XwGOm0LUtZ5, node 1763:51893.
Stories: Kit/Controls/NewSelect/Multiple/Tree. Проверять каскад, mixed, стрелку,
скрытые выбранные листья, disabled, объектные результаты, keyboard/mobile/scroll.

После исправления событий выбора проверять отдельно click по строке родителя,
нативному input и label чекбокса: повторные циклы полного выбора/очистки и
mixed → checked → unchecked. onCheck в renderOption позволяет подключить
native checkbox onChange; его click нужно изолировать от выбора оболочки.

## Начальное раскрытие

- defaultExpanded?: boolean, по умолчанию true — раскрыты все ветви.
- false задаёт полностью свёрнутое начальное дерево независимо от value.
- Значение применяется при монтировании. Ручное раскрытие сохраняется при
  закрытии/открытии popup; subsequent prop updates не сбрасывают состояние.
- Новые узлы используют исходный режим, выбор и checked/mixed от этого не зависят.
- Prop не попадает в DOM. Stories InitiallyExpanded/InitiallyCollapsed и
  SelectedInCollapsedTree показывают оба режима и выбранный скрытый лист.
