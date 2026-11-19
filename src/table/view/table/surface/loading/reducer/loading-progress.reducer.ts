export interface ProgressState {
  readonly value: number;
  readonly visible: boolean;
  readonly cycle: number;
}

type ProgressEvent =
  { type: 'start' } | { type: 'advance' } | { type: 'tick'; value: number } | { type: 'finish' } | { type: 'hide' };

export const loadingProgressReducer = (state: ProgressState, event: ProgressEvent): ProgressState => {
  switch (event.type) {
    case 'start':
      return { value: 0, visible: true, cycle: state.cycle + 1 };
    case 'advance': {
      if (!state.visible || state.value >= 99) return state;
      let increment = 0.25;
      if (state.value < 50) increment = 10;
      else if (state.value < 80) increment = 5;
      else if (state.value < 95) increment = 1;
      return { ...state, value: Math.min(99, state.value + increment) };
    }
    case 'tick':
      return { ...state, value: Math.max(state.value, event.value) };
    case 'finish':
      return state.visible ? { ...state, value: 100 } : state;
    case 'hide':
      return state.visible ? { ...state, visible: false } : state;
  }
};
