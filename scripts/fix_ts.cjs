const fs = require('fs')
const path = require('path')

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')

  // Fix 'sid implicitly any' and 'id implicitly any'
  content = content.replace(/\(body\.assignedSiteIds \|\| \[\]\)\.map\(sid =>/g, '(body.assignedSiteIds || []).map((sid: string) =>')
  content = content.replace(/\(body\.assignedSiteIds \|\| \[\]\)\.map\(id =>/g, '(body.assignedSiteIds || []).map((id: string) =>')

  // Fix delete operand by using destructuring
  // Pattern 1:
  // const safeUser = { ...user, assignedSiteIds };
  // delete safeUser.password;
  // delete safeUser.assignedSites;
  content = content.replace(
    /const safeUser = \{ \.\.\.(.+?), assignedSiteIds \};\s*delete safeUser\.password;\s*delete safeUser\.assignedSites;/g,
    `const { password, assignedSites, ...restUser } = $1;\n  const safeUser = { ...restUser, assignedSiteIds };`,
  )

  fs.writeFileSync(filePath, content)
}

const files = [
  'server/api/auth/login.post.ts',
  'server/api/auth/me.get.ts',
  'server/api/users/index.get.ts',
  'server/api/users/index.post.ts',
  'server/api/users/[id].put.ts',
]

for (const file of files) {
  fixFile(path.resolve(__dirname, file))
}
