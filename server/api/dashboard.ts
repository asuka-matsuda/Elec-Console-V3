import { defineEventHandler } from 'h3'

import announcements from '../data/announcements.json'
import history from '../data/history.json'

export default defineEventHandler(() => {
  return {
    announcements,
    history,
  }
})
