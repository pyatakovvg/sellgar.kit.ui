# AGENTS.md

## Тип документа

Компонентный AGENTS.

Путь: `src/core/components/action/button-group`.

## Что это

`ButtonGroup` — composition-компонент для визуально связанной группы action-кнопок.

Компонент доступен из основного core entrypoint через `@sellgar/kit` и предоставляет compound API:

```tsx
<ButtonGroup>
  <ButtonGroup.Button>Действие</ButtonGroup.Button>
  <ButtonGroup.Icon leadIcon={<SomeIcon />} />
</ButtonGroup>
```

## Назначение

`ButtonGroup` нужен для сценариев, где несколько родственных действий должны выглядеть как единый segmented control: общая высота, общий размер, общая форма, склеенные границы и единое disabled-состояние.

Это не selection interaction и не state machine. Компонент не должен самостоятельно решать, какая кнопка активна, не должен владеть keyboard navigation, focus roving, overlay или global state.

## Граница ответственности

- Отвечает за общий контейнер группы, передачу group-level props дочерним segment components и визуальную склейку кнопок.
- Не отвечает за бизнес-логику выбора, routing, permissions, async state или analytics.
- Не является заменой `core/components`, если появляется lifecycle выбора, roving focus, keyboard navigation или managed active state.
- Дочерние `button` и `icon` являются scoped subcomponents этого компонента, а не самостоятельными public primitives.

## Как реализован

- Public entrypoint каталога: `index.ts`.
- Основная реализация: `button-group.tsx`.
- Scoped subcomponents:
  - `button/Button`;
  - `icon/Icon`.
- `ButtonGroupComponent` рендерит `div` с CSS grid.
- Дочерние элементы проходят через `React.Children.map`.
- Валидные React elements клонируются через `React.cloneElement`, и в них прокидываются group-level props: `size`, `shape`, `disabled`.
- Compound API собирается через `Object.assign(ButtonGroupComponent, { Icon, Button })`.
- `fill="contain"` добавляет модификатор `contain`, переводит grid columns в `1fr` и растягивает группу на `width: 100%`.

## Public API и локальные файлы

- Локальный export: `export { ButtonGroup } from './button-group.tsx'`.
- Consumer import: `import { ButtonGroup } from '@sellgar/kit'`.
- Public component props:
  - `size?: 'sm' | 'md' | 'lg'`;
  - `fill?: 'contain' | 'auto'`;
  - `shape?: 'rounded' | 'pill'`;
  - `disabled?: boolean`;
  - `children`: `ButtonGroup.Button`, `ButtonGroup.Icon` или массив таких элементов.
- Compound/static API:
  - `ButtonGroup.Button`;
  - `ButtonGroup.Icon`.
- Implementation details:
  - `button-group.module.scss`;
  - `button/**`;
  - `icon/**`.

## Контракт изменения

- Нельзя менять имя export `ButtonGroup` и static members `Button`/`Icon` без отдельного решения о breaking change.
- Нельзя менять допустимые значения `size`, `shape`, `fill` без отдельного решения по public API.
- Group-level props, переданные в `ButtonGroup`, сейчас имеют приоритет над одноимёнными props ребёнка из-за `cloneElement(cloneChild, props)`.
- `disabled` должен попадать в дочерние native `<button>` и блокировать пользовательские действия нативным поведением button.
- DOM-структура важна для CSS: непосредственные button-дети используют `:first-child` и `:last-child` для border/radius.
- Не добавлять wrapper вокруг каждого child без пересмотра SCSS-контракта.
- Не превращать компонент в managed selection/radio group без переноса или отдельного проектирования interaction-среза.
- Если добавляется `className`, `ref` или custom data attributes, нужно явно решить, применяются они к wrapper или к дочерним buttons.

## Фактическое поведение

- Компонент stateless: нет локального state, effects, context или refs.
- `ButtonGroup` не валидирует тип children runtime-ом; невалидные children вернутся как есть.
- `ButtonGroup` клонирует только `React.isValidElement(child)`.
- `fill="auto"` оставляет grid columns как `max-content`.
- `fill="contain"` делает все сегменты равными по ширине через `grid-auto-columns: 1fr`.
- `ButtonGroup.Button` рендерит native `<button>` с текстом, optional lead/tail icons и optional badge.
- `ButtonGroup.Icon` рендерит native `<button>` только с `leadIcon`; `children` сейчас не отображаются.
- Storybook сейчас передаёт текст внутрь `ButtonGroup.Icon`, но implementation этот текст игнорирует.

## Зависимости

- React.
- `classnames`.
- CSS Modules.
- Дочерние icons передаются как `ReactNode`; сам `ButtonGroup` не импортирует icon set.
- Не зависит от `features`, `shared`, overlay/floating internals или browser-only APIs.

## Правила изменений

- Сохранять использование локального entrypoint `index.ts`.
- Сохранять compound API через `ButtonGroup.Button` и `ButtonGroup.Icon`.
- Новые scoped subcomponents держать внутри `button-group/**`, пока они не используются соседними компонентами.
- Не экспортировать `button` и `icon` как самостоятельные public components через родительские barrels без отдельного решения.
- Не добавлять selection/open/focus lifecycle в этот component composition.
- Не добавлять новые theme tokens локально в SCSS; использовать существующие CSS variables.
- Перед изменением CSS проверять, не ломается склейка border/radius между соседними сегментами.

## Риски и точки внимания

- `cloneElement` переписывает одноимённые child props group-level props.
- CSS завязан на непосредственный порядок button-элементов; fragment/wrapper/custom child может сломать `:first-child`/`:last-child`.
- `className` дочерних компонентов сейчас не merge-ится, а перезаписывается внутренним CSS module class.
- `ref` не forward-ится ни у wrapper, ни у subcomponents.
- `ButtonGroup.Icon` типологически принимает `children` как часть `ButtonHTMLAttributes`, но визуально children не рендерит.
- `Icon` subcomponent называется обобщённо, но это button-segment with icon, а не общий icon renderer.

## Технический долг

- `IProps` основного компонента не экспортируется как public type.
- `ButtonGroup.Button` и `ButtonGroup.Icon` не поддерживают consumer `className` merge.
- Нет `forwardRef` для wrapper и button subcomponents.
- `ButtonGroup.Icon` игнорирует `children`, хотя Storybook передаёт текст внутрь.
- `icon/index.ts` экспортирует props как `IButtonProps`, хотя это props icon-segment, а не button-segment.
- Нет runtime guard или developer warning для неподдерживаемых children.
- Нет отдельной accessibility-модели для group semantics: wrapper не имеет `role="group"` или aria-label API.

## Проверка

- Минимальная проверка source:

```bash
../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false
```

- Для изменений public export, props contract или сборки:

```bash
yarn build
```

- Storybook scenario: `clients/storybook/src/kit/symbols/button-group/button-group.stories.tsx`.
- Вручную проверить:
  - `fill="auto"` и `fill="contain"`;
  - размеры `sm`, `md`, `lg`;
  - формы `rounded`, `pill`;
  - disabled state;
  - смешанные `ButtonGroup.Button` и `ButtonGroup.Icon`;
  - первый/последний segment и склейку border/radius.
