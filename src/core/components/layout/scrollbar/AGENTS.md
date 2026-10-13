# AGENTS.md

## Тип документа

Interaction AGENTS.

Путь: `src/core/components/layout/scrollbar`.

## Что это

`Scrollbar` — layout-компонент в срезе `core/components/layout`.

## Назначение

Единый div-like scroll host с собственной графикой полос прокрутки.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/layout/scrollbar/index.ts`.
- Source: `src/core/components/layout/scrollbar/scrollbar.tsx`.
- `geometry/index.ts` — приватный фасад измерения и размещения полосы.
- `hooks/index.ts` — приватный фасад owned hook подписок и измерения; из публичного фасада компонента не экспортируется.
- Собственных child nodes нет.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Public API и локальные файлы

- `export { Scrollbar } from './scrollbar.tsx';`
- Consumer import: `import { Scrollbar } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `Scrollbar`.
- Props из `IProps`: `className`, `children`, `ref`, стандартные `data-*`, `aria-*` и DOM-события root host.
- `floatingHorizontalScrollbar?: boolean` включён по умолчанию. Пока собственный X overflow есть, а нижняя граница host скрыта, существующая горизонтальная полоса закрепляется у нижнего края видимой области. `false` сохраняет размещение полосы у собственного нижнего края.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { Scrollbar } from './scrollbar.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `className`, `children`, `ref`, стандартные `data-*`, `aria-*` и DOM-события root host. Новые/изменённые props нужно отражать в story и документации.
- `Scrollbar` должен восприниматься потребителем как один `div`-like host: `className` применяется к root, `ref` указывает на root, а внутренние viewport/content/track/thumb являются private implementation.
- Существующие `className`, native `style`, events и `forwardRef` сохраняются как утверждённый public div-like контракт. Изменение floating поведения не является основанием менять этот контракт или пересоздавать children.
- Не добавлять внешние props для настройки внутренних слоёв, track/thumb, content wrapper, options/events/defer или inline style contract без отдельного решения.

## Фактическое поведение

- Единственный источник горизонтального scroll state — внутренний viewport; дополнительный viewport, proxy-полоса и глобальный registry не используются.
- Floating track через scoped React portal размещается в root владельца ограничивающего нижнего края, sibling его private viewport. В Kit-цепочке используется нативный absolute anchor вне движущегося content: обычная Y-прокрутка не компенсируется изменением `bottom` исходной таблицы. Natural/default-off track остаётся absolute внутри собственного root. Меняется только размещение горизонтальной полосы, children и source viewport не перемонтируются.
- Private `data-scrollbar-id`, `data-scrollbar-viewport` и `data-scrollbar-owner` связывают host/viewport/track. Ancestor lanes учитывают только logical ancestor ids; соседние таблицы, чьи полосы размещены в том же overlay host, не становятся ancestors.
- Structural measurements пересекают `visualViewport` и clipping ancestors отдельно по X/Y, сохраняют borders, scale и fixed-containing-block flags. Обычный scroll обновляет кеш координат известным scroll delta и проверяет source boundary; повторного DOM-measure всех ancestors нет. В floating состоянии полоса остаётся видимой. Когда естественный низ виден, действует прежний auto-hide.
- Для внешнего native scrollport track размещается вне его scrolling content с fixed anchor и переводом координат fixed containing block. Это fallback; полнота нативного закрепления гарантируется для Kit host/viewport цепочки.
- Portal сохраняет React event/context ancestry; используемые track tokens (`--numbers-4`, `--numbers-6`, radius и thumb background) читаются из source root при structural measurements. При смене host active drag отменяется до переключения; DOM node track может перемонтироваться, source children сохраняются.
- Thumb рассчитывается по фактической ширине track; source scroll range остаётся `scrollWidth - clientWidth`. RTL использует нормализованную физическую позицию с преобразованием в отрицательный native `scrollLeft`.
- Вложенный самостоятельный X-owner резервирует место над доступной горизонтальной полосой ancestor. Полоса ancestor без X overflow не резервирует место. Резерв сохраняется при auto-hide ancestor, чтобы child не прыгал при hover.
- Owned hook объединяет события через один pending `requestAnimationFrame`: resize, scroll собственного viewport/ancestors, `visualViewport`, ResizeObserver и scoped MutationObserver для локального scrollport/content и ancestor attributes. Text-only изменения также инвалидируют геометрию.
- MutationObserver не наблюдает subtree `body`/`html`; изменения собственных track игнорируются, дочерний host отдельно наблюдает только track своих ancestors. Без X overflow полный clipping walk пропускается.
- Drag привязан к одному pointer id и primary button. Resize диапазона/track, изменение scale, detach, pointer cancel/lost capture и unmount завершают drag. Auto-hide не скрывает полосу во время активного drag.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Использует memoized derivation/callbacks; зависимости hooks должны оставаться точными.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.

## Зависимости

- Внешние runtime imports: `react`, `react-dom`, `classnames`.
- Локальные imports: `./default.module.scss`, `./geometry`, `./hooks`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- Внутренний viewport должен оставаться ближайшим scroll container для children, иначе ломаются сценарии `scrollIntoView` в select-family controls.
- Natural track/thumb остаются sibling overlay-элементами к собственному viewport; floating horizontal track находится в stable owner host. Ни один track не участвует в layout потребителя.
- Изменение позиции внешнего scrollport из-за reflow за пределами локально наблюдаемого scope, CSS sticky/position/transform animations на clipping ancestors, rotation/skew и отрицательные scales не входят в гарантированный контракт. Native fallback при moving containing block выше portal host также требует отдельного контракта. Не добавлять polling или глобальный MutationObserver ради этих сценариев без отдельного решения.

## Технический долг

- Проверить touch/drag сценарии на мобильных устройствах отдельно от desktop Storybook.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Package-local build/lint scripts отсутствуют. Для integration/public behavior использовать Admin UI build и browser smoke; `yarn build` в этом package не объявлять доступной проверкой.
- Storybook scenario: `../../clients/storybook/src/kit/layout/scrollbar/scrollbar.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
