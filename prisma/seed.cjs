const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  const dataDir = path.resolve(__dirname, '../server/data')

  // Sites
  if (fs.existsSync(path.join(dataDir, 'sites.json'))) {
    const sites = JSON.parse(fs.readFileSync(path.join(dataDir, 'sites.json'), 'utf8'))

    for (const site of sites) {
      await prisma.site.upsert({
        where: { id: site.id },
        update: {},
        create: {
          id: site.id,
          name: site.name,
          status: site.status,
          createdAt: site.createdAt ? new Date(site.createdAt) : new Date(),
          disabledAt: site.disabledAt ? new Date(site.disabledAt) : null,
        },
      })
    }
  }

  // Users
  if (fs.existsSync(path.join(dataDir, 'users.json'))) {
    const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'))

    for (const user of users) {
      await prisma.user.upsert({
        where: { loginId: user.loginId },
        update: {},
        create: {
          id: user.id || undefined,
          loginId: user.loginId,
          password: user.password || 'dummy_password',
          firstName: user.firstName,
          lastName: user.lastName,
          firstNameKana: user.firstNameKana,
          lastNameKana: user.lastNameKana,
          role: user.role,
          requirePasswordReset: user.requirePasswordReset || false,
          email: user.email,
          isActive: user.isActive !== false,
          lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
          assignedSites: {
            connect: (user.assignedSiteIds || []).map(id => ({ id })),
          },
        },
      })
    }
  }

  // Site Settings
  if (fs.existsSync(path.join(dataDir, 'site-settings.json'))) {
    const settings = JSON.parse(fs.readFileSync(path.join(dataDir, 'site-settings.json'), 'utf8'))

    for (const setting of settings) {
      await prisma.siteSettings.upsert({
        where: { siteId: setting.siteId },
        update: {},
        create: {
          siteId: setting.siteId,
          phase2ThresholdMegOhm: setting.phase2ThresholdMegOhm,
          enablePhase3: setting.enablePhase3,
        },
      })
    }
  }

  // Calendar Settings
  if (fs.existsSync(path.join(dataDir, 'calendar-settings.json'))) {
    const calSettings = JSON.parse(fs.readFileSync(path.join(dataDir, 'calendar-settings.json'), 'utf8'))

    for (const setting of calSettings) {
      await prisma.calendarSettings.upsert({
        where: { siteId: setting.siteId },
        update: {},
        create: {
          siteId: setting.siteId,
          eventTypes: JSON.stringify(setting.eventTypes || []),
          holidayDays: JSON.stringify(setting.holidayDays || []),
          customHolidays: JSON.stringify(setting.customHolidays || []),
        },
      })
    }
  }

  // Announcements
  if (fs.existsSync(path.join(dataDir, 'announcements.json'))) {
    await prisma.announcement.deleteMany()
    const announcements = JSON.parse(fs.readFileSync(path.join(dataDir, 'announcements.json'), 'utf8'))

    for (const ann of announcements) {
      await prisma.announcement.create({
        data: {
          title: ann.title,
          date: ann.date,
          desc: ann.desc,
        },
      })
    }
  }

  // History
  if (fs.existsSync(path.join(dataDir, 'history.json'))) {
    await prisma.history.deleteMany()
    const histories = JSON.parse(fs.readFileSync(path.join(dataDir, 'history.json'), 'utf8'))

    for (const hist of histories) {
      await prisma.history.create({
        data: {
          version: hist.version,
          title: hist.title,
          date: hist.date,
          desc: hist.desc,
          status: hist.status,
        },
      })
    }
  }

  // Events
  if (fs.existsSync(path.join(dataDir, 'events.json'))) {
    const events = JSON.parse(fs.readFileSync(path.join(dataDir, 'events.json'), 'utf8'))

    for (const event of events) {
      // 外部キー制約違反を避けるため、サイトが存在するか確認
      const site = await prisma.site.findUnique({ where: { id: event.siteId } })

      if (site) {
        await prisma.event.create({
          data: {
            id: event.id || undefined,
            siteId: event.siteId,
            title: event.title,
            start: event.start,
            end: event.end,
            allDay: event.allDay || false,
            type: event.type,
          },
        })
      }
    }
  }

  console.log('Migration from JSON to SQLite completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
