import { describe, expect, it } from 'vitest'

describe('Site Access Guard Logic (Client Route & Portal)', () => {
  const masterUser = {
    loginId: 'master',
    role: 'admin',
    assignedSiteIds: [] as string[],
  }

  const workerUserWithSites = {
    loginId: 'worker1',
    role: 'worker',
    assignedSiteIds: ['site-tokyo', 'site-osaka'],
  }

  const workerUserNoSites = {
    loginId: 'worker2',
    role: 'worker',
    assignedSiteIds: [] as string[],
  }

  const adminUserWithSites = {
    loginId: 'admin1',
    role: 'admin',
    assignedSiteIds: ['site-tokyo'],
  }

  // auth.global.ts 内の現場アクセス判定ロジック
  const checkSiteRouteAccess = (
    user: { loginId: string, role: string, assignedSiteIds: string[] } | null,
    targetSiteId: string,
  ): { allowed: boolean, redirect?: string } => {
    if (!user) return { allowed: false, redirect: '/login' }

    const isMaster = user.loginId === 'master'
    const assignedIds = user.assignedSiteIds || []

    if (!isMaster && !assignedIds.includes(targetSiteId)) {
      return { allowed: false, redirect: '/portal' }
    }

    return { allowed: true }
  }

  // portal/index.vue 内の自動リダイレクト判定ロジック
  const getAutoRedirectTarget = (
    user: { loginId: string, role: string, assignedSiteIds: string[] } | null,
    allSites: { id: string }[],
    lastSiteId = '',
  ): string | null => {
    if (!user) return null

    const isMaster = user.loginId === 'master'
    const siteIds = user.assignedSiteIds || []

    // 1. master アカウントは全現場特権
    if (isMaster) {
      if (lastSiteId && allSites.some(s => s.id === lastSiteId)) {
        return `/portal/${lastSiteId}`
      }
      const firstSite = allSites[0]

      return firstSite ? `/portal/${firstSite.id}` : null
    }

    // 2. 一般ユーザー（非master）はアサイン現場がある場合のみ転送
    if (siteIds.length > 0) {
      const targetSiteId = siteIds.includes(lastSiteId)
        ? lastSiteId
        : siteIds[0]

      return `/portal/${targetSiteId}`
    }

    // 3. アサイン現場がない一般ユーザーはリダイレクトしない（未アサイン画面を表示）
    return null
  }

  describe('Route Guard (/portal/:siteId/...) Access Check', () => {
    it('master アカウントは未アサイン現場でもアクセスが許可されること', () => {
      expect(checkSiteRouteAccess(masterUser, 'site-tokyo').allowed).toBe(true)
      expect(checkSiteRouteAccess(masterUser, 'site-nagoya').allowed).toBe(true)
    })

    it('一般作業者はアサインされた現場のみ許可され、未アサイン現場は /portal にリダイレクトされること', () => {
      expect(checkSiteRouteAccess(workerUserWithSites, 'site-tokyo').allowed).toBe(true)
      expect(checkSiteRouteAccess(workerUserWithSites, 'site-osaka').allowed).toBe(true)

      const blocked = checkSiteRouteAccess(workerUserWithSites, 'site-nagoya')

      expect(blocked.allowed).toBe(false)
      expect(blocked.redirect).toBe('/portal')
    })

    it('アサイン現場が0件の一般作業者はどの現場へのアクセスも拒否され /portal にリダイレクトされること', () => {
      const blocked = checkSiteRouteAccess(workerUserNoSites, 'site-tokyo')

      expect(blocked.allowed).toBe(false)
      expect(blocked.redirect).toBe('/portal')
    })

    it('一般管理者（非masterのadmin）もアサイン現場のみに制限されること', () => {
      expect(checkSiteRouteAccess(adminUserWithSites, 'site-tokyo').allowed).toBe(true)

      const blocked = checkSiteRouteAccess(adminUserWithSites, 'site-osaka')

      expect(blocked.allowed).toBe(false)
      expect(blocked.redirect).toBe('/portal')
    })
  })

  describe('Portal Index Auto-Redirect Policy', () => {
    const allSites = [{ id: 'site-tokyo' }, { id: 'site-osaka' }]

    it('master は現場未アサインでも全現場リストから自動リダイレクトされること', () => {
      expect(getAutoRedirectTarget(masterUser, allSites)).toBe('/portal/site-tokyo')
      expect(getAutoRedirectTarget(masterUser, allSites, 'site-osaka')).toBe('/portal/site-osaka')
    })

    it('一般ユーザーでアサイン現場がある場合はその現場へリダイレクトされること', () => {
      expect(getAutoRedirectTarget(workerUserWithSites, allSites)).toBe('/portal/site-tokyo')
      expect(getAutoRedirectTarget(workerUserWithSites, allSites, 'site-osaka')).toBe('/portal/site-osaka')
      // アサイン外の lastSiteId は無視して最初のアサイン現場へ転送されること
      expect(getAutoRedirectTarget(workerUserWithSites, allSites, 'site-nagoya')).toBe('/portal/site-tokyo')
    })

    it('一般ユーザーでアサイン現場がない場合は勝手にリダイレクトせず null（未アサイン画面表示）となること', () => {
      expect(getAutoRedirectTarget(workerUserNoSites, allSites)).toBeNull()
      expect(getAutoRedirectTarget(workerUserNoSites, allSites, 'site-tokyo')).toBeNull()
    })
  })
})
