export type TFormattedInputMaskTokenKind = 'literal' | 'separator' | 'slot';

export interface IFormattedInputMaskSlotRule {
  readonly name: string;

  accepts(char: string): boolean;
}

export type TFormattedInputMaskSlotRuleSource = IFormattedInputMaskSlotRule | RegExp;

interface IFormattedInputMaskTokenStyleOptions {
  readonly className?: string;
}

export interface IFormattedInputMaskLiteralToken {
  readonly type: 'literal';
  readonly char: string;
  readonly className?: string;
}

export interface IFormattedInputMaskSeparatorToken {
  readonly type: 'separator';
  readonly char: string;
  readonly className?: string;
}

export interface IFormattedInputMaskSlotToken {
  readonly type: 'slot';
  readonly className?: string;
  readonly placeholder: string;
  readonly rule: IFormattedInputMaskSlotRule;
  readonly placeholderClassName?: string;
  readonly valueClassName?: string;
}

export interface IFormattedInputMaskSlotTokenOptions extends IFormattedInputMaskTokenStyleOptions {
  readonly type: 'slot';
  readonly placeholder: string;
  readonly rule: TFormattedInputMaskSlotRuleSource;
  readonly placeholderClassName?: string;
  readonly valueClassName?: string;
}

export type TFormattedInputMaskToken =
  | IFormattedInputMaskLiteralToken
  | IFormattedInputMaskSeparatorToken
  | IFormattedInputMaskSlotToken;

export type TFormattedInputMaskTokenOptions =
  | IFormattedInputMaskLiteralToken
  | IFormattedInputMaskSeparatorToken
  | IFormattedInputMaskSlotTokenOptions;

export interface IFormattedInputMaskConfigOptions {
  mask: readonly TFormattedInputMaskTokenOptions[];
}

export interface IFormattedInputMaskRegExpRuleOptions {
  name: string;
  pattern: RegExp;
}

export interface IFormattedInputMaskCharSetRuleOptions {
  chars: readonly string[];
  name: string;
}

export class FormattedInputMaskRegExpRule implements IFormattedInputMaskSlotRule {
  readonly name: string;
  private readonly _pattern: RegExp;

  constructor(options: IFormattedInputMaskRegExpRuleOptions) {
    this.name = options.name;
    this._pattern = new RegExp(options.pattern.source, options.pattern.flags.replace(/[gy]/g, ''));
  }

  accepts(char: string): boolean {
    return char.length === 1 && this._pattern.test(char);
  }
}

export class FormattedInputMaskCharSetRule implements IFormattedInputMaskSlotRule {
  readonly name: string;
  private readonly _chars: readonly string[];

  constructor(options: IFormattedInputMaskCharSetRuleOptions) {
    this.name = options.name;
    this._chars = options.chars;
  }

  accepts(char: string): boolean {
    return char.length === 1 && this._chars.includes(char);
  }
}

export class FormattedInputMaskConfig {
  readonly tokens: readonly TFormattedInputMaskToken[];

  constructor(options: IFormattedInputMaskConfigOptions) {
    this.tokens = options.mask.map((token) => this._createToken(token));
  }

  getRawCapacity(): number {
    let capacity = 0;

    for (const token of this.tokens) {
      if (token.type !== 'separator') {
        capacity++;
      }
    }

    return capacity;
  }

  getSlotCapacity(): number {
    let capacity = 0;

    for (const token of this.tokens) {
      if (token.type === 'slot') {
        capacity++;
      }
    }

    return capacity;
  }

  private _createToken(token: TFormattedInputMaskTokenOptions): TFormattedInputMaskToken {
    if (token.type !== 'slot') {
      return token;
    }

    return {
      type: token.type,
      className: token.className,
      placeholder: token.placeholder,
      placeholderClassName: token.placeholderClassName,
      rule: this._createRule(token.rule),
      valueClassName: token.valueClassName,
    };
  }

  private _createRule(rule: TFormattedInputMaskSlotRuleSource): IFormattedInputMaskSlotRule {
    if (!(rule instanceof RegExp)) {
      return rule;
    }

    return new FormattedInputMaskRegExpRule({
      name: rule.source,
      pattern: rule,
    });
  }
}

export const FORMATTED_INPUT_MASK_DIGIT_RULE = new FormattedInputMaskRegExpRule({
  name: 'digit',
  pattern: /\d/,
});
