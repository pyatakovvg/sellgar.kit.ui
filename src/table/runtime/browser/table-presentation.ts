import { numbers } from './numbers';

import type { TableColumnGeometry, TableRowGeometry, TableSnapshot } from '../types';

const setStyle = (element: HTMLElement, property: string, value: string): void => {
  if (element.style.getPropertyValue(property) !== value) element.style.setProperty(property, value);
};

const setAttribute = (element: Element | null, name: string, value: string): void => {
  if (element && element.getAttribute(name) !== value) element.setAttribute(name, value);
};

export interface HeaderPlacement {
  readonly mount: HTMLElement;
  readonly slot: HTMLElement;
  readonly portal: HTMLElement;
}

interface GeometryReader {
  getGeometryRevision(): number;
  getRowGeometry(id: string): TableRowGeometry | undefined;
  getColumnGeometry(id: string): TableColumnGeometry | undefined;
}

/** Owns geometric DOM properties. It never renders content or calculates layout. */
export class TablePresentation {
  private content?: {
    root: HTMLElement;
    revision: number;
    total: number;
    height: number;
    container: number;
    viewportWidth: number;
    floating: boolean;
    empty: boolean;
  };

  invalidate(): void {
    this.content = undefined;
  }

  apply(
    root: HTMLElement,
    surface: HTMLElement,
    state: TableSnapshot,
    placement?: HeaderPlacement,
    geometry?: GeometryReader,
  ): boolean {
    const own = (element: Element) => element.closest('[data-table="geometry"]') === root;
    const elements = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(own);
    const empty = state.rowCount === 0 && !state.error;
    const floating = Boolean(!empty && placement && state.headerFloating && !state.error);
    const revision = geometry?.getGeometryRevision();
    const cached = this.content;
    const updateContent =
      revision === undefined ||
      !cached ||
      cached.root !== root ||
      cached.revision !== revision ||
      cached.total !== state.total ||
      cached.height !== state.bodyHeight ||
      cached.container !== state.viewport.container ||
      cached.viewportWidth !== state.viewport.width ||
      cached.floating !== floating ||
      cached.empty !== empty;
    const width = numbers(state.total);
    const grid = updateContent ? state.widths.map(numbers).join(' ') : undefined;
    const surfaceWidth = empty ? state.viewport.container : Math.max(state.total, state.viewport.container);
    setStyle(surface, 'width', numbers(surfaceWidth));
    setStyle(surface, 'min-height', empty ? numbers(state.bodyHeight) : '');
    for (const element of elements('[data-table-empty]'))
      setStyle(
        element,
        'width',
        numbers(Math.min(state.viewport.container, state.viewport.available ?? state.viewport.container)),
      );
    for (const [name, value] of Object.entries({
      dragging: String(state.dragging),
      pinning: state.pinning?.status ?? '',
      totalWidth: String(state.total),
      containerWidth: String(state.viewport.container),
    }))
      if (root.dataset[name] !== value) root.dataset[name] = value;
    if (updateContent) {
      for (const body of elements('[data-table-body]')) {
        setStyle(body, 'height', numbers(state.bodyHeight));
        setStyle(body, 'width', width);
      }
      const rows = new Map(state.rows.map((row) => [row.id, row]));
      for (const element of elements('[data-table-row]')) {
        const row = rows.get(element.dataset.tableRow!) ?? geometry?.getRowGeometry(element.dataset.tableRow!);
        setStyle(element, 'display', row ? '' : 'none');
        if (!row) continue;
        setStyle(element, 'top', numbers(row.top));
        setStyle(element, 'height', numbers(row.height));
        setStyle(element, 'width', width);
      }
      for (const element of elements('[data-table-line]')) {
        const row = rows.get(element.dataset.tableLine!) ?? geometry?.getRowGeometry(element.dataset.tableLine!);
        if (!row) continue;
        setStyle(element, 'height', numbers(row.contentHeight));
        setStyle(element, 'grid-template-columns', grid!);
      }
      for (const element of elements('[data-table-expanded]'))
        setStyle(
          element,
          'display',
          (rows.get(element.dataset.tableExpanded!) ?? geometry?.getRowGeometry(element.dataset.tableExpanded!))
            ?.expanded
            ? ''
            : 'none',
        );
    }

    let moved = false;
    if (placement) {
      if (floating) setStyle(placement.slot, 'height', numbers(state.headerHeight));
      const target = floating ? placement.portal : placement.slot;
      if (placement.mount.parentElement !== target) {
        const focused =
          document.activeElement instanceof HTMLElement && placement.mount.contains(document.activeElement)
            ? document.activeElement
            : undefined;
        target.appendChild(placement.mount);
        if (focused && document.activeElement !== focused) focused.focus({ preventScroll: true });
        moved = true;
      }
    }
    for (const layer of elements('[data-table-header-layer]')) {
      layer.dataset.tableHeaderPosition = floating ? 'portal' : 'flow';
      setStyle(layer, 'left', floating ? numbers(state.viewport.screenLeft - (state.viewport.originLeft ?? 0)) : '');
      setStyle(layer, 'top', floating ? numbers(state.viewport.top - (state.viewport.originTop ?? 0)) : '');
      setStyle(layer, 'width', floating ? numbers(state.viewport.width) : '');
      setStyle(layer, 'height', floating ? numbers(state.viewport.height) : '');
    }
    for (const layer of elements('[data-table-loading-layer]')) {
      setStyle(layer, 'left', numbers(state.viewport.screenLeft - (state.viewport.originLeft ?? 0)));
      setStyle(layer, 'top', numbers(state.viewport.top - (state.viewport.originTop ?? 0)));
      setStyle(layer, 'width', numbers(state.viewport.width));
      setStyle(layer, 'height', numbers(state.viewport.height));
    }
    for (const track of elements('[data-table-loading-track]')) {
      const top = empty ? Math.max(0, -state.viewport.scroll) : state.headerTop + state.headerHeight;
      setStyle(track, 'top', numbers(top));
      setStyle(track, 'visibility', state.error ? 'hidden' : '');
    }
    if (placement && !floating) setStyle(placement.slot, 'height', '');
    for (const header of elements('[data-table-header]')) {
      setStyle(header, 'width', width);
      if (grid !== undefined) setStyle(header, 'grid-template-columns', grid);
      setStyle(header, 'transform', floating ? `translateY(${numbers(state.headerTop)})` : '');
      header.dataset.dragging = String(state.dragging);
    }
    if (updateContent) {
      const columns = new Map(state.columns.map((column) => [column.id, column]));
      for (const element of elements('[data-column-id][data-column-region]')) {
        const column = columns.get(element.dataset.columnId!) ?? geometry?.getColumnGeometry(element.dataset.columnId!);
        setStyle(element, 'display', column ? '' : 'none');
        if (!column) continue;
        this.column(element, column, floating && element.getAttribute('role') === 'columnheader', state.columnCount);
      }
      this.content =
        revision !== undefined
          ? {
              root,
              revision,
              total: state.total,
              height: state.bodyHeight,
              container: state.viewport.container,
              viewportWidth: state.viewport.width,
              floating,
              empty,
            }
          : undefined;
    }
    for (const control of elements('[data-resize-column]')) {
      const id = control.dataset.resizeColumn!;
      const column = geometry?.getColumnGeometry(id) ?? state.columns.find((item) => item.id === id);
      if (!column) continue;
      const edge = column.displayOffset + (column.resizeEdge === 'right' ? column.width : 0);
      const left = column.left;
      const right = column.right && edge < state.viewport.width - 1e-7;
      setAttribute(control.querySelector('[data-direction="left"]'), 'data-available', String(left));
      setAttribute(control.querySelector('[data-direction="right"]'), 'data-available', String(right));
      setAttribute(control, 'aria-disabled', String(!left && !right));
      const description = `Влево ${left ? 'можно' : 'нельзя'}, вправо ${right ? 'можно' : 'нельзя'}. Двойной клик — сброс ширины`;
      setAttribute(control, 'aria-description', description);
      setAttribute(control, 'title', description);
    }
    return moved;
  }

  private column(element: HTMLElement, column: TableColumnGeometry, floating: boolean, count: number): void {
    element.dataset.columnRegion = column.region;
    if (element.getAttribute('role') === 'columnheader') element.dataset.resizeEdge = column.resizeEdge;
    const pinned = column.region !== 'center';
    // Header transforms isolate stacking: each handle must outpaint the cell across its edge.
    const order = column.region === 'right' ? column.index + 1 : count - column.index + 1;
    const stack = order + (pinned ? count : 0);
    setStyle(element, 'z-index', element.getAttribute('role') === 'columnheader' ? String(stack) : '');
    setStyle(element, 'grid-column', pinned && floating ? '' : String(column.index + 1));
    setStyle(element, 'position', pinned ? (floating ? 'absolute' : 'sticky') : '');
    setStyle(
      element,
      'left',
      pinned && floating
        ? numbers(column.displayOffset)
        : column.region === 'left'
          ? numbers(column.pinInset ?? 0)
          : '',
    );
    setStyle(element, 'right', pinned && !floating && column.region === 'right' ? numbers(column.pinInset ?? 0) : '');
    setStyle(element, 'top', pinned && floating ? numbers(0) : '');
    setStyle(element, 'bottom', pinned && floating ? numbers(0) : '');
    setStyle(element, 'width', pinned && floating ? numbers(column.width) : '');
  }
}
