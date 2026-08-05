export type TFormattedInputDomStyle = Record<string, number | string | null | undefined>;

const toCssPropertyName = (propertyName: string): string => {
  if (propertyName.startsWith('--')) {
    return propertyName;
  }

  return propertyName.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
};

export const applyFormattedInputDomStyle = (element: HTMLElement, style: TFormattedInputDomStyle): void => {
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) {
      continue;
    }

    element.style.setProperty(toCssPropertyName(key), String(value));
  }
};
