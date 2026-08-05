# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/action/button-group/button`.

## Что это

`Button` — scoped subcomponent для текстового segment внутри `ButtonGroup`.

Это не общий primitive `Button` библиотеки. Общий action primitive находится в `src/core/components/action/button`.

## Назначение

Компонент рендерит один native button-сегмент внутри группы: текст, optional leading icon, optional badge и optional trailing icon.

## Граница ответственности

- Отвечает только за отображение одного segment button в составе `ButtonGroup`.
- Получает group-level props от родителя через `React.cloneElement`.
- Не владеет состоянием группы, active selection, routing, analytics или async lifecycle.

## Как реализован

- Public entrypoint локального каталога: `index.ts`.
- Основная реализация: `button.tsx`.
- Стили: `button.module.scss`.
- Компонент является `React.FC<IProps>`.
- Рендерит native `<button>`.
- Классы размера, формы и active state вычисляются через `React.useMemo` и `classnames`.

## Public API и локальные файлы

- Локальный export: `export { Button } from './button.tsx'`.
- Локальный type export: `export type { IProps as IButtonProps } from './button.tsx'`.
- Внешний consumer использует subcomponent через `ButtonGroup.Button`, а не через прямой import из этого каталога.
- Props:
  - все `React.ButtonHTMLAttributes<HTMLButtonElement>`, кроме `style`;
  - `isActive?: boolean`;
  - `size?: 'sm' | 'md' | 'lg'`;
  - `shape?: 'rounded' | 'pill'`;
  - `leadIcon?: React.ReactNode`;
  - `tailIcon?: React.ReactNode`;
  - `badge?: React.ReactNode`.

## Контракт изменения

- Не менять native element `<button>` без пересмотра disabled/click/form behavior.
- Не менять `size` и `shape` values без синхронизации с `ButtonGroup`.
- `disabled`, `size` и `shape` могут быть переписаны родителем `ButtonGroup`.
- Текст отображается через `props.children` внутри `.text`.
- `leadIcon`, `tailIcon`, `badge` имеют отдельные DOM containers, на которые завязан SCSS.
- `style` сейчас намеренно исключён из props.

## Фактическое поведение

- Stateless component: нет локального state, effects или refs.
- `isActive` добавляет class `active`.
- `disabled` работает через native button attribute, если передан.
- Переданный consumer `className` сейчас не сохраняется: `<button {...props} className={classNameButton}>` перезаписывает `props.className`.
- `ref` не forward-ится.

## Зависимости

- React.
- `classnames`.
- CSS Modules.
- Зависит от CSS variables темы, но не импортирует theme files напрямую.

## Правила изменений

- Сохранять компонент scoped внутри `ButtonGroup`.
- Не переносить этот subcomponent в primitives без отдельного сравнения с существующим `primitives/action/button`.
- Не добавлять group lifecycle или selection state.
- Если добавляется `className` merge, нужно проверить все состояния `active`, `disabled`, `size`, `shape`.
- Если добавляется `forwardRef`, нужно сохранить типизацию native `<button>`.

## Риски и точки внимания

- CSS border/radius зависит от того, что этот component является непосредственным DOM child внутри wrapper `ButtonGroup`.
- `className` не merge-ится, поэтому внешняя стилизация через props сейчас фактически не работает.
- `badge` контейнер пустой по стилям на root-level и зависит от вложенной `.label`.
- Изменение DOM nesting может сломать layout icons/text/badge.

## Технический долг

- Нет `className` merge.
- Нет `forwardRef`.
- Props type исключает `style`, но это не объяснено public contract-ом выше уровня компонента.
- Локальный type export не является самостоятельным public API через `ButtonGroup`.

## Проверка

- `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`
- Storybook: `clients/storybook/src/kit/symbols/button-group/button-group.stories.tsx`.
- Проверить `leadIcon`, `tailIcon`, `badge`, `isActive`, `disabled`, все `size` и `shape`.
