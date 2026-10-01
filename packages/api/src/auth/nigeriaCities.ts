import type { NigerianState } from './types'

import { all } from 'nigerian-states-and-lgas'

import { NIGERIAN_STATES } from './types'

// ponytail: the package spells these two states differently from the API enum.
const PACKAGE_STATE: Partial<Record<NigerianState, string>> = {
  FCT: 'Federal Capital Territory',
  Katsina: 'Kastina',
}

/** All 774 LGAs per state, keyed by the API's state name. */
export const CITIES_BY_STATE = Object.fromEntries(
  NIGERIAN_STATES.map(state => [
    state,
    all().find(entry => entry.state === (PACKAGE_STATE[state] ?? state))?.lgas ?? [],
  ]),
) as Record<string, string[]>
