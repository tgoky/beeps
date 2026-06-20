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
  priceRange?: string;
  previousCollabs: {
    id?: number;
    title: string;
    type: string;
    description: string;
    with: string;
    date: string;
    image: string;
  }[];
  reviews: {
    id?: number;
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
    label: 'Music Production',
    iconComponent: SoundOutlined,
  },
  {
    value: 'video',
    label: 'Video/Content',
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
    name: "Sarah Johnson",
    image: "https://i.pravatar.cc/300?img=1",
    bio: "Professional vocalist and songwriter with 10+ years of experience in R&B and Pop music. Known for powerful vocals and emotional delivery.",
    location: "Los Angeles, CA",
    rating: 4.8,
    responseTime: "24 hours",
    collabStyle: "Remote & In-person",
    priceRange: "$$ (Mid-range)",
    skills: ["Vocals", "Songwriting", "Harmonies", "Toplining"],
    specialties: {
      music: ["Pop", "R&B", "Soul", "Jazz"],
      video: ["Music Videos", "Performance Videos"],
      photo: ["Album Covers", "Promotional Shots"],
    },
    availability: {
      days: ["Monday", "Tuesday", "Thursday", "Friday"],
      timeRange: "10 AM - 6 PM PST",
    },
    previousCollabs: [
      {
        id: 101,
        title: "Summer Vibes EP",
        type: "Vocals",
        description: "Lead vocals on 5-track EP with electronic producer",
        with: "DJ Nexus",
        date: "2024-06-15",
        image: "https://i.pravatar.cc/150?img=5",
      },
      {
        id: 102,
        title: "Acoustic Sessions",
        type: "Songwriting",
        description: "Co-wrote and performed 3 acoustic tracks",
        with: "The Folk Collective",
        date: "2024-03-20",
        image: "https://i.pravatar.cc/150?img=6",
      },
      {
        id: 103,
        title: "Midnight Dreams",
        type: "Featured Artist",
        description: "Featured vocals on title track",
        with: "Luna Rose",
        date: "2024-01-10",
        image: "https://i.pravatar.cc/150?img=7",
      },
    ],
    reviews: [
      {
        id: 1001,
        user: "Marcus Chen",
        avatar: "https://i.pravatar.cc/150?img=12",
        rating: 5,
        content: "Sarah brought our track to life with her incredible vocals. Professional, easy to work with, and delivered exactly what we needed!",
        date: "2024-07-01",
      },
      {
        id: 1002,
        user: "Elena Rodriguez",
        avatar: "https://i.pravatar.cc/150?img=13",
        rating: 4.5,
        content: "Great collaboration experience. Sarah's creative input was invaluable.",
        date: "2024-05-15",
      },
    ],
  },
  {
    id: 2,
    name: "Mike Anderson",
    image: "https://i.pravatar.cc/300?img=2",
    bio: "Grammy-nominated producer specializing in Hip-Hop and Trap beats. Over 50 million streams across platforms.",
    location: "Atlanta, GA",
    rating: 4.9,
    responseTime: "12 hours",
    collabStyle: "Remote",
    priceRange: "$$$ (Premium)",
    skills: ["Production", "Mixing", "Beat Making", "Sound Design"],
    specialties: {
      music: ["Hip-Hop", "Trap", "R&B", "Drill"],
      video: ["Studio Sessions", "Production Tutorials"],
      photo: ["Studio Photography"],
    },
    availability: {
      days: ["Monday", "Wednesday", "Thursday", "Saturday"],
      timeRange: "2 PM - 10 PM EST",
    },
    previousCollabs: [
      {
        id: 201,
        title: "Street Symphony",
        type: "Production",
        description: "Produced full album for emerging artist",
        with: "Young Prophet",
        date: "2024-08-01",
        image: "https://i.pravatar.cc/150?img=8",
      },
      {
        id: 202,
        title: "Late Night Vibes",
        type: "Beat Making",
        description: "Created 10 exclusive beats for mixtape",
        with: "MC Smooth",
        date: "2024-04-25",
        image: "https://i.pravatar.cc/150?img=9",
      },
    ],
    reviews: [
      {
        id: 2001,
        user: "Jordan Taylor",
        avatar: "https://i.pravatar.cc/150?img=14",
        rating: 5,
        content: "Mike's production quality is top-tier. Worth every penny!",
        date: "2024-08-15",
      },
      {
        id: 2002,
        user: "Chris Williams",
        avatar: "https://i.pravatar.cc/150?img=15",
        rating: 5,
        content: "Amazing experience working with Mike. His beats are fire!",
        date: "2024-06-20",
      },
    ],
  },
  {
    id: 3,
    name: "Jessica Lee",
    image: "https://i.pravatar.cc/300?img=3",
    bio: "Award-winning videographer and director specializing in music videos and creative content. Known for unique visual storytelling.",
    location: "New York, NY",
    rating: 4.7,
    responseTime: "48 hours",
    collabStyle: "In-person preferred",
    priceRange: "$$-$$$",
    skills: ["Video Production", "Editing", "Color Grading", "Cinematography"],
    specialties: {
      music: [],
      video: ["Music Videos", "Documentaries", "Commercial Content", "Short Films"],
      photo: ["Portraits", "Event Photography"],
    },
    availability: {
      days: ["Tuesday", "Wednesday", "Friday", "Saturday"],
      timeRange: "9 AM - 7 PM EST",
    },
    previousCollabs: [
      {
        id: 301,
        title: "Urban Stories",
        type: "Music Video",
        description: "Directed and shot music video with 2M+ views",
        with: "The Underground Collective",
        date: "2024-05-10",
        image: "https://i.pravatar.cc/150?img=10",
      },
      {
        id: 302,
        title: "Behind the Music",
        type: "Documentary",
        description: "Mini-documentary series about local artists",
        with: "City Sounds Project",
        date: "2024-02-28",
        image: "https://i.pravatar.cc/150?img=11",
      },
    ],
    reviews: [
      {
        id: 3001,
        user: "Alex Rivera",
        avatar: "https://i.pravatar.cc/150?img=16",
        rating: 5,
        content: "Jessica's creative vision exceeded our expectations. The final video was stunning!",
        date: "2024-07-10",
      },
      {
        id: 3002,
        user: "Sam Mitchell",
        avatar: "https://i.pravatar.cc/150?img=17",
        rating: 4.5,
        content: "Professional and talented. Great to work with!",
        date: "2024-04-05",
      },
    ],
  },
];

// Utility function to find artist by ID
export const getArtistById = (id: number): Artist | undefined => {
  return artistData.find((artist) => artist.id === id);
};