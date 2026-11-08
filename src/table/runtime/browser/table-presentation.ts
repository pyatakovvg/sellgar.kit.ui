import { numbers } from './numbers';

import type { TableColumnGeometry, TableSnapshot } from '../types';

const setStyle = (element: HTMLElement, property: string, value: string): void => {
  if (element.style.getPropertyValue(property) !== value) element.style.setProperty(property, value);
};

export interface HeaderPlacement {
  readonly mount: HTMLElement;
  readonly slot: HTMLElement;
  readonly portal: HTMLElement;
}

/** Owns geometric DOM properties. It never renders content or calculates layout. */
export class TablePresentation {
  apply(root: HTMLElement, surface: HTMLElement, state: TableSnapshot, placement?: HeaderPlacement): boolean {
    const own = (element: Element) => element.closest('[data-table="geometry"]') === root;
    const elements = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(own);
    const width = numbers(state.total);
    const grid = state.widths.map(numbers).join(' ');
    setStyle(surface, 'width', numbers(Math.max(state.total, state.viewport.container)));
    root.dataset.dragging = String(state.dragging);
    root.dataset.pinning = state.pinning?.status ?? '';
    root.dataset.totalWidth = String(state.total);
    root.dataset.containerWidth = String(state.viewport.container);
    for (const body of elements('[data-table-body]')) {
      setStyle(body, 'height', numbers(state.bodyHeight));
      setStyle(body, 'width', width);
    }

    const rows = new Map(state.rows.map((row) => [row.id, row]));
    for (const element of elements('[data-table-row]')) {
      const row = rows.get(element.dataset.tableRow!);
      setStyle(element, 'display', row ? '' : 'none');
      if (!row) continue;
      setStyle(element, 'top', numbers(row.top));
      setStyle(element, 'height', numbers(row.height));
      setStyle(element, 'width', width);
    }
    for (const element of elements('[data-table-line]')) {
      const row = rows.get(element.dataset.tableLine!);
      if (!row) continue;
      setStyle(element, 'height', numbers(row.contentHeight));
      setStyle(element, 'grid-template-columns', grid);
    }
    for (const element of elements('[data-table-expanded]'))
      setStyle(element, 'display', rows.get(element.dataset.tableExpanded!)?.expanded ? '' : 'none');

    const floating = Boolean(placement && state.headerFloating && !state.error);
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
    if (placement && !floating) setStyle(placement.slot, 'height', '');
    for (const header of elements('[data-table-header]')) {
      setStyle(header, 'width', width);
      setStyle(header, 'grid-template-columns', grid);
      setStyle(header, 'transform', floating ? `translateY(${numbers(state.headerTop)})` : '');
      header.dataset.dragging = String(state.dragging);
    }
    const columns = new Map(state.columns.map((column) => [column.id, column]));
    for (const element of elements('[data-column-id][data-column-region]')) {
      const column = columns.get(element.dataset.columnId!);
      setStyle(element, 'display', column ? '' : 'none');
      if (!column) continue;
      this.column(element, column, floating && element.getAttribute('role') === 'columnheader');
    }
    return moved;
  }

  private column(element: HTMLElement, column: TableColumnGeometry, floating: boolean): void {
    element.dataset.columnRegion = column.region;
    const pinned = column.region !== 'center';
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
