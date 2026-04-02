import { DEFAULT_STATE, type NagatoroState, type Mood } from "./_types";

export const ALL_MOODS: Mood[] = [
  "teasing", "smug", "jealous", "flustered",
  "bored", "serious", "happy", "laughing",
];

export function makeState(overrides?: Partial<NagatoroState>): NagatoroState {
  return { ...DEFAULT_STATE, ...overrides };
}

export function savedState(mockSaveState: { mock: { calls: unknown[][] } }): NagatoroState {
  return mockSaveState.mock.calls[0][0] as NagatoroState;
}
