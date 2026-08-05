export type TFormattedInputCssVars = Record<`--${string}`, string>;

export interface IFormattedInputInlineStyleConfig {
  color?: string;
  fontSize?: string;
  fontWeight?: string | number;
  letterSpacing?: string;
}

export interface IFormattedInputStyleConfig {
  className?: string;
  cssVars?: TFormattedInputCssVars;
  inlineStyle?: IFormattedInputInlineStyleConfig;
}

export const EMPTY_FORMATTED_INPUT_STYLE: IFormattedInputStyleConfig = {};

export const mergeFormattedInputStyle = (
  base: IFormattedInputStyleConfig = EMPTY_FORMATTED_INPUT_STYLE,
  override: IFormattedInputStyleConfig = EMPTY_FORMATTED_INPUT_STYLE,
): IFormattedInputStyleConfig => ({
  className: override.className ?? base.className,
  cssVars: {
    ...base.cssVars,
    ...override.cssVars,
  },
  inlineStyle: {
    ...base.inlineStyle,
    ...override.inlineStyle,
  },
});
