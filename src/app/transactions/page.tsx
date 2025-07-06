"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  Tabs, 
  Avatar, 
  List, 
  Divider, 
  Radio, 
  Modal,
  message,
  Upload,
  Progress,
  Statistic,
  Tooltip,
  Switch,
  Collapse,
  Badge,
  Drawer,
  Carousel,
  Tag,
  Rate,
} from "antd";
import { 
  SearchOutlined, 
  FilterOutlined, 
  HeartOutlined, 
  HeartFilled,
  PlayCircleOutlined,
  PauseCircleOutlined,
  VideoCameraOutlined,
  UserOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  WifiOutlined,
  ClockCircleOutlined,
  StarOutlined,
  ShoppingCartOutlined,
  PhoneOutlined,
  MessageOutlined,
  CalendarOutlined,
  TeamOutlined,
  SoundOutlined,
  BulbOutlined,
  AppstoreOutlined,
  CompassOutlined
} from "@ant-design/icons";

const { TabPane } = Tabs;
const { Panel } = Collapse;

type LiveStream = {
  id: number;
  user: {
    name: string;
    avatar: string;
    verified: boolean;
    followers: number;
  };
  title: string;
  thumbnail: string;
  viewers: number;
  tags: string[];
  genre: string;
  duration: string;
  isLive: boolean;
  scheduled?: string;
};

type Studio = {
  id: number;
  name: string;
  image: string;
  distance: string;
  rating: number;
  price: string;
  equipment: string[];
  available: boolean;
  slots: {
    start: string;
    end: string;
  }[];
};

type ServiceProvider = {
  id: number;
  name: string;
  avatar: string;
  service: string;
  rating: number;
  price: string;
  distance: string;
  available: boolean;
  tags: string[];
};

type GearItem = {
  id: number;
  name: string;
  image: string;
  price: string;
  rating: number;
  seller: string;
  distance: string;
  condition: 'New' | 'Used - Like New' | 'Used - Good' | 'Used - Fair';
};
const { Option } = Select;
// Mock Data
const liveStreams: LiveStream[] = [
  {
    id: 1,
    user: {
      name: "ProducerPro",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      verified: true,
      followers: 12400
    },
    title: "Making a Hit Beat from Scratch",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
    viewers: 1245,
    tags: ["Producing", "Tutorial", "BehindTheScenes"],
    genre: "Hip Hop",
    duration: "2:45:12",
    isLive: true
  },
  {
    id: 2,
    user: {
      name: "VocalQueen",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      verified: true,
      followers: 18700
    },
    title: "Vocal Recording Session",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
    viewers: 876,
    tags: ["Recording", "R&B", "Vocals"],
    genre: "R&B",
    duration: "1:23:45",
    isLive: true
  },
  {
    id: 3,
    user: {
      name: "BeatMaster",
      avatar: "https://randomuser.me/api/portraits/men/55.jpg",
      verified: false,
      followers: 3200
    },
    title: "Weekly Beat Challenge",
    thumbnail: "https://images.unsplash.com/photo-1496293455970-f8581aae0e3b?w=400",
    viewers: 432,
    tags: ["Challenge", "LiveFeedback", "Trap"],
    genre: "Trap",
    duration: "3:12:08",
    isLive: true
  },
  {
    id: 4,
    user: {
      name: "SongwriterPro",
      avatar: "https://randomuser.me/api/portraits/women/65.jpg",
      verified: true,
      followers: 8900
    },
    title: "Songwriting Workshop",
    thumbnail: "https://images.unsplash.com/photo-1453738773917-9c3eff1db985?w=400",
    viewers: 0,
    tags: ["Workshop", "Education", "Pop"],
    genre: "Pop",
    duration: "",
    isLive: false,
    scheduled: "Tomorrow, 3:00 PM"
  }
];

const nearbyStudios: Studio[] = [
  {
    id: 1,
    name: "Hit Factory Studios",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
    distance: "0.5 mi",
    rating: 4.8,
    price: "$50/hr",
    equipment: ["Neumann U87", "SSL Console", "Pro Tools HD", "Live Room"],
    available: true,
    slots: [
      { start: "10:00 AM", end: "12:00 PM" },
      { start: "2:00 PM", end: "4:00 PM" },
      { start: "6:00 PM", end: "8:00 PM" }
    ]
  },
  {
    id: 2,
    name: "Urban Sound Lab",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
    distance: "1.2 mi",
    rating: 4.5,
    price: "$35/hr",
    equipment: ["Avalon 737", "MPC Live", "Logic Pro", "Booth"],
    available: true,
    slots: [
      { start: "11:00 AM", end: "1:00 PM" },
      { start: "3:00 PM", end: "5:00 PM" }
    ]
  },
  {
    id: 3,
    name: "Basement Beats",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
    distance: "2.1 mi",
    rating: 4.2,
    price: "$25/hr",
    equipment: ["Focusrite Interface", "MIDI Keyboard", "FL Studio", "Monitor Speakers"],
    available: false,
    slots: []
  }
];

const instantServices: ServiceProvider[] = [
  {
    id: 1,
    name: "Alex Beatmaker",
    avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    service: "Producer",
    rating: 4.9,
    price: "$100/song",
    distance: "0.3 mi",
    available: true,
    tags: ["Trap", "Hip Hop", "Pop"]
  },
  {
    id: 2,
    name: "Sarah Songwriter",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    service: "Songwriter",
    rating: 4.7,
    price: "$150/song",
    distance: "1.1 mi",
    available: true,
    tags: ["Pop", "R&B", "Lyrics"]
  },
  {
    id: 3,
    name: "Mike Mixer",
    avatar: "https://randomuser.me/api/portraits/men/44.jpg",
    service: "Mixing Engineer",
    rating: 4.8,
    price: "$75/track",
    distance: "0.8 mi",
    available: false,
    tags: ["Mixing", "Mastering", "Audio"]
  }
];

const gearMarketplace: GearItem[] = [
  {
    id: 1,
    name: "Neumann U87 Microphone",
    image: "https://m.media-amazon.com/images/I/61fVY5RSeGL._AC_SL1500_.jpg",
    price: "$2,200",
    rating: 4.9,
    seller: "ProAudioSeller",
    distance: "3.2 mi",
    condition: "Used - Like New"
  },
  {
    id: 2,
    name: "MPC Live II",
    image: "https://m.media-amazon.com/images/I/71Q8gR1vQVL._AC_SL1500_.jpg",
    price: "$1,100",
    rating: 4.7,
    seller: "BeatEquipment",
    distance: "5.5 mi",
    condition: "New"
  },
  {
    id: 3,
    name: "Yamaha HS8 Monitors (Pair)",
    image: "https://m.media-amazon.com/images/I/71Q8gR1vQVL._AC_SL1500_.jpg",
    price: "$500",
    rating: 4.5,
    seller: "StudioGear",
    distance: "2.7 mi",
    condition: "Used - Good"
  }
];

export default function LiveMusicPage() {
  const [activeTab, setActiveTab] = useState("streams");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [isStudioDrawerOpen, setIsStudioDrawerOpen] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceProvider | null>(null);
  const [isFindingStudio, setIsFindingStudio] = useState(false);
  const [findingProgress, setFindingProgress] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
 const [streamGenre, setStreamGenre] = useState<string>("all");
  const [streamTags, setStreamTags] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Simulate finding nearby studios
  const findNearbyStudios = () => {
    setIsFindingStudio(true);
    setFindingProgress(0);
    
    const interval = setInterval(() => {
      setFindingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsFindingStudio(false);
          setIsStudioDrawerOpen(true);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };
  
  // Simulate starting a live stream
  const startStreaming = () => {
    setIsStreaming(true);
    message.success('Your live stream has started!');
    setIsLiveModalOpen(false);
    
    // In a real app, this would connect to your streaming service
    if (videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Error accessing media devices:", err);
          message.error('Could not access camera/microphone');
          setIsStreaming(false);
        });
    }
  };
  
  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  const filteredStreams = liveStreams.filter(stream => {
    const matchesSearch = stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || stream.genre === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-full bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Music Hub</h1>
                <p className="text-gray-600">Stream, connect, and create in real-time</p>
              </div>
              <Button 
                type="primary" 
                size="large" 
                icon={<VideoCameraOutlined />}
                onClick={() => setIsLiveModalOpen(true)}
              >
                Go Live
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <button 
                className="bg-white p-4 rounded-lg shadow-sm border hover:bg-blue-50 transition-colors"
                onClick={findNearbyStudios}
              >
                <div className="flex flex-col items-center">
                  <EnvironmentOutlined className="text-2xl text-blue-500 mb-2" />
                  <span>Find Studio</span>
                </div>
              </button>
              <button className="bg-white p-4 rounded-lg shadow-sm border hover:bg-purple-50 transition-colors">
                <div className="flex flex-col items-center">
                  <TeamOutlined className="text-2xl text-purple-500 mb-2" />
                  <span>Find Musicians</span>
                </div>
              </button>
              <button className="bg-white p-4 rounded-lg shadow-sm border hover:bg-green-50 transition-colors">
                <div className="flex flex-col items-center">
                  <SoundOutlined className="text-2xl text-green-500 mb-2" />
                  <span>Book Session</span>
                </div>
              </button>
              <button className="bg-white p-4 rounded-lg shadow-sm border hover:bg-orange-50 transition-colors">
                <div className="flex flex-col items-center">
                  <ShoppingCartOutlined className="text-2xl text-orange-500 mb-2" />
                  <span>Buy Gear</span>
                </div>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search streams, studios, services..."
                prefix={<SearchOutlined />}
                className="w-full md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select
                placeholder="All Categories"
                className="w-full md:w-[180px]"
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value)}
              >
                <Option value="all">All Categories</Option>
                <Option value="Hip Hop">Hip Hop</Option>
                <Option value="R&B">R&B</Option>
                <Option value="Pop">Pop</Option>
                <Option value="Trap">Trap</Option>
                <Option value="Electronic">Electronic</Option>
                <Option value="Rock">Rock</Option>
              </Select>
              <Button type="primary" icon={<FilterOutlined />}>
                Filters
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            className="mb-6"
          >
            <TabPane tab={<span><VideoCameraOutlined /> Live Streams</span>} key="streams" />
            <TabPane tab={<span><EnvironmentOutlined /> Studios</span>} key="studios" />
            <TabPane tab={<span><BulbOutlined /> Instant Services</span>} key="services" />
            <TabPane tab={<span><ShoppingCartOutlined /> Gear Marketplace</span>} key="gear" />
          </Tabs>

          {/* Content based on active tab */}
          {activeTab === "streams" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStreams.map((stream) => (
                <Card
                  key={stream.id}
                  hoverable
                  cover={
                    <div className="relative">
                      <img 
                        alt={stream.title} 
                        src={stream.thumbnail} 
                        className="h-48 w-full object-cover"
                      />
                      {stream.isLive && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs flex items-center">
                          <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
                          LIVE
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-xs">
                        {stream.viewers.toLocaleString()} viewers
                      </div>
                      {!stream.isLive && stream.scheduled && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <div className="text-white text-center">
                            <ClockCircleOutlined className="text-2xl mb-1" />
                            <div className="font-medium">{stream.scheduled}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  }
                >
                  <div className="flex items-start gap-3">
                    <Avatar src={stream.user.avatar} size="large" />
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{stream.title}</h3>
                      <div className="flex items-center text-sm">
                        <span>{stream.user.name}</span>
                        {stream.user.verified && (
                          <span className="ml-1 text-blue-500">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Tag color="blue">{stream.genre}</Tag>
                        {stream.tags.slice(0, 2).map((tag, i) => (
                          <Tag key={i}>{tag}</Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "studios" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyStudios.map((studio) => (
                <Card
                  key={studio.id}
                  hoverable
                  cover={
                    <img 
                      alt={studio.name} 
                      src={studio.image} 
                      className="h-48 w-full object-cover"
                    />
                  }
                  onClick={() => {
                    setSelectedStudio(studio);
                    setIsStudioDrawerOpen(true);
                  }}
                >
                  <div>
                    <h3 className="font-bold mb-1">{studio.name}</h3>
                    <div className="flex items-center text-sm mb-2">
                      <Rate 
                        disabled 
                        defaultValue={studio.rating} 
                        allowHalf 
                        character={<StarOutlined />}
                        className="text-sm mr-2"
                      />
                      <span className="text-gray-600">{studio.rating}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{studio.distance}</span>
                      <span className="font-medium">{studio.price}</span>
                    </div>
                    <div className="mt-3">
                      {studio.available ? (
                        <Tag color="green">Available Now</Tag>
                      ) : (
                        <Tag color="orange">Booked Today</Tag>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "services" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instantServices.map((service) => (
                <Card
                  key={service.id}
                  hoverable
                  onClick={() => setSelectedService(service)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar src={service.avatar} size={64} />
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{service.name}</h3>
                      <div className="flex items-center text-sm mb-2">
                        <Rate 
                          disabled 
                          defaultValue={service.rating} 
                          allowHalf 
                          character={<StarOutlined />}
                          className="text-sm mr-2"
                        />
                        <span className="text-gray-600">{service.rating}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">{service.distance}</span>
                        <span className="font-medium">{service.price}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {service.tags.map((tag, i) => (
                          <Tag key={i}>{tag}</Tag>
                        ))}
                      </div>
                      <div className="mt-3">
                        {service.available ? (
                          <Tag color="green" icon={<WifiOutlined />}>Available Now</Tag>
                        ) : (
                          <Tag color="orange" icon={<ClockCircleOutlined />}>Busy</Tag>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "gear" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gearMarketplace.map((gear) => (
                <Card
                  key={gear.id}
                  hoverable
                  cover={
                    <img 
                      alt={gear.name} 
                      src={gear.image} 
                      className="h-48 w-full object-contain bg-gray-100 p-4"
                    />
                  }
                >
                  <div>
                    <h3 className="font-bold mb-1">{gear.name}</h3>
                    <div className="flex items-center text-sm mb-2">
                      <Rate 
                        disabled 
                        defaultValue={gear.rating} 
                        allowHalf 
                        character={<StarOutlined />}
                        className="text-sm mr-2"
                      />
                      <span className="text-gray-600">{gear.rating}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">{gear.distance} • {gear.condition}</span>
                      <span className="font-medium">{gear.price}</span>
                    </div>
                    <div className="mt-3 flex justify-between">
                      <Button icon={<MessageOutlined />}>Message</Button>
                      <Button type="primary" icon={<ShoppingCartOutlined />}>Buy</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Currently Streaming */}
      <div className="w-80 border-l border-gray-200 hidden xl:block p-6 bg-white overflow-y-auto">
        <div className="sticky top-6">
          <h2 className="text-lg font-bold mb-4">🔥 Live Now</h2>
          
          {isStreaming ? (
            <div className="mb-6 border rounded-lg overflow-hidden">
              <div className="relative">
                <video 
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-48 bg-black"
                />
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
                  LIVE
                </div>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-xs">
                  42 viewers
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-bold mb-1">Your Live Stream</h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">2:45:12</span>
                  <Button 
                    danger 
                    size="small"
                    onClick={() => setIsStreaming(false)}
                  >
                    End Stream
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50 text-center">
              <VideoCameraOutlined className="text-3xl text-gray-400 mb-2" />
              <p className="text-gray-600 mb-3"> not streaming yet</p>
              <Button 
                type="primary" 
                icon={<VideoCameraOutlined />}
                onClick={() => setIsLiveModalOpen(true)}
              >
                Go Live Now
              </Button>
            </div>
          )}
          
          <Divider />
          
          <h3 className="font-bold mb-3">Top Live Streams</h3>
          <div className="space-y-4">
            {liveStreams
              .filter(stream => stream.isLive)
              .sort((a, b) => b.viewers - a.viewers)
              .slice(0, 3)
              .map(stream => (
                <div 
                  key={stream.id} 
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <div className="relative">
                    <img 
                      src={stream.thumbnail} 
                      alt={stream.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="absolute bottom-1 left-1 bg-red-500 text-white text-xs px-1 rounded">
                      LIVE
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm line-clamp-1">{stream.title}</div>
                    <div className="text-xs text-gray-500">{stream.user.name}</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <UserOutlined className="mr-1" />
                      {stream.viewers.toLocaleString()} viewers
                    </div>
                  </div>
                </div>
              ))}
          </div>
          
          <Divider />
          
          <h3 className="font-bold mb-3">Nearby Studios</h3>
          <div className="space-y-3">
            {nearbyStudios
              .filter(studio => studio.available)
              .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
              .slice(0, 2)
              .map(studio => (
                <div 
                  key={studio.id} 
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => {
                    setSelectedStudio(studio);
                    setIsStudioDrawerOpen(true);
                  }}
                >
                  <img 
                    src={studio.image} 
                    alt={studio.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{studio.name}</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <EnvironmentOutlined className="mr-1" />
                      {studio.distance} • {studio.price}
                    </div>
                    <div className="flex items-center mt-1">
                      <Rate 
                        disabled 
                        defaultValue={studio.rating} 
                        allowHalf 
                        character={<StarOutlined />}
                        className="text-xs"
                      />
                      <span className="text-xs text-gray-500 ml-1">{studio.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            <Button type="link" className="w-full mt-2" onClick={findNearbyStudios}>
              Find More Studios
            </Button>
          </div>
        </div>
      </div>

      {/* Go Live Modal */}
      <Modal 
        title="Start a Live Stream" 
        open={isLiveModalOpen} 
        onOk={startStreaming}
        onCancel={() => setIsLiveModalOpen(false)}
        okText="Go Live"
        width={600}
      >
        <div className="mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Stream Title</label>
            <Input 
              placeholder="What are you creating today?" 
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Genre</label>
            <Select
        className="w-full"
        placeholder="Select genre"
        value={streamGenre}
        onChange={(value: string) => setStreamGenre(value)}
      >
        <Option value="Hip Hop">Hip Hop</Option>
        <Option value="R&B">R&B</Option>
        <Option value="Pop">Pop</Option>
        <Option value="Trap">Trap</Option>
        <Option value="Electronic">Electronic</Option>
        <Option value="Rock">Rock</Option>
      </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="e.g., Producing, Vocals, Tutorial"
                value={streamTags}
                onChange={(value) => setStreamTags(value)}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Stream Preview</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center h-48 bg-gray-50">
              {isStreaming ? (
                <video 
                  ref={videoRef}
                  autoPlay
                  muted
                  className="h-full"
                />
              ) : (
                <div className="text-center">
                  <VideoCameraOutlined className="text-3xl text-gray-400 mb-2" />
                  <p className="text-gray-500">Camera will activate when you go live</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <Switch defaultChecked /> 
            <span className="text-sm ml-2">Allow viewers to comment</span>
          </div>
          <div className="mb-4">
            <Switch /> 
            <span className="text-sm ml-2">Make stream private (invite only)</span>
          </div>
        </div>
      </Modal>


{selectedStudio && (
  <Drawer
    title={selectedStudio?.name || "Studio Details"}
    placement="right"
    width={500}
    onClose={() => setIsStudioDrawerOpen(false)}
    open={isStudioDrawerOpen}
  >
    <div>
      <img
        src={selectedStudio.image}
        alt={selectedStudio.name}
        className="w-full h-48 object-cover rounded-lg mb-4"
      />
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center">
            <Rate
              disabled
              defaultValue={selectedStudio.rating}
              allowHalf
              character={<StarOutlined />}
              className="text-sm mr-2"
            />
            <span className="text-gray-600">{selectedStudio.rating} ({Math.floor(selectedStudio.rating * 20)} reviews)</span>
          </div>
          <div className="text-gray-600 mt-1">
            <EnvironmentOutlined className="mr-1" />
            {selectedStudio.distance} away
          </div>
        </div>
        <div className="text-xl font-bold">{selectedStudio.price}</div>
      </div>
      <Divider />
      <h3 className="font-bold mb-2">Equipment</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedStudio.equipment.map((item, i) => (
          <Tag key={i}>{item}</Tag>
        ))}
      </div>
      <Divider />
      <h3 className="font-bold mb-3">Available Time Slots</h3>
      {selectedStudio.available ? (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {selectedStudio.slots.map((slot, i) => (
            <Button key={i} className="text-center">
              {slot.start} - {slot.end}
            </Button>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg mb-6">
          <ClockCircleOutlined className="text-2xl text-gray-400 mb-2" />
          <p className="text-gray-600">No available slots today</p>
          <Button type="link" className="mt-2">View Availability</Button>
        </div>
      )}
      <Button type="primary" block size="large" disabled={!selectedStudio.available}>
        Book Studio Session
      </Button>
    </div>
  </Drawer>
)}

      {/* Service Provider Modal */}
      <Modal 
        title={selectedService ? `Connect with ${selectedService.name}` : "Service Provider"}
        open={!!selectedService}
        onCancel={() => setSelectedService(null)}
        footer={null}
        width={600}
      >
        {selectedService && (
          <div>
            <div className="flex items-start gap-4 mb-6">
              <Avatar src={selectedService.avatar} size={80} />
              <div>
                <h3 className="text-xl font-bold">{selectedService.name}</h3>
                <div className="flex items-center mb-2">
                  <Rate 
                    disabled 
                    defaultValue={selectedService.rating} 
                    allowHalf 
                    character={<StarOutlined />}
                    className="text-sm mr-2"
                  />
                  <span className="text-gray-600">{selectedService.rating}</span>
                </div>
                <div className="text-gray-600 mb-1">
                  <EnvironmentOutlined className="mr-1" />
                  {selectedService.distance} away
                </div>
                <div className="text-lg font-bold">{selectedService.price}</div>
              </div>
            </div>
            
            <Divider />
            
            <h3 className="font-bold mb-2">Service</h3>
            <p className="mb-4">{selectedService.service} Services</p>
            
            <h3 className="font-bold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedService.tags.map((tag, i) => (
                <Tag key={i}>{tag}</Tag>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button icon={<MessageOutlined />}>Send Message</Button>
              <Button type="primary" icon={<CalendarOutlined />}>Book Session</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Finding Studios Modal */}
      <Modal 
        title="Finding Nearby Studios" 
        open={isFindingStudio} 
        footer={null}
        closable={false}
        width={400}
      >
        <div className="text-center p-6">
          <div className="mb-4">
            <CompassOutlined className="text-4xl text-blue-500 animate-pulse" />
          </div>
          <Progress percent={findingProgress} status="active" />
          <p className="mt-4 text-gray-600">
            Searching for available studios in your area...
          </p>
        </div>
      </Modal>
    </div>
  );
}