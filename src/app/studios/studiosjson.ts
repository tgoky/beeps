type Review = {
  user: string;
  avatar: string;
  rating: number;
  content: string;
  date: string;
};

type Studio = {
  id: number;
  name: string;
  location: string;
  price: string;
  rating: number;
  equipment: string[];
  image: string;
  lat: number;
  lon: number;
  description: string;
  amenities: string[];
  reviews: Review[];
  availableHours: string[];
  owner: string;
};
 
 export const studioData: Studio[] = [
  {
    id: 1,
    name: "Harmony Studios",
    location: "Los Angeles, CA",
    price: "$75/hr",
    rating: 4.8,
    equipment: ["Neve Console", "Pro Tools HD", "Vintage Mics"],
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
    lat: 34.0522,
    lon: -118.2437,
    description: "A state-of-the-art recording studio in the heart of Los Angeles.",
    amenities: ["Lounge Area", "Wi-Fi", "Parking"],
    reviews: [
      {
        user: "John Doe",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
        rating: 4.5,
        content: "Great studio with top-notch equipment!",
        date: "2025-10-01",
      },
    ],
    availableHours: ["09:00-11:00", "12:00-14:00", "15:00-17:00"],
    owner: "Studio Corp",
  },
  {
    id: 2,
    name: "Beat Factory",
    location: "Nashville, TN",
    price: "$60/hr",
    rating: 4.5,
    equipment: ["SSL Console", "Logic Pro", "Drum Room"],
    image: "https://images.unsplash.com/photo-1501612780327-45045538702b",
    lat: 36.1627,
    lon: -86.7816,
    description: "Perfect for country and rock recordings in Nashville.",
    amenities: ["Soundproof Room", "Coffee Machine", "Free Parking"],
    reviews: [
      {
        user: "Jane Smith",
        avatar: "https://randomuser.me/api/portraits/women/1.jpg",
        rating: 4.7,
        content: "Loved the vibe and professional setup.",
        date: "2025-09-15",
      },
    ],
    availableHours: ["10:00-12:00", "13:00-15:00", "16:00-18:00"],
    owner: "Beat Inc.",
  },
  {
    id: 3,
    name: "Vocal Booth Pro",
    location: "New York, NY",
    price: "$95/hr",
    rating: 4.9,
    equipment: ["Isolation Booth", "U87 Mic", "HD Monitoring"],
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    lat: 40.7128,
    lon: -74.0060,
    description: "Top-tier vocal recording studio in NYC.",
    amenities: ["High-Speed Wi-Fi", "Refreshments", "Comfortable Seating"],
    reviews: [
      {
        user: "Alice Brown",
        avatar: "https://randomuser.me/api/portraits/women/2.jpg",
        rating: 5.0,
        content: "Best vocal booth I've ever used!",
        date: "2025-11-10",
      },
    ],
    availableHours: ["08:00-10:00", "11:00-13:00", "14:00-16:00"],
    owner: "Vocal Pro LLC",
  },
  // Add similar data for IDs 4 and 5
  {
    id: 4,
    name: "Vocal Booth Pro",
    location: "New York, NY",
    price: "$95/hr",
    rating: 4.9,
    equipment: ["Isolation Booth", "U87 Mic", "HD Monitoring"],
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    lat: 40.7128,
    lon: -74.0060,
    description: "Another great vocal recording studio in NYC.",
    amenities: ["High-Speed Wi-Fi", "Refreshments", "Comfortable Seating"],
    reviews: [
      {
        user: "Bob Wilson",
        avatar: "https://randomuser.me/api/portraits/men/2.jpg",
        rating: 4.8,
        content: "Excellent service and equipment.",
        date: "2025-12-01",
      },
    ],
    availableHours: ["09:00-11:00", "12:00-14:00", "15:00-17:00"],
    owner: "Vocal Pro LLC",
  },
  {
    id: 5,
    name: "Vocal Booth Pro",
    location: "New York, NY",
    price: "$95/hr",
    rating: 4.9,
    equipment: ["Isolation Booth", "U87 Mic", "HD Monitoring"],
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    lat: 40.7128,
    lon: -74.0060,
    description: "Premium recording experience in NYC.",
    amenities: ["High-Speed Wi-Fi", "Refreshments", "Comfortable Seating"],
    reviews: [
      {
        user: "Emma Davis",
        avatar: "https://randomuser.me/api/portraits/women/3.jpg",
        rating: 4.9,
        content: "Fantastic studio, highly recommend!",
        date: "2025-12-15",
      },
    ],
    availableHours: ["10:00-12:00", "13:00-15:00", "16:00-18:00"],
    owner: "Vocal Pro LLC",
  },
];