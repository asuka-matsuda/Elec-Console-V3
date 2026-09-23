const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  const dataDir = path.resolve(__dirname, '../server/data')

  // 1. マスター管理者の初期ブートストラップ（未存在時のみ作成し、既存データは一切上書きしない）
  const usersPath = path.join(dataDir, 'users.json')

  if (fs.existsSync(usersPath)) {
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'))
    const masterDef = users.find(u => u.loginId === 'master')

    if (masterDef) {
      const existingMaster = await prisma.user.findUnique({
        where: { loginId: 'master' },
      })

      if (!existingMaster) {
        await prisma.user.create({
          data: {
            id: masterDef.id || undefined,
            loginId: masterDef.loginId,
            password: masterDef.password,
            firstName: masterDef.firstName,
            lastName: masterDef.lastName,
            firstNameKana: masterDef.firstNameKana,
            lastNameKana: masterDef.lastNameKana,
            role: masterDef.role || 'admin',
            requirePasswordReset: masterDef.requirePasswordReset || false,
            email: masterDef.email || null,
            isActive: masterDef.isActive !== false,
            createdAt: masterDef.createdAt ? new Date(masterDef.createdAt) : new Date(),
          },
        })
        console.log('[Seed] Initial master administrator created successfully.')
      }
      else {
        console.log('[Seed] Master administrator already exists. Preserving existing record.')
      }
    }
  }

  // ※本番稼働中の既存現場、ユーザー、回路、お知らせ、更新履歴等のデータは保護のため一切変更・削除しません。
  console.log('[Seed] Database initialization verified. Zero production records modified.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
