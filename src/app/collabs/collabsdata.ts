// collabsData.ts
import dayjs from 'dayjs';
import { SoundOutlined, VideoCameraOutlined, PictureOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

export interface Artist {
  id: number;
  name: string;
  image: string;
  bio: string;
  location: string;
  rating: number;
  skills: string[];
  specialties: {
    music: string[];
    video: string[];
    photo: string[];
  };
  availability: {
    days: string[];
    timeRange: string;
  };
  responseTime: string;
  collabStyle: string;
  priceRange: string;
  previousCollabs: {
    id: number;
    title: string;
    type: string;
    description: string;
    with: string;
    date: string;
    image: string;
  }[];
  reviews: {
    id: number;
    user: string;
    avatar: string;
    rating: number;
    content: string;
    date: string;
  }[];
}

export interface CollabType {
  value: string;
  label: string;
  iconComponent: typeof SoundOutlined; // Store the component reference
}

export const collabTypes: CollabType[] = [
  {
    value: 'music',
    label: 'Music Collaboration',
    iconComponent: SoundOutlined,
  },
  {
    value: 'video',
    label: 'Video Project',
    iconComponent: VideoCameraOutlined,
  },
  {
    value: 'photo',
    label: 'Photography',
    iconComponent: PictureOutlined,
  },
];

export const artistData: Artist[] = [
  {
    id: 1,
    name: 'Alex Johnson',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Professional music producer and multi-instrumentalist with 10 years of experience in the industry. Specialized in electronic, pop, and hip-hop production.',
    location: 'Los Angeles, CA',
    rating: 4.8,
    skills: ['Production', 'Mixing', 'Guitar', 'Songwriting'],
    specialties: {
      music: ['EDM', 'Pop', 'Hip-Hop', 'R&B'],
      video: ['Music Videos', 'Lyric Videos'],
      photo: ['Album Art', 'Promotional Photos'],
    },
    availability: {
      days: ['Monday', 'Wednesday', 'Friday'],
      timeRange: '10:00 AM - 6:00 PM',
    },
    responseTime: '24 hours',
    collabStyle: 'Remote or in-person (LA area)',
    priceRange: '$$ (Mid-range)',
    previousCollabs: [
      {
        id: 101,
        title: 'Summer Vibes EP',
        type: 'Music Production',
        description: 'Co-produced a 5-track EP with indie artist Maya Wells',
        with: 'Maya Wells',
        date: '2023-05-15',
        image: 'https://source.unsplash.com/random/300x300/?album,cover',
      },
      {
        id: 102,
        title: 'Urban Dreams Music Video',
        type: 'Video Production',
        description: 'Directed and edited music video for up-and-coming rapper',
        with: 'DJ Metro',
        date: '2023-02-10',
        image: 'https://source.unsplash.com/random/300x300/?music,video',
      },
    ],
    reviews: [
      {
        id: 1001,
        user: 'Sarah Miller',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        rating: 5,
        content:
          'Alex is an incredible collaborator. His production skills brought my songs to ',
        date: '2023-06-20',
      },
      {
        id: 1002,
        user: 'Carlos Rodriguez',
        avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
        rating: 4.5,
        content:
          'Great attention to detail and very professional. The mix he delivered was radio-ready. Will definitely work with him again.',
        date: '2023-04-15',
      },
    ],
  },
  {
    id: 2,
    name: 'Taylor Smith',
    image: 'https://randomuser.me/api/portraits/women/63.jpg',
    bio: 'Award-winning vocalist and songwriter with a passion for creating emotional, powerful music across genres.',
    location: 'Nashville, TN',
    rating: 4.9,
    skills: ['Vocals', 'Songwriting', 'Lyrics', 'Harmony'],
    specialties: {
      music: ['Country', 'Pop', 'Folk', 'Soul'],
      video: ['Live Sessions', 'Acoustic Performances'],
      photo: ['Artist Portraits', 'Live Shots'],
    },
    availability: {
      days: ['Tuesday', 'Thursday', 'Saturday'],
      timeRange: '12:00 PM - 8:00 PM',
    },
    responseTime: '12 hours',
    collabStyle: 'Remote preferred',
    priceRange: '$$$ (Premium)',
    previousCollabs: [
      {
        id: 201,
        title: 'Heartstrings Album',
        type: 'Vocals',
        description: 'Featured vocalist on 3 tracks for indie country album',
        with: 'The Wildflowers',
        date: '2023-07-01',
        image: 'https://source.unsplash.com/random/300x300/?country,music',
      },
      {
        id: 202,
        title: 'City Lights Single',
        type: 'Songwriting',
        description: 'Co-wrote lyrics and melody for pop artist',
        with: 'Emma Clarke',
        date: '2023-03-18',
        image: 'https://source.unsplash.com/random/300x300/?pop,music',
      },
    ],
    reviews: [
      {
        id: 2001,
        user: 'Jamie Wilson',
        avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
        rating: 5,
        content:
          'Taylor',
        date: '2023-08-05',
      },
      {
        id: 2002,
        user: 'Marcus Lee',
        avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
        rating: 5,
        content:
          'One of the best songwriters ',
        date: '2023-05-22',
      },
    ],
  },
  {
    id: 3,
    name: 'Jordan Chen',
    image: 'https://randomuser.me/api/portraits/men/75.jpg',
    bio: 'Creative director and videographer specializing in music visuals and artistic storytelling through film.',
    location: 'New York, NY',
    rating: 4.7,
    skills: ['Videography', 'Editing', 'Directing', 'Cinematography'],
    specialties: {
      music: ['Music Videos', 'Visual Albums'],
      video: ['Short Films', 'Documentaries'],
      photo: ['Conceptual Photography', 'Behind-the-Scenes'],
    },
    availability: {
      days: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
      timeRange: '9:00 AM - 5:00 PM',
    },
    responseTime: '48 hours',
    collabStyle: 'In-person (NYC area) or remote planning',
    priceRange: '$$-$$$',
    previousCollabs: [
      {
        id: 301,
        title: 'Neon Dreams MV',
        type: 'Video Direction',
        description: 'Directed and edited psychedelic music video for electronic artist',
        with: 'Neon Wave',
        date: '2023-06-10',
        image: 'https://source.unsplash.com/random/300x300/?music,video,neon',
      },
      {
        id: 302,
        title: 'Urban Stories Documentary',
        type: 'Cinematography',
        description: 'Lead cinematographer for indie music documentary series',
        with: 'Pulse Media',
        date: '2023-01-15',
        image: 'https://source.unsplash.com/random/300x300/?documentary,film',
      },
    ],
    reviews: [
      {
        id: 3001,
        user: 'Aisha Brown',
        avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
        rating: 4.5,
        content:
          'Jordan has an incredible eye for visuals. He took our simple concept and turned it into a stunning music video.',
        date: '2023-07-18',
      },
      {
        id: 3002,
        user: 'Daniel Kim',
        avatar: 'https://randomuser.me/api/portraits/men/36.jpg',
        rating: 5,
        content:
          'Professional, creative, and easy to work with. The final product exceeded all our expectations.',
        date: '2023-04-30',
      },
    ],
  },
];

// Utility function to find artist by ID
export const getArtistById = (id: number): Artist | undefined => {
  return artistData.find((artist) => artist.id === id);
};