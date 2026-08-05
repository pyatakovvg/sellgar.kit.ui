import type { FormattedInputPluginContext, IFormattedInputPlugin } from './plugin';

export class FormattedInputPluginPipeline {
  private readonly _plugins: readonly IFormattedInputPlugin[];

  constructor(plugins: readonly IFormattedInputPlugin[] = []) {
    this._plugins = [...plugins].sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));
  }

  execute(context: FormattedInputPluginContext): FormattedInputPluginContext {
    let current = context;

    for (const plugin of this._plugins) {
      current = plugin.execute(current);

      if (current.isHandled()) {
        break;
      }
    }

    return current;
  }
}
