type Producer = {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  cover: string;
  location: string;
  rating: number;
  genres: string[];
  skills: string[];
  recentWorks: {
    title: string;
    artist: string;
    plays: number;
    image: string;
  }[];
  social: {
    followers: number;
    following: number;
    posts: number;
  };
  online: boolean;
  lastActive: string;
  featuredGear?: string[];
  bio?: string;
  credits?: string[];
  services?: {
    name: string;
    price: string;
    description: string;
  }[];
};

export const producerData: Producer[] = [
  {
    id: 1,
    name: "Alex BeatSmith",
    handle: "@beat_alchemist",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
    location: "Los Angeles, CA",
    rating: 4.9,
    genres: ["Hip Hop", "Trap", "R&B"],
    skills: ["Production", "Mixing", "Sound Design"],
    recentWorks: [
      {
        title: "Midnight Dreams",
        artist: "Luna Sky",
        plays: 1245000,
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
      },
      {
        title: "City Lights",
        artist: "Urban Flow",
        plays: 876000,
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
      },
    ],
    social: {
      followers: 12400,
      following: 560,
      posts: 243,
    },
    online: true,
    lastActive: "5 min ago",
    featuredGear: ["MPC Live", "Moog Subsequent", "Neumann U87"],
    bio: "Grammy-nominated producer specializing in hip hop and R&B. I've worked with major artists and love discovering new talent.",
    credits: ["Billboard Top 10 (2023)", "Platinum Record (2022)", "Producer of the Year Nominee (2021)"],
    services: [
      {
        name: "Beat Production",
        price: "$500",
        description: "Custom beat tailored to your style with 3 revisions"
      },
      {
        name: "Full Song Production",
        price: "$1500",
        description: "Complete production including mixing and mastering"
      },
      {
        name: "Mixing/Mastering",
        price: "$300",
        description: "Professional mixing and mastering for your track"
      }
    ]
  },
  {
    id: 2,
    name: "Sarah Synth",
    handle: "@sarahsynth",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad",
    location: "Brooklyn, NY",
    rating: 4.7,
    genres: ["Electronic", "Pop", "Experimental"],
    skills: ["Synthesis", "Arrangement", "Vocal Production"],
    recentWorks: [
      {
        title: "Neon Pulse",
        artist: "Sarah Synth",
        plays: 3200000,
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
      },
      {
        title: "Digital Love",
        artist: "Future Waves",
        plays: 1876000,
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
      },
    ],
    social: {
      followers: 18700,
      following: 320,
      posts: 156,
    },
    online: false,
    lastActive: "2 hours ago",
    featuredGear: ["Ableton Push", "Eurorack", "Prophet 6"],
    bio: "Passionate about modular synthesis and building futuristic soundscapes. Let’s push the boundaries of pop together.",
    credits: ["SXSW Performer (2022)", "SynthFest Featured Artist"],
    services: [
      {
        name: "Vocal Production",
        price: "$700",
        description: "Tuning, layering, and FX for polished vocals"
      },
      {
        name: "Experimental Soundtrack",
        price: "$1200",
        description: "Custom electronic score for games, ads, or films"
      }
    ]
  },
  {
    id: 3,
    name: "Marcus Beats",
    handle: "@marcusonthebeat",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    location: "Atlanta, GA",
    rating: 4.8,
    genres: ["Trap", "Drill", "Hip Hop"],
    skills: ["Beat Making", "Sampling", "808 Design"],
    recentWorks: [
      {
        title: "Atlanta Nights",
        artist: "Trapper King",
        plays: 5400000,
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
      },
      {
        title: "Drip Too Hard",
        artist: "Lil Wave",
        plays: 3200000,
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
      },
    ],
    social: {
      followers: 25600,
      following: 120,
      posts: 89,
    },
    online: true,
    lastActive: "Just now",
    featuredGear: ["FL Studio", "SP-404", "Komplete Kontrol"],
    bio: "Certified platinum beatmaker known for hard-hitting 808s and infectious trap melodies.",
    credits: ["BET Awards Producer Showcase", "Certified Gold Singles (x3)"],
    services: [
      {
        name: "Trap Beat Pack",
        price: "$300",
        description: "Pack of 3 exclusive beats for commercial use"
      },
      {
        name: "Sampling Session",
        price: "$400",
        description: "Live Zoom session creating samples based on your moodboard"
      }
    ]
  },
  {
    id: 4,
    name: "Jazz Keys",
    handle: "@jazzykeys",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    cover: "https://images.unsplash.com/photo-1501612780327-45045538702b",
    location: "Chicago, IL",
    rating: 4.6,
    genres: ["Jazz", "Soul", "Lo-fi"],
    skills: ["Keys", "Arrangement", "Live Recording"],
    recentWorks: [
      {
        title: "Sunday Morning",
        artist: "Jazz Keys Trio",
        plays: 870000,
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
      },
      {
        title: "Rainy Day",
        artist: "Soulful Sam",
        plays: 540000,
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
      },
    ],
    social: {
      followers: 9800,
      following: 450,
      posts: 312,
    },
    online: false,
    lastActive: "1 day ago",
    featuredGear: ["Rhodes", "Wurlitzer", "Hammond B3"],
    bio: "Jazz pianist and lo-fi producer blending soulful chords with chill textures. Perfect for storytelling.",
    credits: ["Lo-fi Jazz Playlist Curator", "Tiny Desk Submission Finalist"],
    services: [
      {
        name: "Lo-fi Instrumental",
        price: "$250",
        description: "Warm, jazzy instrumental ideal for background music or YouTube"
      },
      {
        name: "Live Piano Recording",
        price: "$400",
        description: "Studio-quality piano performance recorded live"
      }
    ]
  }
];
