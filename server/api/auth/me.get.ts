import { defineEventHandler } from 'h3'

import { requireAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)

  return { success: true, user }
})
