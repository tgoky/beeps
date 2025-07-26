
// src/data/writers.ts
export interface Writer {
  id: number;
  name: string;
  image?: string;
  rating: number;
  reviews: number;
  location: string;
  bio: string;
  skills: string[];
  specialties: string[];
  languages: string[];
  education: string;
  experience: number;
  rate: string;
  deliveryTime: string;
  samples: Array<{
    title: string;
    type: string;
    description: string;
    date: string;
  }>;
  reviewsList: Array<{
    user: string;
    avatar: string;
    rating: number;
    content: string;
    date: string;
  }>;
}

export const writers: Writer[] = [
  {
    id: 1,
    name: "John Doe",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", // Ensure this file exists in public/images
    rating: 4.5,
    reviews: 120,
    location: "New York, USA",
    bio: "John is an experienced writer specializing in tech and lifestyle content, with a knack for creating engaging and SEO-optimized articles.",
    skills: ["SEO", "Content Writing", "Editing", "Proofreading"],
    specialties: ["Tech", "Lifestyle", "Business"],
    languages: ["English", "Spanish"],
    education: "BA in Journalism, NYU",
    experience: 5,
    rate: "$50/hour",
    deliveryTime: "3-5 days",
    samples: [
      {
        title: "The Future of AI",
        type: "Article",
        description: "An in-depth exploration of emerging AI trends and their impact on industries.",
        date: "2024-01-15",
      },
      {
        title: "Sustainable Living Guide",
        type: "Blog Post",
        description: "A practical guide to adopting eco-friendly habits in daily life.",
        date: "2023-11-20",
      },
    ],
    reviewsList: [
      {
        user: "Jane Smith",
        avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        rating: 5,
        content: "John delivered an exceptional article ahead of schedule. Highly recommend!",
        date: "2024-02-10",
      },
      {
        user: "Mike Johnson",
        avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        rating: 4.5,
        content: "Great work, very professional and detailed.",
        date: "2023-12-05",
      },
    ],
  },
  {
    id: 2,
    name: "Sarah Williams",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    rating: 4.8,
    reviews: 85,
    location: "London, UK",
    bio: "Sarah is a creative writer with a passion for storytelling and a strong background in scriptwriting and novels.",
    skills: ["Creative Writing", "Scriptwriting", "Storytelling"],
    specialties: ["Fiction", "Screenplays", "Creative Nonfiction"],
    languages: ["English", "French"],
    education: "MA in Creative Writing, University of Oxford",
    experience: 7,
    rate: "$60/hour",
    deliveryTime: "5-7 days",
    samples: [
      {
        title: "A Journey Through Time",
        type: "Short Story",
        description: "A captivating tale of time travel and self-discovery.",
        date: "2024-03-10",
      },
    ],
    reviewsList: [
      {
        user: "Emma Brown",
        avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        rating: 5,
        content: "Sarah's storytelling is phenomenal. The script was perfect!",
        date: "2024-04-01",
      },
    ],
  },
  // Add more writers as needed
  {
    id: 3,
    name: "David Chen",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    rating: 4.7,
    reviews: 95,
    location: "Toronto, Canada",
    bio: "David is a results-driven copywriter who crafts compelling content for SaaS, marketing, and e-commerce brands.",
    skills: ["Copywriting", "Content Strategy", "Blogging", "Email Marketing"],
    specialties: ["Marketing", "SaaS", "E-commerce"],
    languages: ["English", "Mandarin"],
    education: "B.Comm in Marketing, University of Toronto",
    experience: 6,
    rate: "$55/hour",
    deliveryTime: "2-4 days",
    samples: [
      {
        title: "5 Strategies to Boost Your Online Sales",
        type: "Blog Post",
        description: "Actionable tips for e-commerce businesses to increase conversion rates.",
        date: "2024-02-25",
      },
      {
        title: "Welcome Email Sequence",
        type: "Email Copy",
        description: "A 5-part email sequence designed to onboard and engage new software users.",
        date: "2024-01-30",
      },
    ],
    reviewsList: [
      {
        user: "Chloe Kim",
        avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        rating: 5,
        content: "David's copy was exactly what our brand needed. Clear, concise, and persuasive.",
        date: "2024-03-15",
      },
    ],
  },
  {
    id: 4,
    name: "Maria Garcia",
    image: "https://images.pexels.com/photos/774095/pexels-photo-774095.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    rating: 4.9,
    reviews: 150,
    location: "Madrid, Spain",
    bio: "With a PhD in Biomedical Sciences, Maria specializes in technical and academic writing, making complex topics accessible and clear.",
    skills: ["Technical Writing", "Research", "Academic Editing", "Grant Writing"],
    specialties: ["White Papers", "Scientific Journals", "Medical Writing"],
    languages: ["Spanish", "English"],
    education: "PhD in Biomedical Sciences, University of Barcelona",
    experience: 10,
    rate: "$75/hour",
    deliveryTime: "7-10 days",
    samples: [
      {
        title: "The Role of CRISPR in Modern Genetics",
        type: "White Paper",
        description: "A comprehensive overview of CRISPR-Cas9 technology and its applications.",
        date: "2023-12-18",
      },
    ],
    reviewsList: [
      {
        user: "Dr. Alan Grant",
        avatar: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        rating: 5,
        content: "Maria's work is impeccable. Her attention to detail and understanding of scientific concepts is top-tier.",
        date: "2024-01-20",
      },
      {
        user: "BioTech Inc.",
        avatar: "https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        rating: 4.8,
        content: "Very professional and delivered a high-quality research paper on a tight deadline.",
        date: "2023-11-10",
      },
    ],
  },
  {
    id: 5,
    name: "James Mwangi",
    image: "https://images.pexels.com/photos/837358/pexels-photo-837358.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    rating: 4.6,
    reviews: 70,
    location: "Nairobi, Kenya",
    bio: "James is a social media whiz, helping brands grow their online presence with snappy, engaging, and on-trend content.",
    skills: ["Social Media Management", "Copywriting", "Brand Voice Development"],
    specialties: ["Instagram Content", "Twitter Threads", "LinkedIn Posts"],
    languages: ["English", "Swahili"],
    education: "BA in Communications, University of Nairobi",
    experience: 4,
    rate: "$40/hour",
    deliveryTime: "1-2 days",
    samples: [
      {
        title: "Eco-Friendly Product Launch",
        type: "Instagram Campaign",
        description: "A series of 10 posts and stories for a sustainable brand's new product line.",
        date: "2024-04-05",
      },
    ],
    reviewsList: [
      {
        user: "Amina Yusuf",
        avatar: "https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        rating: 5,
        content: "Our social media engagement has skyrocketed since we started working with James!",
        date: "2024-04-12",
      },
      {
        user: "Tom Clark",
        avatar: "https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        rating: 4.5,
        content: "Fast, creative, and really understands our brand voice. Great to work with.",
        date: "2024-03-22",
      },
    ],
  },
];
