import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const doctor = await prisma.user.findUnique({
    where: { email: 'doctor@example.com' },
    include: { profile: true }
  });
  const kamla = await prisma.user.findUnique({
    where: { email: 'kamla@example.com' },
    include: { profile: true }
  });

  if (doctor && kamla && doctor.profile && kamla.profile) {
    const existing = await prisma.caregiverAssignment.findFirst({
      where: { caregiverId: doctor.profile.id, elderlyId: kamla.profile.id }
    });
    if (!existing) {
      await prisma.caregiverAssignment.create({
        data: {
          caregiverId: doctor.profile.id,
          elderlyId: kamla.profile.id,
          permissions: '{"view_activity": true, "manage_routines": false, "manage_reminders": false}'
        }
      });
      console.log("Assigned Doctor to Kamla");
    } else {
      console.log("Assignment already exists");
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
