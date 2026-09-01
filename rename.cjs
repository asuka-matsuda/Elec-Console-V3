const fs = require('fs')

fs.renameSync('app/components/features/PortalSiteCalendar.client.vue', 'app/components/features/SiteCalendar.client.vue')
fs.renameSync('app/components/features/PortalSiteCalendarEventDateInput.vue', 'app/components/features/SiteCalendarDateInput.vue')
