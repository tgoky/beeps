// Database seed file
// Run with: npx prisma db seed

import { PrismaClient, UserRole, ClubType, BeatType } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo users with different roles
  const demoUsers = [
    {
      email: 'artist@beeps.com',
      username: 'alex_melody',
      password: await hash('demo123', 10),
      fullName: 'Alex Melody',
      role: UserRole.ARTIST,
      verified: true,
      location: 'Los Angeles, CA',
      bio: 'Professional vocalist and songwriter. Creating hits since 2015.',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      email: 'producer@beeps.com',
      username: 'beat_smith',
      password: await hash('demo123', 10),
      fullName: 'Sarah BeatSmith',
      role: UserRole.PRODUCER,
      verified: true,
      location: 'Atlanta, GA',
      bio: 'Grammy-nominated producer specializing in trap and hip hop.',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
      email: 'studio@beeps.com',
      username: 'sound_studios',
      password: await hash('demo123', 10),
      fullName: 'Marcus Studio',
      role: UserRole.STUDIO_OWNER,
      verified: true,
      location: 'New York, NY',
      bio: 'Owner of premium recording studio in Manhattan.',
      avatar: 'https://randomuser.me/api/portraits/men/55.jpg'
    }
  ];

  console.log('📝 Creating demo users...');
  const createdUsers = [];

  for (const userData of demoUsers) {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        supabaseId: `demo_${userData.username}`, // Will be replaced with real Supabase ID
        fullName: userData.fullName,
        primaryRole: userData.role,
        verified: userData.verified,
        location: userData.location,
        bio: userData.bio,
        avatar: userData.avatar
      }
    });

    // Create role-specific profiles
    switch (userData.role) {
      case UserRole.ARTIST:
        await prisma.artistProfile.create({
          data: {
            userId: user.id,
            genres: ['Pop', 'R&B', 'Hip Hop'],
            skills: ['Vocalist', 'Songwriter'],
            socialLinks: {
              instagram: 'alexmelody',
              spotify: 'alexmelody'
            }
          }
        });
        break;

      case UserRole.PRODUCER:
        await prisma.producerProfile.create({
          data: {
            userId: user.id,
            genres: ['Hip Hop', 'Trap', 'R&B'],
            specialties: ['Beat Making', 'Mixing', 'Mastering'],
            equipment: ['Ableton Live', 'Neumann U87', 'Apollo Twin'],
            experience: '10+ years',
            productionRate: '$500-$1000',
            mixingRate: '$200-$400',
            availability: 'Available for projects'
          }
        });
        break;

      case UserRole.STUDIO_OWNER:
        await prisma.studioOwnerProfile.create({
          data: {
            userId: user.id,
            studioName: 'Sound Studios NYC',
            capacity: '8 people',
            equipment: ['SSL Console', 'Pro Tools HDX', 'Neumann U87'],
            hourlyRate: '$150'
          }
        });
        break;
    }

    createdUsers.push(user);
    console.log(`✅ Created user: ${user.username} (${userData.role})`);
  }

  // Create demo clubs
  console.log('\n🏢 Creating demo clubs...');
  const artistUser = createdUsers[0];
  const producerUser = createdUsers[1];

  const demoClubs = [
    {
      name: 'Studio Alpha',
      type: ClubType.RECORDING,
      description: 'Professional recording studio for all genres',
      icon: '🎵',
      ownerId: artistUser.id
    },
    {
      name: 'Beat Lab',
      type: ClubType.PRODUCTION,
      description: 'Beat production and mixing services',
      icon: '🎚️',
      ownerId: producerUser.id
    }
  ];

  for (const clubData of demoClubs) {
    const club = await prisma.club.create({
      data: clubData
    });

    // Add owner as member
    await prisma.clubMember.create({
      data: {
        clubId: club.id,
        userId: clubData.ownerId,
        role: 'OWNER'
      }
    });

    console.log(`✅ Created club: ${club.name} (${clubData.type})`);
  }

  // Create demo beats
  console.log('\n🎵 Creating demo beats...');
  const beats = [
    {
      title: 'Midnight Dreams',
      description: 'Dark trap beat with heavy 808s',
      producerId: producerUser.id,
      bpm: 140,
      key: 'F Minor',
      price: 49.99,
      type: BeatType.LEASE,
      genres: ['Hip Hop', 'Trap'],
      moods: ['Dark', 'Aggressive'],
      tags: ['808', 'Hard', 'Trap'],
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
      audioUrl: 'https://example.com/beats/midnight-dreams.mp3'
    },
    {
      title: 'Summer Vibes',
      description: 'Upbeat pop instrumental with tropical feel',
      producerId: producerUser.id,
      bpm: 120,
      key: 'C Major',
      price: 79.99,
      type: BeatType.EXCLUSIVE,
      genres: ['Pop', 'Electronic'],
      moods: ['Happy', 'Energetic'],
      tags: ['Summer', 'Dance', 'Pop'],
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
      audioUrl: 'https://example.com/beats/summer-vibes.mp3'
    }
  ];

  for (const beatData of beats) {
    await prisma.beat.create({
      data: beatData
    });
    console.log(`✅ Created beat: ${beatData.title}`);
  }

  // Create demo studios
  console.log('\n🎙️ Creating demo studios...');
  const studioOwnerProfile = await prisma.studioOwnerProfile.findUnique({
    where: { userId: createdUsers[2].id }
  });

  if (studioOwnerProfile) {
    const studios = [
      {
        name: 'Sound Studios NYC',
        description: 'Professional recording studio in Manhattan',
        ownerId: studioOwnerProfile.id,
        location: 'New York, NY',
        latitude: 40.7282,
        longitude: -73.9942,
        hourlyRate: 150,
        equipment: ['SSL Console', 'Pro Tools HDX', 'Neumann U87', 'Avalon VT-737'],
        capacity: '8 people',
        imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04',
        rating: 4.9
      }
    ];

    for (const studioData of studios) {
      await prisma.studio.create({
        data: studioData
      });
      console.log(`✅ Created studio: ${studioData.name}`);
    }
  }

  // Create follow relationships
  console.log('\n👥 Creating follow relationships...');
  await prisma.follow.create({
    data: {
      followerId: artistUser.id,
      followingId: producerUser.id
    }
  });
  console.log(`✅ ${artistUser.username} follows ${producerUser.username}`);

  // Update follower counts
  await prisma.user.update({
    where: { id: artistUser.id },
    data: { followingCount: 1 }
  });
  await prisma.user.update({
    where: { id: producerUser.id },
    data: { followersCount: 1 }
  });

  console.log('\n✨ Database seed completed successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('  Artist: artist@beeps.com / demo123');
  console.log('  Producer: producer@beeps.com / demo123');
  console.log('  Studio Owner: studio@beeps.com / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });