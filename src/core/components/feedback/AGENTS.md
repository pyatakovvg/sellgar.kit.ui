# AGENTS.md

## AGENTS узла

Путь: `src/core/components/feedback`

## Что это

Family-каталог feedback-компонентов.

## Назначение

Здесь размещаются компоненты обратной связи о процессе или результате: spinner, progress, notification, modal icon и локальная анимационная поддержка.

## Правила изменений

- Экспортировать компоненты через `index.ts` family-узла.
- Не переносить сюда status-компоненты, если они описывают статическое состояние сущности.

## Проверка

- Для source-изменений запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
