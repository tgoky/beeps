// app/services/auditions/[type]/[id]/page.tsx
import SubmitAudition from '../../../show/[id]/page';
import { notFound } from 'next/navigation';
import type { AuditionBaseProps, AuditionSpecificFields, AuditionType } from '@/types/audition';

export default function AuditionPage({
  params
}: {
  params: { type: AuditionType; id: string }
}) {
  const getAuditionData = (): AuditionBaseProps & AuditionSpecificFields => {
    switch (params.type) {
      case 'artist':
        return {
          type: 'artist',
          jobTitle: 'Vocalist for R&B Project',
          clientName: 'Soulful Records',
          budget: '$2,000 - $5,000',
          deadline: 'July 15, 2023',
          requirements: [
            '5+ years vocal experience',
            'Ability to harmonize',
            'Studio recording capability'
          ],
          artist: {
            vocalRange: 'alto', // Changed from array to string
            performanceType: ['studio', 'live'],
            influences: ['Beyoncé', 'Alicia Keys']
          }
        };
      case 'producer':
        return {
          type: 'producer',
          jobTitle: 'Beat Producer for Hip Hop Album',
          clientName: 'Urban Records',
          budget: '$1,500 - $3,000 per track',
          deadline: 'June 30, 2023',
          requirements: [
            '3+ years professional production',
            'Strong hip hop understanding',
            'Vocal collaboration experience'
          ],
          producer: {
            genres: ['Hip Hop', 'Trap', 'R&B'],
            equipment: 'Professional DAW required'
          }
        };
      default:
        return notFound();
    }
  };

  const auditionData = getAuditionData();
  return <SubmitAudition {...auditionData} />;
}