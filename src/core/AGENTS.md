# AGENTS.md

## Что это

Основной UI-срез пакета `@sellgar/kit`.

`src/core` формирует публичную React-поверхность основного импорта:

```ts
import { Button, Select, Table } from '@sellgar/kit';
```

## Назначение

`core` содержит UI-компоненты и общие runtime-системы, которые должны быть доступны через основной entrypoint `@sellgar/kit`.

Этот срез не должен включать runtime-фичи, feature providers/services или полный generated icon set.

## Как реализован

- Public entrypoint среза: `src/core/index.ts`.
- Root package entrypoint `src/index.ts` экспортирует `core`.
- `components` содержит публично воспринимаемые UI-kit компоненты, сгруппированные по family.
- `systems` содержит общие runtime-механизмы, которые переиспользуются компонентами.

Структура:

```text
src/core/
  index.ts
  components/
    action/
    controls/
    overlay/
    data/
    navigation/
    content/
    layout/
    feedback/
    media/
    status/
    disclosure/
    user/
  systems/
```

## Public API и локальные файлы

- `src/core/index.ts` экспортирует `components` и `systems`.
- Public API попадает в consumer import через `@sellgar/kit`.
- Любое изменение export name, props, exported type или compound API может быть breaking change.
- Внутренние файлы компонента не являются public API, если они не экспортируются через локальный `index.ts` и родительские barrels.

## Фактическое поведение

- `core` сейчас является широким barrel-based entrypoint.
- Внутри `core` есть как render-only components, так и сложные компоненты с runtime lifecycle.
- Некоторые interaction-компоненты используют Floating UI, browser observers, DOM measurements, `moment` и другие runtime-зависимости.
- Технический долг конкретных компонентов фиксируется в локальных `AGENTS.md` и в `docs/architecture/technical-debt.md`.

## Зависимости

Разрешено:

- `core -> shared`;
- `core -> icons`, если компоненту нужна конкретная иконка;
- `core -> external runtime dependencies`, если они уже являются частью package contract.

Запрещено:

- `core -> features`;
- импорт полного generated icon set в основной entrypoint;
- top-level side effects без отдельного решения.

## Правила изменений

- Новый публичный компонент размещать в `components/<family>/<component>`.
- Общий runtime-механизм для нескольких компонентов размещать в `systems/<system>`.
- Не возвращать верхнеуровневые каталоги `primitives`, `compositions` и `interactions`.
- Не переносить runtime-фичи в `core`.
- Не добавлять public export без оценки blast radius.
- Для нового публичного компонентного каталога создавать локальный `AGENTS.md` по `docs/architecture/local-agents-template.md`.

## Риски и точки внимания

- `core` имеет самый широкий blast radius после `src/index.ts`.
- Barrel exports могут скрывать cycles и случайное расширение public API.
- Interaction-компоненты могут раздувать consumer bundle, если попадают в entrypoint с top-level side effects.
- Изменения в `core` часто требуют проверки Storybook-сценариев.

## Технический долг

- Core public API пока не переведён на явный список exports.
- `moment-timezone` не должен возвращаться в `src/index.ts`; date/time side effects должны оставаться локальными для date/time interactions.
- Часть компонентов имеет локальный долг: `any`, hardcoded texts, index keys, DOM-only APIs, observers, console side effects.

## Проверка

- Для TypeScript/source изменений запускать `../../node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false`.
- Для public API или build-impact изменений запускать `yarn build` в `library/kit`.
- Для изменений поведения проверять соответствующий Storybook scenario.
