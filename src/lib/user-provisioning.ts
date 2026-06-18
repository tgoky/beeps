// src/lib/user-provisioning.ts
import type { UserRole } from '@prisma/client';

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    ARTIST: 'an Artist',
    PRODUCER: 'a Producer',
    STUDIO_OWNER: 'a Studio Owner',
    GEAR_SALES: 'a Gear Specialist',
    LYRICIST: 'a Lyricist',
    OTHER: 'a Music Enthusiast'
  };
  return labels[role] || 'a Member';
}

export async function createRoleProfile(
  tx: any,
  userId: string,
  role: UserRole,
  data: any // using any/Partial here so it's flexible for both registration shapes
) {
  switch (role) {
    case 'ARTIST':
      await tx.artistProfile.create({
        data: {
          userId,
          genres: data.genres || [],
          skills: data.specialties || [],
          socialLinks: data.socialLinks || {}
        }
      });
      break;

    case 'PRODUCER':
      await tx.producerProfile.create({
        data: {
          userId,
          genres: data.genres || [],
          specialties: data.specialties || [],
          equipment: data.equipment || [],
          experience: data.experience,
          productionRate: data.hourlyRate,
          availability: data.hasStudio ? 'Available - Own studio' : 'Available for projects'
        }
      });

      if (data.hasStudio) {
        await tx.studioOwnerProfile.create({
          data: {
            userId,
            studioName: data.studioName || `${data.fullName}'s Studio`,
            capacity: data.capacity,
            equipment: data.equipment || [],
            hourlyRate: data.hourlyRate
          }
        });
      }
      break;

    case 'STUDIO_OWNER':
      await tx.studioOwnerProfile.create({
        data: {
          userId,
          studioName: data.studioName || `${data.fullName}'s Studio`,
          capacity: data.capacity,
          equipment: data.equipment || [],
          hourlyRate: data.hourlyRate
        }
      });
      break;

    case 'GEAR_SALES':
      await tx.gearSalesProfile.create({
        data: {
          userId,
          businessName: data.businessName || `${data.fullName}'s Gear`,
          specialties: data.specialties || [],
          inventory: data.inventory
        }
      });
      break;

    case 'LYRICIST':
      await tx.lyricistProfile.create({
        data: {
          userId,
          genres: data.genres || [],
          writingStyle: data.writingStyle,
          collaborationStyle: data.collaborationStyle,
          portfolio: data.portfolio
        }
      });
      break;

    case 'OTHER':
      break;
  }
}