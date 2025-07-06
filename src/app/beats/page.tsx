"use client";

import { useState } from "react";
import { Card, Tag, Button, Input, Select, Tabs, Avatar, List, Badge, Divider } from "antd";
import { SearchOutlined, FilterOutlined, HeartOutlined, HeartFilled, ShoppingCartOutlined, PlayCircleOutlined, PauseOutlined, EllipsisOutlined, FireOutlined, RiseOutlined, DollarOutlined } from "@ant-design/icons";

const { Meta } = Card;
const { Option } = Select;
const { TabPane } = Tabs;

type Beat = {
  id: number;
  title: string;
  producer: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  bpm: number;
  price: number;
  genre: string[];
  mood: string[];
  plays: number;
  likes: number;
  liked: boolean;
  image: string;
  audio: string;
  type: 'lease' | 'exclusive';
  date: string;
};

type Activity = {
  id: number;
  user: {
    name: string;
    avatar: string;
  };
  action: 'purchased' | 'liked' | 'uploaded';
  beat: string;
  time: string;
};

// Mock data
const beatData: Beat[] = [
  {
    id: 1,
    title: "Midnight Dreams",
    producer: {
      name: "Alex BeatSmith",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      verified: true,
    },
    bpm: 140,
    price: 49.99,
    genre: ["Hip Hop", "Trap"],
    mood: ["Dark", "Aggressive"],
    plays: 124500,
    likes: 2450,
    liked: false,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
    audio: "https://example.com/beat1.mp3",
    type: 'lease',
    date: '2 hours ago'
  },
  {
    id: 2,
    title: "Neon Lights",
    producer: {
      name: "Sarah Synth",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      verified: true,
    },
    bpm: 95,
    price: 79.99,
    genre: ["Pop", "Electronic"],
    mood: ["Energetic", "Bright"],
    plays: 87600,
    likes: 1890,
    liked: true,
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
    audio: "https://example.com/beat2.mp3",
    type: 'exclusive',
    date: '1 day ago'
  },
  {
    id: 3,
    title: "Atlanta Nights",
    producer: {
      name: "Marcus Beats",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
      verified: false,
    },
    bpm: 150,
    price: 29.99,
    genre: ["Trap", "Drill"],
    mood: ["Hard", "Street"],
    plays: 320000,
    likes: 5400,
    liked: false,
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    audio: "https://example.com/beat3.mp3",
    type: 'lease',
    date: '3 days ago'
  },
  {
    id: 4,
    title: "Sunday Morning",
    producer: {
      name: "Jazz Keys",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      verified: true,
    },
    bpm: 85,
    price: 59.99,
    genre: ["Jazz", "Lo-fi"],
    mood: ["Chill", "Smooth"],
    plays: 87000,
    likes: 3200,
    liked: false,
    image: "https://images.unsplash.com/photo-1501612780327-45045538702b",
    audio: "https://example.com/beat4.mp3",
    type: 'lease',
    date: '1 week ago'
  },
];

const activityData: Activity[] = [
  {
    id: 1,
    user: {
      name: "Trapper King",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg"
    },
    action: 'purchased',
    beat: "Midnight Dreams",
    time: "5 min ago"
  },
  {
    id: 2,
    user: {
      name: "Luna Sky",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg"
    },
    action: 'liked',
    beat: "Neon Lights",
    time: "25 min ago"
  },
  {
    id: 3,
    user: {
      name: "Alex BeatSmith",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    action: 'uploaded',
    beat: "City Dreams",
    time: "1 hour ago"
  },
  {
    id: 4,
    user: {
      name: "Urban Flow",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg"
    },
    action: 'purchased',
    beat: "Atlanta Nights",
    time: "2 hours ago"
  },
];

export default function BeatMarketplace() {
  const [activeTab, setActiveTab] = useState("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedMood, setSelectedMood] = useState("all");
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [beats, setBeats] = useState<Beat[]>(beatData);

  const toggleLike = (id: number) => {
    setBeats(beats.map(beat => 
      beat.id === id ? { ...beat, liked: !beat.liked, likes: beat.liked ? beat.likes - 1 : beat.likes + 1 } : beat
    ));
  };

  const togglePlay = (id: number) => {
    setCurrentlyPlaying(currentlyPlaying === id ? null : id);
  };

  const filteredBeats = beats.filter(beat => {
    const matchesSearch = beat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         beat.producer.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "all" || beat.genre.includes(selectedGenre);
    const matchesMood = selectedMood === "all" || beat.mood.includes(selectedMood);
    return matchesSearch && matchesGenre && matchesMood;
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Beat Marketplace</h1>
            <p className="text-gray-600">Discover and license premium beats from top producers</p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search beats, producers..."
              prefix={<SearchOutlined />}
              className="w-full md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select
              placeholder="All Genres"
              className="w-full md:w-[180px]"
              value={selectedGenre}
              onChange={(value) => setSelectedGenre(value)}
            >
              <Option value="all">All Genres</Option>
              <Option value="Hip Hop">Hip Hop</Option>
              <Option value="Trap">Trap</Option>
              <Option value="Pop">Pop</Option>
              <Option value="Electronic">Electronic</Option>
              <Option value="R&B">R&B</Option>
              <Option value="Drill">Drill</Option>
              <Option value="Jazz">Jazz</Option>
              <Option value="Lo-fi">Lo-fi</Option>
            </Select>
            <Select
              placeholder="All Moods"
              className="w-full md:w-[180px]"
              value={selectedMood}
              onChange={(value) => setSelectedMood(value)}
            >
              <Option value="all">All Moods</Option>
              <Option value="Dark">Dark</Option>
              <Option value="Aggressive">Aggressive</Option>
              <Option value="Energetic">Energetic</Option>
              <Option value="Bright">Bright</Option>
              <Option value="Hard">Hard</Option>
              <Option value="Street">Street</Option>
              <Option value="Chill">Chill</Option>
              <Option value="Smooth">Smooth</Option>
            </Select>
            <Button type="primary" icon={<FilterOutlined />}>
              Filters
            </Button>
          </div>

          {/* Tabs */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            className="mb-6"
            tabBarExtraContent={
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Sort by:</span>
                <Select defaultValue="popular" bordered={false} className="w-32">
                  <Option value="popular">Most Popular</Option>
                  <Option value="newest">Newest</Option>
                  <Option value="price-low">Price: Low to High</Option>
                  <Option value="price-high">Price: High to Low</Option>
                </Select>
              </div>
            }
          >
            <TabPane tab={<span><FireOutlined /> Trending</span>} key="trending" />
            <TabPane tab={<span><RiseOutlined /> New Releases</span>} key="new" />
            <TabPane tab={<span><DollarOutlined /> Deals</span>} key="deals" />
          </Tabs>

          {/* Beats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBeats.map((beat) => (
              <Card
                key={beat.id}
                hoverable
                className="relative"
                cover={
                  <div className="relative group">
                    <img 
                      alt={beat.title} 
                      src={beat.image} 
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => togglePlay(beat.id)}
                        className="bg-white/20 backdrop-blur-sm rounded-full p-3 text-white hover:scale-110 transition-transform"
                      >
                        {currentlyPlaying === beat.id ? (
                          <PauseOutlined className="text-2xl" />
                        ) : (
                          <PlayCircleOutlined className="text-2xl" />
                        )}
                      </button>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Tag color={beat.type === 'exclusive' ? "gold" : "blue"} className="font-medium">
                        {beat.type === 'exclusive' ? "EXCLUSIVE" : "LEASE"}
                      </Tag>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
                      {beat.bpm} BPM
                    </div>
                  </div>
                }
              >
                <Meta
                  title={
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-lg">{beat.title}</span>
                      <span className="font-bold text-lg">${beat.price}</span>
                    </div>
                  }
                  description={
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar src={beat.producer.avatar} size="small" />
                        <span className="text-sm">{beat.producer.name}</span>
                        {beat.producer.verified && (
                          <span className="text-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {beat.genre.map((g, i) => (
                          <Tag key={i} className="text-xs">{g}</Tag>
                        ))}
                        {beat.mood.map((m, i) => (
                          <Tag key={`m-${i}`} color="purple" className="text-xs">{m}</Tag>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>
                            <PlayCircleOutlined className="mr-1" />
                            {formatNumber(beat.plays)}
                          </span>
                          <button 
                            onClick={() => toggleLike(beat.id)}
                            className="flex items-center hover:text-red-500"
                          >
                            {beat.liked ? (
                              <HeartFilled className="mr-1 text-red-500" />
                            ) : (
                              <HeartOutlined className="mr-1" />
                            )}
                            {formatNumber(beat.likes)}
                          </button>
                        </div>
                        <span>{beat.date}</span>
                      </div>
                    </div>
                  }
                />
                
                <div className="mt-4 flex gap-2">
                  <Button 
                    type="primary" 
                    block 
                    icon={<ShoppingCartOutlined />}
                    className="flex items-center justify-center"
                  >
                    Add to Cart
                  </Button>
                  <Button 
                    icon={<EllipsisOutlined />}
                    className="flex items-center justify-center"
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Sidebar */}
      <div className="w-80 border-l border-gray-200 hidden xl:block p-6 bg-gray-50 overflow-y-auto">
        <div className="sticky top-6">
          <h2 className="text-lg font-bold mb-4">Marketplace Activity</h2>
          
          <div className="space-y-4">
            {activityData.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors">
                <Avatar src={activity.user.avatar} />
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{activity.user.name}</span> {activity.action} 
                    <span className="font-medium"> {activity.beat}</span>
                  </div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
                {activity.action === 'purchased' && (
                  <Tag color="green" className="text-xs">Purchase</Tag>
                )}
                {activity.action === 'liked' && (
                  <Tag color="red" className="text-xs">Like</Tag>
                )}
                {activity.action === 'uploaded' && (
                  <Tag color="blue" className="text-xs">New</Tag>
                )}
              </div>
            ))}
          </div>

          <Divider className="my-6" />

          <div>
            <h3 className="font-bold mb-3">Top Producers</h3>
            <List
              dataSource={beats.slice(0, 5).map(b => b.producer)}
              renderItem={(producer) => (
                <List.Item className="!px-0 !py-2">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar src={producer.avatar} />
                    <div className="flex-1">
                      <div className="font-medium">{producer.name}</div>
                      <div className="text-xs text-gray-500">5 beats available</div>
                    </div>
                    <Button size="small" type="text" className="text-blue-500">Follow</Button>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}