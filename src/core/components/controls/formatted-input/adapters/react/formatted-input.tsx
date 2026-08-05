import React from 'react';
import cn from 'classnames';

import { FormattedInputBrowserEditor } from '../../browser';

import type { IFormattedInputBrowserChangeMeta, IFormattedInputInstance } from '../../browser';
import type { IFormattedInputPlugin } from '../../plugins';

import s from './default.module.scss';

interface IFormattedInputChangeMeta extends IFormattedInputBrowserChangeMeta {}

type TFormattedInputAutoCapitalize = 'characters' | 'none' | 'off' | 'on' | 'sentences' | 'words';
type TFormattedInputAutoCorrect = 'off' | 'on';
type TFormattedInputEnterKeyHint = 'done' | 'enter' | 'go' | 'next' | 'previous' | 'search' | 'send';
type TFormattedInputInputMode = React.HTMLAttributes<HTMLSpanElement>['inputMode'];
type TFormattedInputSpellCheck = boolean | 'false' | 'true';

export interface IFormattedInputProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'children'
  | 'defaultValue'
  | 'enterKeyHint'
  | 'inputMode'
  | 'onChange'
  | 'spellCheck'
> {
  autoCapitalize?: TFormattedInputAutoCapitalize;
  autoCorrect?: TFormattedInputAutoCorrect;
  disabled?: boolean;
  enterKeyHint?: TFormattedInputEnterKeyHint;
  inputMode?: TFormattedInputInputMode;
  onChange?: (value: string, meta: IFormattedInputChangeMeta) => void;
  placeholder?: string;
  plugins?: readonly IFormattedInputPlugin[];
  readOnly?: boolean;
  ref?: React.Ref<IFormattedInputInstance>;
  spellCheck?: TFormattedInputSpellCheck;
  value: string;
}

const classNames = {
  root: s.root,
  display: s.display,
  line: s.line,
  token: s.token,
  symbolLayer: s.symbolLayer,
  placeholder: s.placeholder,
};

export const FormattedInput: React.FC<IFormattedInputProps> = ({
  ref,
  value,
  onChange,
  className,
  autoCapitalize,
  autoCorrect,
  autoFocus,
  disabled,
  enterKeyHint,
  inputMode,
  placeholder,
  plugins,
  readOnly,
  spellCheck,
  ...props
}) => {
  const rootRef = React.useRef<HTMLSpanElement | null>(null);
  const editorRef = React.useRef<FormattedInputBrowserEditor | null>(null);

  const setRootRef = React.useCallback((node: HTMLSpanElement | null) => {
    rootRef.current = node;
  }, []);

  React.useLayoutEffect(() => {
    const root = rootRef.current;

    if (!root || editorRef.current) {
      return;
    }

    editorRef.current = new FormattedInputBrowserEditor({
      root,
      value,
      placeholder,
      autoCapitalize,
      autoCorrect,
      autoFocus,
      disabled,
      enterKeyHint,
      readOnly,
      inputMode,
      onChange,
      plugins,
      spellCheck,
      classNames,
    });

    return () => {
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []);

  React.useLayoutEffect(() => {
    if (typeof ref === 'function') {
      ref(editorRef.current);

      return () => {
        ref(null);
      };
    }

    if (ref) {
      ref.current = editorRef.current;

      return () => {
        ref.current = null;
      };
    }

    return void 0;
  }, [ref]);

  React.useLayoutEffect(() => {
    editorRef.current?.update({
      value,
      placeholder,
      autoCapitalize,
      autoCorrect,
      disabled,
      enterKeyHint,
      readOnly,
      inputMode,
      onChange,
      plugins,
      spellCheck,
    });
  }, [
    value,
    placeholder,
    autoCapitalize,
    autoCorrect,
    disabled,
    enterKeyHint,
    readOnly,
    inputMode,
    onChange,
    plugins,
    spellCheck,
  ]);

  return <span {...props} ref={setRootRef} className={cn(s.root, className)} />;
};
