const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('demo123', 10);

  console.log('Seeding demo accounts...');

  // 1. Create Elderly Users
  const kamlaUser = await prisma.user.upsert({
    where: { email: 'kamla@example.com' },
    update: {},
    create: {
      email: 'kamla@example.com',
      password: password,
      profile: {
        create: {
          firstName: 'Kamla',
          lastName: 'Devi',
          role: 'elderly',
          gender: 'female',
          languagePreference: 'hi',
          routinePreferences: JSON.stringify([
            { id: '1', title: 'Morning Walk', time: '07:00', type: 'activity', category: 'health', icon: 'Sun' },
            { id: '2', title: 'Breakfast & Meds', time: '08:30', type: 'meal', category: 'health', icon: 'Coffee' },
            { id: '3', title: 'Call Rahul', time: '18:00', type: 'social', category: 'family', icon: 'Phone' }
          ])
        }
      }
    },
    include: { profile: true }
  });

  const prakharUser = await prisma.user.upsert({
    where: { email: 'prakhar@example.com' },
    update: {},
    create: {
      email: 'prakhar@example.com',
      password: password,
      profile: {
        create: {
          firstName: 'Prakhar',
          lastName: 'Agarwal',
          role: 'elderly',
          gender: 'male',
          languagePreference: 'en',
          routinePreferences: JSON.stringify([
            { id: '1', title: 'Yoga', time: '06:30', type: 'activity', category: 'health', icon: 'Activity' },
            { id: '2', title: 'Breakfast', time: '08:00', type: 'meal', category: 'health', icon: 'Coffee' }
          ])
        }
      }
    },
    include: { profile: true }
  });

  const neutralElderly = await prisma.user.upsert({
    where: { email: 'neutral@example.com' },
    update: {},
    create: {
      email: 'neutral@example.com',
      password: password,
      profile: {
        create: {
          firstName: 'Alex',
          lastName: 'Smith',
          role: 'elderly',
          gender: 'neutral',
          languagePreference: 'en'
        }
      }
    },
    include: { profile: true }
  });

  // 2. Create Family Member
  const rahulUser = await prisma.user.upsert({
    where: { email: 'family@example.com' },
    update: {},
    create: {
      email: 'family@example.com',
      password: password,
      profile: {
        create: {
          firstName: 'Rahul',
          lastName: 'Sharma',
          role: 'family',
          gender: 'male'
        }
      }
    },
    include: { profile: true }
  });

  // 3. Create Caregiver
  const anitaUser = await prisma.user.upsert({
    where: { email: 'caregiver@example.com' },
    update: {},
    create: {
      email: 'caregiver@example.com',
      password: password,
      profile: {
        create: {
          firstName: 'Anita',
          lastName: 'Sharma',
          role: 'caregiver',
          gender: 'female'
        }
      }
    },
    include: { profile: true }
  });

  // 4. Create Healthcare Worker
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@example.com' },
    update: {},
    create: {
      email: 'doctor@example.com',
      password: password,
      profile: {
        create: {
          firstName: 'Demo',
          lastName: 'Doctor',
          role: 'healthcare',
          gender: 'neutral'
        }
      }
    },
    include: { profile: true }
  });

  // 5. Create Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: password,
      profile: {
        create: {
          firstName: 'System',
          lastName: 'Administrator',
          role: 'admin',
          gender: 'neutral'
        }
      }
    },
    include: { profile: true }
  });

  // 6. Establish Relationships
  // Rahul is family to Kamla
  const familyRel = await prisma.familyRelationship.findFirst({
    where: { elderlyId: kamlaUser.profile.id, familyMemberId: rahulUser.profile.id }
  });
  if (!familyRel) {
    await prisma.familyRelationship.create({
      data: {
        elderlyId: kamlaUser.profile.id,
        familyMemberId: rahulUser.profile.id,
        relationshipType: 'Grandson',
        canManageRoutines: true
      }
    });
    console.log('Created family relationship: Rahul -> Kamla');
  }

  // Anita is caregiver to Kamla
  const careRel = await prisma.caregiverAssignment.findFirst({
    where: { elderlyId: kamlaUser.profile.id, caregiverId: anitaUser.profile.id }
  });
  if (!careRel) {
    await prisma.caregiverAssignment.create({
      data: {
        elderlyId: kamlaUser.profile.id,
        caregiverId: anitaUser.profile.id
      }
    });
    console.log('Created caregiver assignment: Anita -> Kamla');
  }

  // 7. Seed some game data for Caregiver Dashboard testing
  const memoryMatch = await prisma.game.upsert({
    where: { id: 'memory-match' },
    update: {},
    create: { id: 'memory-match', name: 'Memory Match', gameType: 'cognitive' }
  });
  
  const spotDiff = await prisma.game.upsert({
    where: { id: 'spot-diff' },
    update: {},
    create: { id: 'spot-diff', name: 'Spot the Difference', gameType: 'cognitive' }
  });

  await prisma.gameSession.createMany({
    data: [
      { userId: kamlaUser.profile.id, gameId: 'memory-match', score: 100, difficulty: 1, completed: true, accuracy: 100 },
      { userId: kamlaUser.profile.id, gameId: 'spot-diff', score: 85, difficulty: 2, completed: true, accuracy: 90 },
      { userId: prakharUser.profile.id, gameId: 'memory-match', score: 120, difficulty: 3, completed: true, accuracy: 85 }
    ]
  });

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
