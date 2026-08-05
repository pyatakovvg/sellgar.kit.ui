# AGENTS.md

## Тип документа

Interaction AGENTS.

Путь: `src/core/components/controls/input-otp`.

## Что это

`InputOtp` — interaction-компонент в срезе `core/components/controls`.

## Назначение

OTP interaction для ввода кода, включая Web OTP API и автопереход между ячейками.

## Граница ответственности

- Отвечает за поведение и разметку, которые реализованы в собственном source каталога.
- Не должен брать на себя ответственность соседних слоёв: primitives не владеют lifecycle, compositions не становятся runtime interaction без отдельного решения, interactions не превращаются в feature runtime.
- Дочерние части каталога считаются implementation details, если они не экспортированы через parent public API.
- Дочерних компонентных узлов нет.

## Как реализован

- Public/local entrypoint: `src/core/components/controls/input-otp/index.ts`.
- Source: `src/core/components/controls/input-otp/input-otp.tsx`.
- Собственных child nodes нет.
- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Использует browser API; SSR/test окружения требуют guard или mock.
- Поддерживает `disabled`; disabled-состояние не должно запускать пользовательские действия.
- Имеет `value` prop; проверять controlled-сценарии и синхронизацию с внутренним state.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Рендерит native `<input>`; сохранять value/onChange contract и accessibility attributes.

## Public API и локальные файлы

- `export { InputOtp } from './input-otp.tsx';`
- Consumer import: `import { InputOtp } from '@sellgar/kit'` или compound API ближайшего public-компонента.
- Exported/source names: `InputOtp`.
- Props из `IProps`: `value`, `onChange`, `length`, `disabled`, `autoFocus`, `target`, `name`.
- Локальных parts нет.

## Контракт изменения

- Не менять локальные exports (`export { InputOtp } from './input-otp.tsx';`) без оценки public API.
- Так как узел достижим через barrel chain `@sellgar/kit`, изменение имени компонента, props или exported types может быть breaking change.
- Props contract: `value`, `onChange`, `length`, `disabled`, `autoFocus`, `target`, `name`. Новые/изменённые props нужно отражать в story и документации.
- Native `<input>` нельзя менять без пересмотра value/onChange/focus/accessibility contract.

## Фактическое поведение

- Имеет React effects; при изменениях проверять dependencies, mount/update и cleanup сценарии.
- Работает с refs; изменение DOM target или ref type может быть breaking change.
- Использует browser API; SSR/test окружения требуют guard или mock.
- Поддерживает `disabled`; disabled-состояние не должно запускать пользовательские действия.
- Имеет `value` prop; проверять controlled-сценарии и синхронизацию с внутренним state.
- Имеет callback props; порядок вызовов и disabled guards являются частью поведения.
- Рендерит native `<input>`; сохранять value/onChange contract и accessibility attributes.

## Зависимости

- Внешние runtime imports: `react`, `classnames`.
- Локальные imports: `./default.module.scss`.

## Правила изменений

- Сохранять ближайший `index.ts` как интерфейс каталога; не добавлять обходные imports внутрь implementation files.
- Interaction-компонент обязан явно сохранять контракты focus/open/selection/scroll/data-state.
- Новые helpers/subcomponents держать рядом с компонентом, пока они не используются несколькими соседними узлами.
- Не добавлять зависимость на `features` из core-компонентов.
- Не добавлять новые public exports, theme tokens или i18n API без отдельного решения.

## Риски и точки внимания

- В source есть `any`/широкие object shapes; типовой контракт допускает некорректные значения.
- В source есть console side effects; не добавлять новые и не считать это желательным precedent.
- Есть key по index; при reorder/insert/remove возможны проблемы reconciliation.

## Технический долг

- Уточнить типовой контракт вместо `any`/широких object shapes.
- Убрать или формализовать console side effects отдельной согласованной правкой.
- Заменить index keys на стабильные ids там, где возможен reorder списка.

## Проверка

- Минимальная проверка source: `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для изменений public exports, props contract или сборки: `yarn build` в `library/kit`.
- Storybook scenario: `../../clients/storybook/src/kit/symbols/input-otp/input-otp.stories.tsx`.
- Для визуальных изменений проверить размеры, disabled/active states, DOM order, keyboard/focus behavior и responsive layout, если они применимы к компоненту.
