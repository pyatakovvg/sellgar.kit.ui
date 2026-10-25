# OptionList

Приватный список одиночного TreeSelect. Рисует только видимые строки,
использует готовый SelectOption. Идентификаторы не зависят от resolveKey.
Явные aria-level/posinset/setsize описывают плоский DOM дерева; aria-expanded
есть только у ветвей, aria-selected — у листьев. Отступы создаются по ancestorIds
со стабильными ключами, без index keys и runtime inline CSS.
