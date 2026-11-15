# OptionList

Приватный список одиночного TreeSelect. Рисует только видимые строки,
использует готовый SelectOption. Идентификаторы не зависят от resolveKey.
Явные aria-level/posinset/setsize описывают плоский DOM дерева; aria-expanded
есть только у ветвей, aria-selected — у листьев. Отступы создаются по ancestorIds
со стабильными ключами, без index keys и runtime inline CSS.

При selectBranches=true aria-selected есть и у ветвей. Отдельная кнопка раскрытия
не вызывает выбор строки; листья сохраняют такой же отступ имени.
