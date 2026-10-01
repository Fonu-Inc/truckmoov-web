import {
  CITIES_BY_STATE, NIGERIAN_STATES,
} from "@truckmoov/api/auth";

it(
  "lists LGAs for every API state, 774 in all",
  () => {
    for (const state of NIGERIAN_STATES) {
      expect(
        CITIES_BY_STATE[state],
        state,
      ).not.toHaveLength(0);
    }
    expect(Object.values(CITIES_BY_STATE).flat()).toHaveLength(774);
  },
);
