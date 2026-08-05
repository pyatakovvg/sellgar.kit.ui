import React from 'react';

export type TTabMenuSize = 'lg' | 'md' | 'sm';
export type TTabMenuShape = 'rounded' | 'pill';
export type TTabMenuVariant = 'fill' | 'line' | 'segmented';

interface IRootContext {
  activeTabName?: string;
  getPanelId(tabName: string): string;
  getTabId(tabName: string): string;
  setActiveTabName(tabName: string): void;
}

interface IVariantContext {
  shape: TTabMenuShape;
  size: TTabMenuSize;
  variant: TTabMenuVariant;
}

const rootContext = React.createContext<IRootContext | null>(null);
const variantContext = React.createContext<IVariantContext | null>(null);

export const TabMenuRootProvider = rootContext.Provider;
export const TabMenuVariantProvider = variantContext.Provider;

export const useTabMenuRootContext = (): IRootContext => {
  const value = React.useContext(rootContext);

  if (value === null) {
    throw new Error('TabMenu parts must be rendered inside TabMenu.');
  }

  return value;
};

export const useTabMenuVariantContext = (): IVariantContext => {
  const value = React.useContext(variantContext);

  if (value === null) {
    throw new Error('TabMenu.Tab must be rendered inside TabMenu variant.');
  }

  return value;
};
