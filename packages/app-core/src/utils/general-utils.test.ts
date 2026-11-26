import { expect, it } from 'vitest'
import { safeReturnPath } from './general-utils'

it('accepts only same-origin app paths as a return target', () => {
  expect(safeReturnPath('/fleet/violations?tab=open')).toBe('/fleet/violations?tab=open')
  expect(safeReturnPath('//evil.com')).toBeNull()
  expect(safeReturnPath('/\\evil.com')).toBeNull()
  expect(safeReturnPath('https://evil.com')).toBeNull()
  expect(safeReturnPath('/auth')).toBeNull()
  expect(safeReturnPath('/Auth/forgot-password')).toBeNull()
  expect(safeReturnPath('/auth?x=1')).toBeNull()
  expect(safeReturnPath('/a\u0000b')).toBeNull()
  expect(safeReturnPath(undefined)).toBeNull()
})
