import { describe, it, expect } from 'vitest'
import { getPostLoginRedirectPath } from './authRedirect'

describe('getPostLoginRedirectPath', () => {
  it('redirects ENTERPRISE_ADMIN to /enterprise', () => {
    expect(getPostLoginRedirectPath('ENTERPRISE_ADMIN')).toBe('/enterprise')
  })

  it('redirects AGGREGATOR_ADMIN to /aggregator', () => {
    expect(getPostLoginRedirectPath('AGGREGATOR_ADMIN')).toBe('/aggregator')
  })

  it('redirects OWNER_OPERATOR to /owner-operator', () => {
    expect(getPostLoginRedirectPath('OWNER_OPERATOR')).toBe('/owner-operator')
  })

  it('redirects FLEET_ADMIN to /admin', () => {
    expect(getPostLoginRedirectPath('FLEET_ADMIN')).toBe('/admin')
  })

  it('redirects OPERATIONS_MANAGER to /admin', () => {
    expect(getPostLoginRedirectPath('OPERATIONS_MANAGER')).toBe('/admin')
  })

  it('redirects DISPATCHER to /dispatcher', () => {
    expect(getPostLoginRedirectPath('DISPATCHER')).toBe('/dispatcher')
  })

  it('redirects FINANCE_VIEWER to /admin/fleet?tab=analytics', () => {
    expect(getPostLoginRedirectPath('FINANCE_VIEWER')).toBe('/admin/fleet?tab=analytics')
  })

  it('falls back to /admin for SUPER_ADMIN', () => {
    expect(getPostLoginRedirectPath('SUPER_ADMIN')).toBe('/admin')
  })

  it('falls back to /admin for SYSTEM_ADMIN', () => {
    expect(getPostLoginRedirectPath('SYSTEM_ADMIN')).toBe('/admin')
  })

  it('falls back to /admin for PLATFORM_ADMIN', () => {
    expect(getPostLoginRedirectPath('PLATFORM_ADMIN')).toBe('/admin')
  })
})
