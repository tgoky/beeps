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
  message 
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
  FireOutlined, 
  StarFilled, 
  MessageOutlined, 
  CheckOutlined,
  CloseOutlined,
  MoreOutlined
} from "@ant-design/icons";

const { Meta } = Card;
const { Option } = Select;
const { TabPane } = Tabs;

type BookingSession = {
  id: number;
  title: string;
  type: 'deal' | 'collab' | 'bid';
  studio?: {
    name: string;
    avatar: string;
    rating: number;
  };
  producer?: {
    name: string;
    avatar: string;
    rating: number;
  };
  price: number | string;
  originalPrice?: number;
  discount?: number;
  duration: string;
  location: string;
  equipment: string[];
  genre: string[];
  date: string;
  slots: number;
  liked: boolean;
  image: string;
};

type Activity = {
  id: number;
  user: {
    name: string;
    avatar: string;
  };
  action: 'booked' | 'requested' | 'accepted' | 'rejected';
  session: string;
  price?: string;
  time: string;
};

// Mock Data
const sessionData: BookingSession[] = [
  {
    id: 1,
    title: "Weekend Studio Blowout",
    type: 'deal',
    studio: {
      name: "Harmony Studios",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 4.8,
    },
    price: 50,
    originalPrice: 100,
    discount: 50,
    duration: "2 hours",
    location: "Los Angeles, CA",
    equipment: ["Neve Console", "Pro Tools HD"],
    genre: ["Hip Hop", "R&B"],
    date: "Today - 3 slots left",
    slots: 3,
    liked: false,
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
  },
  {
    id: 2,
    title: "Collab with Producer Alex",
    type: 'collab',
    producer: {
      name: "Alex BeatSmith",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      rating: 4.9,
    },
    price: "Negotiable",
    duration: "Flexible",
    location: "Online or NYC",
    equipment: ["FL Studio", "Live Mixing"],
    genre: ["Trap", "Pop"],
    date: "Ongoing",
    slots: 5,
    liked: true,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
  },
  {
    id: 3,
    title: "Name Your Price Session",
    type: 'bid',
    studio: {
      name: "Vocal Booth Pro",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 4.7,
    },
    price: "Bid Now",
    duration: "1-4 hours",
    location: "Miami, FL",
    equipment: ["Isolation Booth", "U87 Mic"],
    genre: ["Rap", "Vocals"],
    date: "Next Week",
    slots: 10,
    liked: false,
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
  },
  {
    id: 4,
    title: "Late-Night Discount",
    type: 'deal',
    studio: {
      name: "Beat Factory",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
      rating: 4.5,
    },
    price: 30,
    originalPrice: 70,
    discount: 57,
    duration: "1 hour",
    location: "Chicago, IL",
    equipment: ["SSL Console", "Drum Room"],
    genre: ["Rock", "Alternative"],
    date: "Tonight 10PM-2AM",
    slots: 2,
    liked: false,
    image: "https://images.unsplash.com/photo-1501612780327-45045538702b",
  },
];

const activityData: Activity[] = [
  {
    id: 1,
    user: {
      name: "Trapper King",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg"
    },
    action: 'booked',
    session: "Weekend Studio Blowout",
    price: "$50",
    time: "5 min ago"
  },
  {
    id: 2,
    user: {
      name: "Luna Sky",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg"
    },
    action: 'requested',
    session: "Collab with Producer Alex",
    price: "$80",
    time: "25 min ago"
  },
  {
    id: 3,
    user: {
      name: "Urban Flow",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg"
    },
    action: 'accepted',
    session: "Name Your Price Session",
    price: "$65",
    time: "1 hour ago"
  },
  {
    id: 4,
    user: {
      name: "Soulful Sam",
      avatar: "https://randomuser.me/api/portraits/men/55.jpg"
    },
    action: 'rejected',
    session: "Late-Night Discount",
    price: "$25",
    time: "2 hours ago"
  },
];

export default function SessionBookings() {
  const [activeTab, setActiveTab] = useState("deals");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bidPrice, setBidPrice] = useState(50);
  const [sessions, setSessions] = useState<BookingSession[]>(sessionData);

  const toggleLike = (id: number) => {
    setSessions(sessions.map(session => 
      session.id === id ? { ...session, liked: !session.liked } : session
    ));
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleBidSubmit = () => {
    message.success(`Bid submitted for $${bidPrice}!`);
    setIsModalOpen(false);
  };

  const filteredSessions = sessions.filter(session => {
  const matchesSearch =
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (session.studio?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.producer?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const matchesGenre = selectedGenre === "all" || session.genre.includes(selectedGenre);
  const matchesLocation = selectedLocation === "all" || session.location.includes(selectedLocation);
  const matchesPrice =
    typeof session.price === "number"
      ? session.price >= priceRange[0] && session.price <= priceRange[1]
      : true;
  return matchesSearch && matchesGenre && matchesLocation && matchesPrice;
});
  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Bookings</h1>
            <p className="text-gray-600">Find deals, collabs, or name your price for studio time</p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search studios, producers, deals..."
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
              <Option value="R&B">R&B</Option>
              <Option value="Pop">Pop</Option>
              <Option value="Rock">Rock</Option>
              <Option value="Electronic">Electronic</Option>
            </Select>
            <Select
              placeholder="All Locations"
              className="w-full md:w-[180px]"
              value={selectedLocation}
              onChange={(value) => setSelectedLocation(value)}
            >
              <Option value="all">All Locations</Option>
              <Option value="Los Angeles">Los Angeles</Option>
              <Option value="New York">New York</Option>
              <Option value="Miami">Miami</Option>
              <Option value="Chicago">Chicago</Option>
              <Option value="Online">Online</Option>
            </Select>
            <Button type="primary" icon={<FilterOutlined />}>
              More Filters
            </Button>
          </div>

          {/* Price Range Slider */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">Price Range: ${priceRange[0]} - ${priceRange[1]}</h4>
            <Slider 
              range 
              min={0} 
              max={200} 
              defaultValue={[0, 200]} 
              onChange={(value) => setPriceRange(value)} 
            />
          </div>

          {/* Tabs */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            className="mb-6"
            tabBarExtraContent={
              <Radio.Group defaultValue="all" size="small">
                <Radio.Button value="all">All</Radio.Button>
                <Radio.Button value="studios">Studios</Radio.Button>
                <Radio.Button value="producers">Producers</Radio.Button>
              </Radio.Group>
            }
          >
            <TabPane tab={<span><FireOutlined /> Hot Deals</span>} key="deals" />
            <TabPane tab={<span><UserOutlined /> Collabs</span>} key="collabs" />
            <TabPane tab={<span><DollarOutlined /> Name Your Price</span>} key="bids" />
          </Tabs>

          {/* Sessions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <Card
                key={session.id}
                hoverable
                className="relative border rounded-lg overflow-hidden"
                cover={
                  <div className="relative h-40 group">
                    <img 
                      alt={session.title} 
                      src={session.image} 
                      className="w-full h-full object-cover"
                    />
                    {session.type === 'deal' && session.discount && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        {session.discount}% OFF
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <h3 className="text-white font-bold text-lg">{session.title}</h3>
                      <div className="flex items-center text-white/80 text-sm">
                        <EnvironmentOutlined className="mr-1" />
                        {session.location}
                      </div>
                    </div>
                  </div>
                }
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={session.studio?.avatar || session.producer?.avatar} />
                    <div>
                      <div className="font-medium">
                        {session.studio?.name || session.producer?.name}
                      </div>
                      <Rate 
                        disabled 
                        defaultValue={session.studio?.rating || session.producer?.rating} 
                        allowHalf 
                        character={<StarFilled className="text-sm" />}
                        className="[&_.ant-rate-star]:mr-0.5"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleLike(session.id)}
                    className="text-lg"
                  >
                    {session.liked ? (
                      <HeartFilled className="text-red-500" />
                    ) : (
                      <HeartOutlined />
                    )}
                  </button>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">
                      <ClockCircleOutlined className="mr-1" />
                      {session.duration}
                    </span>
                    <span className="text-sm text-gray-500">
                      {session.date}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {session.genre.map((g, i) => (
                      <Tag key={i} className="text-xs">{g}</Tag>
                    ))}
                    {session.equipment.slice(0, 2).map((e, i) => (
                      <Tag key={`e-${i}`} color="blue" className="text-xs">{e}</Tag>
                    ))}
                    {session.equipment.length > 2 && (
                      <Popover content={
                        <div className="p-2">
                          {session.equipment.slice(2).map((e, i) => (
                            <div key={i} className="text-xs py-1">{e}</div>
                          ))}
                        </div>
                      }>
                        <Tag className="text-xs cursor-pointer">+{session.equipment.length - 2} more</Tag>
                      </Popover>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div>
                    {session.type === 'deal' && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold">${session.price}</span>
                        {session.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">${session.originalPrice}</span>
                        )}
                      </div>
                    )}
                    {session.type === 'collab' && (
                      <span className="text-gray-700">{session.price}</span>
                    )}
                    {session.type === 'bid' && (
                      <span className="text-gray-700 font-medium">Bid Your Price</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {session.slots} slot{session.slots !== 1 ? 's' : ''} left
                  </div>
                </div>

                {session.type === 'bid' ? (
                  <Button 
                    type="primary" 
                    block 
                    onClick={showModal}
                    className="flex items-center justify-center"
                  >
                    Make an Offer
                  </Button>
                ) : (
                  <Button 
                    type="primary" 
                    block 
                    className="flex items-center justify-center"
                  >
                    {session.type === 'collab' ? 'Request Collab' : 'Book Now'}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Sidebar */}
      <div className="w-80 border-l border-gray-200 hidden xl:block p-6 bg-gray-50 overflow-y-auto">
        <div className="sticky top-6">
          <h2 className="text-lg font-bold mb-4">Booking Activity</h2>
          
          <Tabs defaultActiveKey="live" size="small">
            <TabPane tab="Live" key="live" />
            <TabPane tab="Recent" key="recent" />
            <TabPane tab="My Activity" key="my" />
          </Tabs>

          <div className="space-y-4 mt-4">
            {activityData.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors">
                <Avatar src={activity.user.avatar} />
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>{" "}
                    {activity.action === 'booked' && (
                      <span>booked <span className="font-medium">{activity.session}</span> for {activity.price}</span>
                    )}
                    {activity.action === 'requested' && (
                      <span>requested <span className="font-medium">{activity.session}</span> at {activity.price}</span>
                    )}
                    {activity.action === 'accepted' && (
                      <span>accepted a bid for <span className="font-medium">{activity.session}</span> at {activity.price}</span>
                    )}
                    {activity.action === 'rejected' && (
                      <span>rejected a bid for <span className="font-medium">{activity.session}</span> at {activity.price}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
                {activity.action === 'booked' && (
                  <Tag color="green" icon={<CheckOutlined />} className="text-xs">Booked</Tag>
                )}
                {activity.action === 'requested' && (
                  <Tag color="orange" className="text-xs">Pending</Tag>
                )}
                {activity.action === 'accepted' && (
                  <Tag color="blue" icon={<CheckOutlined />} className="text-xs">Accepted</Tag>
                )}
                {activity.action === 'rejected' && (
                  <Tag color="red" icon={<CloseOutlined />} className="text-xs">Rejected</Tag>
                )}
              </div>
            ))}
          </div>

          <Divider className="my-6" />

          <div>
            <h3 className="font-bold mb-3">Trending Studios</h3>
            <List
              dataSource={sessions.filter(s => s.studio).slice(0, 5)}
              renderItem={(session) => (
                <List.Item className="!px-0 !py-2">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar src={session.studio?.avatar} />
                    <div className="flex-1">
                      <div className="font-medium">{session.studio?.name}</div>
                      <div className="text-xs text-gray-500">{session.location}</div>
                    </div>
                    <Button size="small" type="text" className="text-blue-500">View</Button>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      <Modal 
        title="Make an Offer" 
        open={isModalOpen} 
        onOk={handleBidSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText="Submit Bid"
      >
        <div className="mb-4">
          <h4 className="mb-2">Your Offer Price:</h4>
          <div className="flex items-center gap-4">
            <Slider 
              min={20} 
              max={200} 
              value={bidPrice} 
              onChange={(value) => setBidPrice(value)} 
              className="flex-1"
            />
            <span className="font-bold">${bidPrice}</span>
          </div>
        </div>
        <div className="mb-4">
          <h4 className="mb-2">Session Details:</h4>
          <div className="text-sm text-gray-600">
            <div>Studio: Vocal Booth Pro</div>
            <div>Duration: 1-4 hours</div>
            <div>Equipment: Isolation Booth, U87 Mic</div>
          </div>
        </div>
        <div>
          <h4 className="mb-2">Add a Message (Optional):</h4>
          <Input.TextArea placeholder="E.g., 'I need 2 hours for vocal recording...'" />
        </div>
      </Modal>
    </div>
  );
}