import React from 'react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { Cell, Column, Empty, Expand, Head, compileTableConfiguration } from '@sellgar/kit/table';

import type { TableCellRenderScope, TableConfigurationInput, TableExpandedRenderContext } from '@sellgar/kit/table';

interface Product {
  uuid: string;
  name: string;
  offers: { uuid: string }[];
  children: Product[];
}

const product: Product = { uuid: 'product-1', name: 'Товар', offers: [{ uuid: 'offer-1' }], children: [] };
const data = { nodes: [product] };

const context: TableCellRenderScope<Product> = {
  row: product,
  rowIndex: 0,
  rowSelected: false,
  node: { nodeId: 'node-1', data: product, index: 0, depth: 0, parentNodeId: null, hasChildren: false },
  nodeId: 'node-1',
  columnId: 'key:name',
  columnIndex: 0,
  cellId: 'cell-1',
  lineId: 'line-1',
  ExpandTrigger: () => null,
  TreeTrigger: () => null,
};

const automaticColumn = <Column key={'automatic'}>{({ Cell }) => <Cell />}</Column>;

describe('Table configuration compiler', () => {
  it('requires explicit resize permission for each column', () => {
    const configuration = compileTableConfiguration({
      data,
      children: [
        <Column key={'default'}>
          <Cell />
        </Column>,
        <Column key={'disabled'} resizable={false}>
          <Cell />
        </Column>,
        <Column key={'enabled'} resizable={true}>
          <Cell />
        </Column>,
      ],
    });
    expect(configuration.columns.map((column) => column.resizable)).toEqual([false, false, true]);
  });
  it('сохраняет components в Cell, как в brands/products, без вызова их render и hooks', () => {
    const Name = vi.fn(() => <span>{product.name}</span>);
    const content = <Name />;
    const configuration = compileTableConfiguration({
      data,
      size: 'md',
      children: ({ Column }) => (
        <>
          <Column key={'name'}>
            {({ Head, Cell }) => (
              <>
                <Head label={'Наименование'} />
                <Cell>{content}</Cell>
              </>
            )}
          </Column>
          <Column key={'description'} width={'minmax(0, 1fr)'}>
            {({ Head, Cell }) => (
              <>
                <Head label={'Описание'} />
                <Cell>Описание</Cell>
              </>
            )}
          </Column>
        </>
      ),
    });

    expect(configuration.data).toBe(data);
    expect(configuration.size).toBe('md');
    expect(configuration.columns.map((column) => column.columnId)).toEqual(['key:name', 'key:description']);
    expect(configuration.columns[1]?.width).toBe('minmax(0, 1fr)');
    expect(configuration.renderers.columns.get('key:name')?.cell(context)).toBe(content);
    expect(Name).not.toHaveBeenCalled();
    expect(configuration.columns[0]).not.toHaveProperty('header');
    expect(configuration.columns[0]).not.toHaveProperty('render');
  });

  it('выводит row из data в Cell, Expand и row handlers, как в store', () => {
    const cellRender = vi.fn((row: Product) => row.name);
    const expandedRender = vi.fn((row: Product) => row.offers.length);
    const configuration = compileTableConfiguration({
      data,
      surface: 'embedded',
      style: 'secondary',
      row: {
        handlers: {
          click: ({ row }) => {
            expectTypeOf(row).toEqualTypeOf<Product>();
          },
          doubleClick: ({ context }) => context.expansion?.toggle(),
        },
      },
      children: ({ Column, Expand }) => (
        <>
          <Column>
            {({ Cell }) => (
              <Cell
                render={({ row }) => {
                  expectTypeOf(row).toEqualTypeOf<Product>();
                  return cellRender(row);
                }}
              />
            )}
          </Column>
          <Expand
            render={({ row }) => {
              expectTypeOf(row).toEqualTypeOf<Product>();
              return expandedRender(row);
            }}
          />
        </>
      ),
    });

    expect(cellRender).not.toHaveBeenCalled();
    expect(expandedRender).not.toHaveBeenCalled();
    expect(configuration.renderers.columns.get('column:0')?.cell(context)).toBe(product.name);
    expect(configuration.renderers.expanded?.(context)).toBe(1);
    expect(configuration.surface).toBe('embedded');
    expect(configuration.row?.handlers?.doubleClick).toBeTypeOf('function');
  });

  it('сохраняет tree categories и остальные root options, не исполняя callbacks', () => {
    const onSelect = vi.fn();
    const onLastRowVisible = vi.fn();
    const tree = { isUse: true, accessor: 'children', defaultExpanded: false } satisfies NonNullable<
      TableConfigurationInput<Product>['tree']
    >;
    const layout = { scroll: 'external', virtualization: { enabled: true, rowHeight: 32, overscan: 4 } } as const;
    const configuration = compileTableConfiguration({
      data,
      tree,
      select: { isUse: true, onSelect },
      lastRowTrigger: { onLastRowVisible },
      layout,
      children: automaticColumn,
    });

    expect(configuration.tree).toBe(tree);
    expect(configuration.layout).toBe(layout);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onLastRowVisible).not.toHaveBeenCalled();
  });

  it('принимает обычные компоненты деклараций, вложенные fragments, arrays и условные ветки', () => {
    const configuration = compileTableConfiguration({
      data,
      children: (
        <>
          {false}
          {null}
          <React.Fragment>
            {[
              <Column key={'first'}>
                <Cell />
              </Column>,
            ]}
          </React.Fragment>
          <Empty>Пусто</Empty>
          <Expand>Подробности</Expand>
        </>
      ),
    });

    expect(configuration.columns).toHaveLength(1);
    expect(configuration.renderers.empty?.()).toBe('Пусто');
    expect(configuration.renderers.expanded?.(context)).toBe('Подробности');
  });

  it('сохраняет keyed id при перестановке, не мутирует декларации и не накапливает registry', () => {
    const first = (
      <Column key={'a'}>
        <Cell />
      </Column>
    );
    const second = (
      <Column key={'b'}>
        <Cell />
      </Column>
    );
    const originalProps = first.props;
    const before = compileTableConfiguration({ data, children: [first, second] });
    const after = compileTableConfiguration({ data, children: [second, first] });

    expect(before.columns.map((column) => column.columnId)).toEqual(['key:a', 'key:b']);
    expect(after.columns.map((column) => column.columnId)).toEqual(['key:b', 'key:a']);
    expect(before.renderers.columns.size).toBe(2);
    expect(after.renderers.columns).not.toBe(before.renderers.columns);
    expect(first.props).toBe(originalProps);
  });

  it('сохраняет размеры в логических единицах и metadata без расчёта CSS-треков', () => {
    const sort = { onToggle: vi.fn() };
    const configuration = compileTableConfiguration({
      data,
      children: (
        <>
          <Column key={'fixed'} width={280} minWidth={120} maxWidth={400} pinLeft={true} sort={sort} order={2}>
            <Head label={'Название'} />
            <Cell />
          </Column>
          {automaticColumn}
        </>
      ),
    });

    expect(configuration.columns[0]).toMatchObject({
      width: 280,
      minWidth: 120,
      maxWidth: 400,
      pinLeft: true,
      order: 2,
      sort,
    });
    expect(configuration.columns[0]).not.toHaveProperty('calculatedWidth');
    expect(sort.onToggle).not.toHaveBeenCalled();
  });

  it('связывает Action со своим state и откладывает render и onAction', () => {
    const onAction = vi.fn();
    const actionRender = vi.fn((state: boolean) => (state ? 'Включено' : 'Выключено'));
    const configuration = compileTableConfiguration({
      data,
      children: ({ Column }) => (
        <Column>
          {({ Cell, Actions }) => (
            <>
              <Actions>
                {({ Action }) => (
                  <Action state={true} disabled={true} onAction={onAction}>
                    {({ state }) => {
                      expectTypeOf(state).toEqualTypeOf<boolean>();
                      return actionRender(state);
                    }}
                  </Action>
                )}
              </Actions>
              <Cell />
            </>
          )}
        </Column>
      ),
    });

    const action = configuration.renderers.columns.get('column:0')?.actions[0];

    expect(actionRender).not.toHaveBeenCalled();
    expect(onAction).not.toHaveBeenCalled();
    expect(action?.disabled).toBe(true);
    expect(action?.render()).toBe('Включено');
    action?.onAction();
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('retains explicit action identities across reorder and rejects duplicates', () => {
    const compile = (reversed = false, duplicate = false) =>
      compileTableConfiguration({
        data,
        children: ({ Column }) => (
          <Column>
            {({ Cell, Actions }) => (
              <>
                <Cell />
                <Actions>
                  {({ Action }) => {
                    const first = (
                      <Action key="a" state={1} onAction={() => {}}>
                        {({ state }) => state}
                      </Action>
                    );
                    const second = (
                      <Action key={duplicate ? 'a' : 'b'} state={2} onAction={() => {}}>
                        {({ state }) => state}
                      </Action>
                    );
                    return reversed ? [second, first] : [first, second];
                  }}
                </Actions>
              </>
            )}
          </Column>
        ),
      }).renderers.columns.get('column:0')!.actions;
    expect(compile().map((action) => action.id)).toEqual(['key:a', 'key:b']);
    expect(compile(true).map((action) => action.id)).toEqual(['key:b', 'key:a']);
    expect(() => compile(false, true)).toThrow(/Duplicate Table action id/);
  });

  it.each([
    { children: null, message: 'at least one Column' },
    { children: 'text', message: 'must be React elements' },
    { children: <div />, message: 'accepts only Column' },
    { children: <Column />, message: 'requires a Cell' },
    {
      children: (
        <Column>
          <Cell />
          <Cell />
        </Column>
      ),
      message: 'duplicate Cell',
    },
    {
      children: (
        <Column>
          <Head />
          <Head />
          <Cell />
        </Column>
      ),
      message: 'duplicate Head',
    },
    {
      children: (
        <Column>
          <div />
        </Column>
      ),
      message: 'accepts only Head',
    },
    { children: [automaticColumn, automaticColumn], message: 'Duplicate Table column id' },
    { children: [automaticColumn, <Empty />, <Empty />], message: 'duplicate Empty' },
    { children: [automaticColumn, <Expand />, <Expand />], message: 'duplicate Expand' },
    {
      children: (
        <Column width={100}>
          <Cell />
        </Column>
      ),
      message: 'automatic visible Column',
    },
    {
      children: [
        <Column key={'fixed'} width={100}>
          <Cell />
        </Column>,
        <Column key={'hidden-auto'} visible={false}>
          <Cell />
        </Column>,
      ],
      message: 'automatic visible Column',
    },
    {
      children: (
        <Column visible={false}>
          <Cell />
        </Column>
      ),
      message: 'visible Column',
    },
    {
      children: (
        <Column minWidth={-1}>
          <Cell />
        </Column>
      ),
      message: 'minWidth',
    },
    {
      children: (
        <Column maxWidth={Infinity}>
          <Cell />
        </Column>
      ),
      message: 'maxWidth',
    },
    {
      children: (
        <Column width={NaN}>
          <Cell />
        </Column>
      ),
      message: 'width',
    },
    {
      children: (
        <Column minWidth={300} maxWidth={200}>
          <Cell />
        </Column>
      ),
      message: 'minWidth must not exceed',
    },
    {
      children: (
        <Column pinLeft={true} pinRight={true}>
          <Cell />
        </Column>
      ),
      message: 'both sides',
    },
    {
      children: (
        <Column order={NaN}>
          <Cell />
        </Column>
      ),
      message: 'order',
    },
  ])('отклоняет некорректную схему: $message', ({ children, message }) => {
    expect(() => compileTableConfiguration({ data, children })).toThrow(message);
  });

  it('не исполняет пользовательские wrapper components при разборе деклараций', () => {
    const Wrapper = vi.fn(() => automaticColumn);

    expect(() => compileTableConfiguration({ data, children: <Wrapper /> })).toThrow('accepts only Column');
    expect(Wrapper).not.toHaveBeenCalled();
  });
});

// These functions are checked by tsc; they are deliberately never executed.
const verifyTypeErrors = (): void => {
  compileTableConfiguration({
    data,
    children: ({ Column }) => (
      <Column>
        {({ Cell }) => (
          <Cell
            render={({ row }) => {
              // @ts-expect-error Row comes from data and has no missingField property.
              return row.missingField;
            }}
          />
        )}
      </Column>
    ),
  });

  compileTableConfiguration({
    data,
    // @ts-expect-error Tree accessor must be a key of Product.
    tree: { isUse: true, accessor: 'missingField' },
  });

  compileTableConfiguration({
    data,
    row: {
      handlers: {
        click: ({ row }) => {
          // @ts-expect-error Event callbacks cannot widen the inferred data type.
          return row.missingField;
        },
      },
    },
  });

  expectTypeOf<TableExpandedRenderContext<Product>['row']>().toEqualTypeOf<Product>();
};

void verifyTypeErrors;
