import { prisma } from '../src/lib/prisma'

async function main() {
  // Check if default Inbox list exists
  const existingInbox = await prisma.list.findFirst({
    where: { isDefault: true }
  })

  if (!existingInbox) {
    await prisma.list.create({
      data: {
        name: 'Inbox',
        color: '#3b82f6', // blue
        emoji: '📥',
        isDefault: true
      }
    })
    console.log('Created default Inbox list')
  } else {
    console.log('Default Inbox list already exists')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })