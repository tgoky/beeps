"use client";

import { useState } from "react";
import { 
  Card, 
  Tag, 
  Button, 
  Input, 
  Select, 
  Tabs, 
  Avatar, 
  List, 
  Badge, 
  Divider, 
  Radio, 
  Slider, 
  Rate, 
  Popover,
  Modal,
  message,
  Carousel,
  Progress,
  Statistic,
  Tooltip,
  Switch
} from "antd";
import { 
  SearchOutlined, 
  FilterOutlined, 
  HeartOutlined, 
  HeartFilled, 
  ClockCircleOutlined, 
  DollarOutlined, 
  EnvironmentOutlined, 
  UserOutlined,
  ShoppingCartOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  StarOutlined,
  CreditCardOutlined,
  ShareAltOutlined,
  VerifiedOutlined,
  HistoryOutlined,
  AlertOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";

const { Meta } = Card;
const { Option } = Select;
const { TabPane } = Tabs;
const { Countdown } = Statistic;

type Equipment = {
  id: number;
  title: string;
  type: 'rent' | 'sale' | 'auction';
  seller: {
    name: string;
    avatar: string;
    rating: number;
    verified: boolean;
    transactions: number;
  };
  price: number | string;
  originalPrice?: number;
  discount?: number;
  condition: 'new' | 'like new' | 'used' | 'vintage';
  category: string;
  brand: string;
  location: string;
  availability: string;
  images: string[];
  liked: boolean;
  rating: number;
  reviewCount: number;
  deliveryOptions: string[];
  tags: string[];
  specs: {
    label: string;
    value: string;
  }[];
};

type GearActivity = {
  id: number;
  user: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  action: 'purchased' | 'listed' | 'rented' | 'reviewed' | 'bid';
  item: string;
  price?: string;
  time: string;
  rating?: number;
};

// Mock Data
const gearData: Equipment[] = [
  {
    id: 1,
    title: "Neumann U87 Ai Studio Microphone",
    type: 'rent',
    seller: {
      name: "ProAudio Rentals",
      avatar: "https://randomuser.me/api/portraits/men/42.jpg",
      rating: 4.9,
      verified: true,
      transactions: 127
    },
    price: 85,
    originalPrice: 120,
    discount: 29,
    condition: 'like new',
    category: "Microphones",
    brand: "Neumann",
    location: "Los Angeles, CA",
    availability: "Available now",
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819"
    ],
    liked: false,
    rating: 4.8,
    reviewCount: 42,
    deliveryOptions: ["Pickup", "Same-day delivery"],
    tags: ["Vocal", "Studio", "Condenser"],
    specs: [
      { label: "Type", value: "Condenser" },
      { label: "Polar Pattern", value: "Cardioid/Omni/Figure-8" },
      { label: "Frequency Response", value: "20Hz - 20kHz" }
    ]
  },
  {
    id: 2,
    title: "Fender Stratocaster '65 Reissue",
    type: 'sale',
    seller: {
      name: "Vintage Guitars LA",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg",
      rating: 4.7,
      verified: true,
      transactions: 89
    },
    price: 2200,
    condition: 'vintage',
    category: "Guitars",
    brand: "Fender",
    location: "Burbank, CA",
    availability: "1 in stock",
    images: [
      "https://images.unsplash.com/photo-1550985616-1081020a975c",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
      "https://images.unsplash.com/photo-1516924967500-2b4b2b8a3624"
    ],
    liked: true,
    rating: 4.9,
    reviewCount: 18,
    deliveryOptions: ["Pickup", "Shipping"],
    tags: ["Vintage", "Collector", "Electric"],
    specs: [
      { label: "Year", value: "2015 (Reissue)" },
      { label: "Color", value: "Sunburst" },
      { label: "Neck", value: "Maple" }
    ]
  },
  {
    id: 3,
    title: "Moog Subsequent 37 Analog Synth",
    type: 'rent',
    seller: {
      name: "Synth City",
      avatar: "https://randomuser.me/api/portraits/men/65.jpg",
      rating: 4.8,
      verified: false,
      transactions: 34
    },
    price: 45,
    condition: 'used',
    category: "Synthesizers",
    brand: "Moog",
    location: "Online",
    availability: "Available next week",
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819"
    ],
    liked: false,
    rating: 4.6,
    reviewCount: 27,
    deliveryOptions: ["Shipping"],
    tags: ["Analog", "Keyboard", "Bass"],
    specs: [
      { label: "Keys", value: "37" },
      { label: "Polyphony", value: "Paraphonic" },
      { label: "Weight", value: "13.2 lbs" }
    ]
  },
  {
    id: 4,
    title: "Roland TR-8S Rhythm Performer",
    type: 'auction',
    seller: {
      name: "Beat Lab",
      avatar: "https://randomuser.me/api/portraits/men/77.jpg",
      rating: 4.5,
      verified: true,
      transactions: 56
    },
    price: "Current bid: $550",
    condition: 'like new',
    category: "Drum Machines",
    brand: "Roland",
    location: "Brooklyn, NY",
    availability: "Auction ends in 2 days",
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819"
    ],
    liked: false,
    rating: 4.7,
    reviewCount: 31,
    deliveryOptions: ["Pickup", "Shipping"],
    tags: ["Drum", "Sequencer", "Aira"],
    specs: [
      { label: "Pads", value: "11" },
      { label: "Outputs", value: "6" },
      { label: "Patterns", value: "128" }
    ]
  }
];

const gearActivityData: GearActivity[] = [
  {
    id: 1,
    user: {
      name: "DJ Pulse",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      verified: true
    },
    action: 'purchased',
    item: "Pioneer DJM-900NXS2",
    price: "$1,200",
    time: "10 min ago",
    rating: 5
  },
  {
    id: 2,
    user: {
      name: "Studio Pro",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      verified: false
    },
    action: 'listed',
    item: "API 5500 EQ Pair",
    price: "$2,800",
    time: "35 min ago"
  },
  {
    id: 3,
    user: {
      name: "Bass Master",
      avatar: "https://randomuser.me/api/portraits/men/55.jpg",
      verified: true
    },
    action: 'rented',
    item: "Ampeg SVT-4 Pro",
    price: "$85/week",
    time: "2 hours ago",
    rating: 4
  },
  {
    id: 4,
    user: {
      name: "Synth Explorer",
      avatar: "https://randomuser.me/api/portraits/women/66.jpg",
      verified: true
    },
    action: 'reviewed',
    item: "Korg Minilogue XD",
    rating: 5,
    time: "5 hours ago"
  },
  {
    id: 5,
    user: {
      name: "Beat Maker",
      avatar: "https://randomuser.me/api/portraits/men/33.jpg",
      verified: false
    },
    action: 'bid',
    item: "MPC Live II",
    price: "$750",
    time: "1 day ago"
  }
];

export default function GearMarketplace() {
  const [activeTab, setActiveTab] = useState("rent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 3000]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bidPrice, setBidPrice] = useState(600);
  const [gear, setGear] = useState<Equipment[]>(gearData);
  const [deliveryFilter, setDeliveryFilter] = useState<string[]>([]);
  const [conditionFilter, setConditionFilter] = useState<string[]>([]);

  const toggleLike = (id: number) => {
    setGear(gear.map(item => 
      item.id === id ? { ...item, liked: !item.liked } : item
    ));
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleBidSubmit = () => {
    message.success(`Bid submitted for $${bidPrice}!`);
    setIsModalOpen(false);
  };

  const filteredGear = gear.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesBrand = selectedBrand === "all" || item.brand === selectedBrand;
    
    const matchesPrice = typeof item.price === "number" 
      ? item.price >= priceRange[0] && item.price <= priceRange[1]
      : true;
    
    const matchesDelivery = deliveryFilter.length === 0 || 
      deliveryFilter.some(option => item.deliveryOptions.includes(option));
    
    const matchesCondition = conditionFilter.length === 0 || 
      conditionFilter.includes(item.condition);
    
    return matchesSearch && matchesCategory && matchesBrand && 
           matchesPrice && matchesDelivery && matchesCondition;
  });

  return (
    <div className="flex h-full bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Gear Marketplace</h1>
                <p className="text-gray-600">Rent, buy, or sell professional music equipment</p>
              </div>
              <Button type="primary" size="large" icon={<ShoppingCartOutlined />}>
                List Your Gear
              </Button>
            </div>
            
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-gray-500 text-sm">Available Items</div>
                <div className="text-2xl font-bold">1,248</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-gray-500 text-sm">Verified Sellers</div>
                <div className="text-2xl font-bold">327</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-gray-500 text-sm">Daily Rentals</div>
                <div className="text-2xl font-bold">89</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-gray-500 text-sm">Avg. Rating</div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold mr-2">4.7</span>
                  <Rate disabled defaultValue={4.7} allowHalf character={<StarOutlined className="text-sm" />} />
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Input
                placeholder="Search gear, brands, sellers..."
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
                <Option value="Microphones">Microphones</Option>
                <Option value="Guitars">Guitars</Option>
                <Option value="Keyboards">Keyboards</Option>
                <Option value="Drums">Drums</Option>
                <Option value="DJ Equipment">DJ Equipment</Option>
                <Option value="Studio Monitors">Studio Monitors</Option>
                <Option value="Synthesizers">Synthesizers</Option>
                <Option value="Effects">Effects</Option>
              </Select>
              <Select
                placeholder="All Brands"
                className="w-full md:w-[180px]"
                value={selectedBrand}
                onChange={(value) => setSelectedBrand(value)}
              >
                <Option value="all">All Brands</Option>
                <Option value="Neumann">Neumann</Option>
                <Option value="Fender">Fender</Option>
                <Option value="Moog">Moog</Option>
                <Option value="Roland">Roland</Option>
                <Option value="Yamaha">Yamaha</Option>
                <Option value="Shure">Shure</Option>
                <Option value="API">API</Option>
                <Option value="Pioneer">Pioneer</Option>
              </Select>
              <Button type="primary" icon={<FilterOutlined />}>
                Filters
              </Button>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Price Range: ${priceRange[0]} - ${priceRange[1]}</h4>
                <Slider 
                  range 
                  min={0} 
                  max={3000} 
                  step={50}
                  defaultValue={[0, 3000]} 
                  onChange={(value) => setPriceRange(value)} 
                />
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Delivery Options</h4>
                <Select
                  mode="multiple"
                  placeholder="Any delivery"
                  className="w-full"
                  value={deliveryFilter}
                  onChange={setDeliveryFilter}
                >
                  <Option value="Pickup">Local Pickup</Option>
                  <Option value="Shipping">Shipping</Option>
                  <Option value="Same-day delivery">Same-day Delivery</Option>
                </Select>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Condition</h4>
                <Select
                  mode="multiple"
                  placeholder="Any condition"
                  className="w-full"
                  value={conditionFilter}
                  onChange={setConditionFilter}
                >
                  <Option value="new">New</Option>
                  <Option value="like new">Like New</Option>
                  <Option value="used">Used</Option>
                  <Option value="vintage">Vintage</Option>
                </Select>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            className="mb-6"
            tabBarExtraContent={
              <Radio.Group defaultValue="all" size="small">
                <Radio.Button value="all">All</Radio.Button>
                <Radio.Button value="verified">Verified Only</Radio.Button>
                <Radio.Button value="local">Local</Radio.Button>
              </Radio.Group>
            }
          >
            <TabPane tab={<span><CreditCardOutlined /> Rent</span>} key="rent" />
            <TabPane tab={<span><DollarOutlined /> Buy</span>} key="sale" />
            <TabPane tab={<span><ThunderboltOutlined /> Auction</span>} key="auction" />
            <TabPane tab={<span><HistoryOutlined /> Recently Added</span>} key="new" />
          </Tabs>

          {/* Gear Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGear.map((item) => (
              <Card
                key={item.id}
                hoverable
                className="relative border rounded-lg overflow-hidden bg-white shadow-sm"
                cover={
                  <div className="relative h-48 group">
                    <Carousel dotPosition="top" autoplay>
                      {item.images.map((img, i) => (
                        <div key={i} className="h-48">
                          <img 
                            alt={item.title} 
                            src={img} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </Carousel>
                    
                    {item.type === 'rent' && (
                      <Tag color="blue" className="absolute top-2 left-2">
                        <CalendarOutlined /> Rent
                      </Tag>
                    )}
                    {item.type === 'auction' && (
                      <Tag color="orange" className="absolute top-2 left-2">
                        <AlertOutlined /> Auction
                      </Tag>
                    )}
                    {item.discount && (
                      <Tag color="red" className="absolute top-2 right-2">
                        {item.discount}% OFF
                      </Tag>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <h3 className="text-white font-bold text-lg">{item.title}</h3>
                      <div className="flex items-center text-white/80 text-sm">
                        <EnvironmentOutlined className="mr-1" />
                        {item.location}
                      </div>
                    </div>
                  </div>
                }
                actions={[
                  <button 
                    key="like" 
                    onClick={() => toggleLike(item.id)}
                    className="text-lg"
                  >
                    {item.liked ? (
                      <HeartFilled className="text-red-500" />
                    ) : (
                      <HeartOutlined />
                    )}
                  </button>,
                  <Tooltip title="Share" key="share">
                    <ShareAltOutlined />
                  </Tooltip>,
                  item.type === 'rent' ? (
                    <Button type="primary" size="small" icon={<CalendarOutlined />}>
                      Rent Now
                    </Button>
                  ) : item.type === 'auction' ? (
                    <Button type="primary" size="small" onClick={showModal}>
                      Place Bid
                    </Button>
                  ) : (
                    <Button type="primary" size="small" icon={<ShoppingCartOutlined />}>
                      Buy Now
                    </Button>
                  )
                ]}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={item.seller.avatar} />
                    <div>
                      <div className="font-medium flex items-center">
                        {item.seller.name}
                        {item.seller.verified && (
                          <VerifiedOutlined className="text-blue-500 ml-1" />
                        )}
                      </div>
                      <div className="flex items-center">
                        <Rate 
                          disabled 
                          defaultValue={item.seller.rating} 
                          allowHalf 
                          character={<StarOutlined className="text-xs" />}
                          className="[&_.ant-rate-star]:mr-0.5 text-xs"
                        />
                        <span className="text-xs text-gray-500 ml-1">({item.seller.transactions})</span>
                      </div>
                    </div>
                  </div>
                  <Tag color={item.condition === 'new' ? 'green' : 
                            item.condition === 'like new' ? 'blue' : 
                            item.condition === 'vintage' ? 'gold' : 'default'}>
                    {item.condition}
                  </Tag>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">
                      {item.availability}
                    </span>
                    <div className="flex items-center text-sm">
                      <Rate 
                        disabled 
                        defaultValue={item.rating} 
                        allowHalf 
                        character={<StarOutlined className="text-xs" />}
                        className="[&_.ant-rate-star]:mr-0.5 text-xs"
                      />
                      <span className="text-xs text-gray-500 ml-1">({item.reviewCount})</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.map((tag, i) => (
                      <Tag key={i} className="text-xs">{tag}</Tag>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    {item.specs.slice(0, 4).map((spec, i) => (
                      <div key={i} className="truncate">
                        <span className="text-gray-500">{spec.label}:</span> {spec.value}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-wrap gap-1 text-xs">
                    {item.deliveryOptions.map((option, i) => (
                      <Tag key={i} color="cyan" className="text-xs">
                        {option}
                      </Tag>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div>
                    {item.type === 'rent' && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold">${item.price}/day</span>
                        {item.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">${item.originalPrice}</span>
                        )}
                      </div>
                    )}
                    {item.type === 'sale' && (
                      <span className="text-xl font-bold">${item.price}</span>
                    )}
                    {item.type === 'auction' && (
                      <span className="text-gray-700 font-medium">{item.price}</span>
                    )}
                  </div>
                  {item.type === 'auction' && (
                    <Countdown 
                      value={Date.now() + 1000 * 60 * 60 * 24 * 2} 
                      format="HH:mm:ss" 
                      valueStyle={{ fontSize: '12px' }}
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Sidebar */}
      <div className="w-80 border-l border-gray-200 hidden xl:block p-6 bg-white overflow-y-auto">
        <div className="sticky top-6">
          <h2 className="text-lg font-bold mb-4">Gear Activity</h2>
          
          <Tabs defaultActiveKey="live" size="small">
            <TabPane tab="Live Activity" key="live" />
            <TabPane tab="My Watchlist" key="watch" />
            <TabPane tab="My Transactions" key="transactions" />
          </Tabs>

          <div className="space-y-4 mt-4">
            {gearActivityData.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Avatar src={activity.user.avatar} />
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium flex items-center">
                      {activity.user.name}
                      {activity.user.verified && (
                        <VerifiedOutlined className="text-blue-500 ml-1 text-xs" />
                      )}
                    </span>{" "}
                    {activity.action === 'purchased' && (
                      <span>purchased <span className="font-medium">{activity.item}</span> for {activity.price}</span>
                    )}
                    {activity.action === 'listed' && (
                      <span>listed <span className="font-medium">{activity.item}</span> for {activity.price}</span>
                    )}
                    {activity.action === 'rented' && (
                      <span>rented <span className="font-medium">{activity.item}</span> for {activity.price}</span>
                    )}
                    {activity.action === 'reviewed' && (
                      <span>reviewed <span className="font-medium">{activity.item}</span></span>
                    )}
                    {activity.action === 'bid' && (
                      <span>placed a bid on <span className="font-medium">{activity.item}</span> for {activity.price}</span>
                    )}
                    {activity.rating && (
                      <Rate 
                        disabled 
                        defaultValue={activity.rating} 
                        allowHalf 
                        character={<StarOutlined className="text-xs" />}
                        className="[&_.ant-rate-star]:mr-0.5 text-xs ml-1"
                      />
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>

          <Divider className="my-6" />

          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Trusted Sellers</h3>
              <Button type="link" size="small">View All</Button>
            </div>
            <List
              dataSource={gear.filter(s => s.seller.verified).slice(0, 3)}
              renderItem={(item) => (
                <List.Item className="!px-0 !py-2">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar src={item.seller.avatar} />
                    <div className="flex-1">
                      <div className="font-medium flex items-center">
                        {item.seller.name}
                        <VerifiedOutlined className="text-blue-500 ml-1 text-xs" />
                      </div>
                      <div className="flex items-center">
                        <Rate 
                          disabled 
                          defaultValue={item.seller.rating} 
                          allowHalf 
                          character={<StarOutlined className="text-xs" />}
                          className="[&_.ant-rate-star]:mr-0.5 text-xs"
                        />
                        <span className="text-xs text-gray-500 ml-1">({item.seller.transactions})</span>
                      </div>
                    </div>
                    <Button size="small" type="text" className="text-blue-500">View</Button>
                  </div>
                </List.Item>
              )}
            />
          </div>

          <Divider className="my-6" />

          <div>
            <h3 className="font-bold mb-3">Safety Tips</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <SafetyCertificateOutlined className="text-blue-500 mt-1" />
                <div className="text-sm">
                  <div className="font-medium">Meet in safe locations</div>
                  <div className="text-gray-500">Use our verified meetup spots</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <SafetyCertificateOutlined className="text-blue-500 mt-1" />
                <div className="text-sm">
                  <div className="font-medium">Inspect gear thoroughly</div>
                  <div className="text-gray-500">Check condition before payment</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <SafetyCertificateOutlined className="text-blue-500 mt-1" />
                <div className="text-sm">
                  <div className="font-medium">Use secure payment</div>
                  <div className="text-gray-500">Avoid cash when possible</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      <Modal 
        title="Place Your Bid" 
        open={isModalOpen} 
        onOk={handleBidSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText="Submit Bid"
        width={600}
      >
        <div className="mb-6">
          <div className="flex items-start gap-4">
            <img 
              src={gear.find(i => i.type === 'auction')?.images[0]} 
              alt="Auction item" 
              className="w-24 h-24 object-cover rounded"
            />
            <div>
              <h4 className="font-bold">Roland TR-8S Rhythm Performer</h4>
              <div className="text-sm text-gray-600 mb-2">Current bid: $550</div>
              <div className="flex items-center gap-2">
                <Avatar src={gear.find(i => i.type === 'auction')?.seller.avatar} size="small" />
                <div>
                  <div className="text-sm">
                    {gear.find(i => i.type === 'auction')?.seller.name}
                    {gear.find(i => i.type === 'auction')?.seller.verified && (
                      <VerifiedOutlined className="text-blue-500 ml-1 text-xs" />
                    )}
                  </div>
                  <Rate 
                    disabled 
                    defaultValue={gear.find(i => i.type === 'auction')?.seller.rating} 
                    allowHalf 
                    character={<StarOutlined className="text-xs" />}
                    className="[&_.ant-rate-star]:mr-0.5 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-medium mb-2">Your Bid Amount:</h4>
          <div className="flex items-center gap-4">
            <Slider 
              min={550} 
              max={1200} 
              step={10}
              value={bidPrice} 
              onChange={(value) => setBidPrice(value)} 
              className="flex-1"
            />
            <Input 
              value={bidPrice} 
              onChange={(e) => setBidPrice(Number(e.target.value))} 
              prefix="$" 
              className="w-24"
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">Next minimum bid: $560</div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium mb-2">Auction Details:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Ends:</span> 2 days 3 hours</div>
            <div><span className="text-gray-500">Bids:</span> 7</div>
            <div><span className="text-gray-500">Location:</span> Brooklyn, NY</div>
            <div><span className="text-gray-500">Condition:</span> Like New</div>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium mb-2">Payment Method:</h4>
          <Select defaultValue="paypal" className="w-full">
            <Option value="paypal">PayPal</Option>
            <Option value="card">Credit/Debit Card</Option>
            <Option value="crypto">Crypto</Option>
          </Select>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Terms & Conditions:</h4>
          <div className="text-sm text-gray-600 mb-2">
            By placing a bid, you agree to purchase this item if you win the auction. 
            All bids are binding.
          </div>
          <Switch defaultChecked /> 
          <span className="text-sm ml-2">I agree to the terms</span>
        </div>
      </Modal>
    </div>
  );
}