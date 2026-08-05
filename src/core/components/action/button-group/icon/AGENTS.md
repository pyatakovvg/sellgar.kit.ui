# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/action/button-group/icon`.

## Что это

`Icon` — scoped subcomponent для icon-only segment внутри `ButtonGroup`.

Несмотря на имя, это не общий icon renderer и не wrapper над generated icon set. Общий icon primitive находится в `src/core/components/content/icon`, а generated SVG icons находятся в `src/icons/generated`.

## Назначение

Компонент рендерит один native button-сегмент фиксированной ширины с иконкой в `leadIcon`.

## Граница ответственности

- Отвечает только за отображение icon segment внутри `ButtonGroup`.
- Получает group-level props от родителя через `React.cloneElement`.
- Не должен владеть active selection, tooltip, focus roving или keyboard navigation.

## Как реализован

- Public entrypoint локального каталога: `index.ts`.
- Основная реализация: `icon.tsx`.
- Стили: `icon.module.scss`.
- Компонент является `React.FC<IProps>`.
- Рендерит native `<button>`.
- Классы размера, формы и active state вычисляются через `React.useMemo` и `classnames`.

## Public API и локальные файлы

- Локальный export: `export { Icon } from './icon.tsx'`.
- Локальный type export сейчас: `export type { IProps as IButtonProps } from './icon.tsx'`.
- Внешний consumer использует subcomponent через `ButtonGroup.Icon`, а не через прямой import из этого каталога.
- Props:
  - все `React.ButtonHTMLAttributes<HTMLButtonElement>`, кроме `style`;
  - `isActive?: boolean`;
  - `size?: 'sm' | 'md' | 'lg'`;
  - `shape?: 'rounded' | 'pill'`;
  - `leadIcon?: React.ReactNode`.

## Контракт изменения

- Не менять native element `<button>` без пересмотра disabled/click/form behavior.
- Не менять `size` и `shape` values без синхронизации с `ButtonGroup`.
- `disabled`, `size` и `shape` могут быть переписаны родителем `ButtonGroup`.
- `leadIcon` отображается внутри `.lead-icon`; на этот container завязан SCSS.
- `children` сейчас не отображаются, хотя тип разрешает их через `ButtonHTMLAttributes`.
- `style` сейчас намеренно исключён из props.

## Фактическое поведение

- Stateless component: нет локального state, effects или refs.
- `isActive` добавляет class `active`.
- `disabled` работает через native button attribute, если передан.
- Переданный consumer `className` сейчас не сохраняется: `<button {...props} className={classNameButton}>` перезаписывает `props.className`.
- `ref` не forward-ится.
- `children` игнорируются.

## Зависимости

- React.
- `classnames`.
- CSS Modules.
- Дочерняя иконка приходит как `ReactNode`; component не импортирует icon set.

## Правила изменений

- Сохранять component scoped внутри `ButtonGroup`.
- Не смешивать этот component с общим `Icon` primitive или generated icon API.
- Не добавлять tooltip/focus/selection lifecycle внутрь icon segment.
- Если нужно отображать текст, сначала решить: это изменение `Icon` contract или нужно использовать `ButtonGroup.Button`.
- Если добавляется `className` merge, нужно проверить все состояния `active`, `disabled`, `size`, `shape`.

## Риски и точки внимания

- CSS border/radius зависит от того, что этот component является непосредственным DOM child внутри wrapper `ButtonGroup`.
- `className` не merge-ится, поэтому внешняя стилизация через props сейчас фактически не работает.
- Название `Icon` может быть спутано с public `Icon` primitive и generated SVG icons.
- Storybook передаёт children внутрь `ButtonGroup.Icon`, но component их не рендерит.

## Технический долг

- `icon/index.ts` экспортирует props как `IButtonProps`; имя типа не отражает назначение icon segment.
- Нет `className` merge.
- Нет `forwardRef`.
- `children` разрешены типами, но игнорируются implementation.
- Props type исключает `style`, но это не объяснено public contract-ом выше уровня компонента.

## Проверка

- `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`
- Storybook: `clients/storybook/src/kit/symbols/button-group/button-group.stories.tsx`.
- Проверить `leadIcon`, `isActive`, `disabled`, все `size` и `shape`, а также сценарий с переданными `children`.
