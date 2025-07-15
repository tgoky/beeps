// app/producers/[id]/page.tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Avatar, Card, Tag, Rate, Space, Button, Tabs, Divider, List, Input, message, Collapse, Modal } from "antd";
import { StarFilled, HeartOutlined, MessageOutlined, ShareAltOutlined, PlayCircleOutlined, UserAddOutlined, MailOutlined, LinkOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Image from "next/image";

const { TabPane } = Tabs;
const { Panel } = Collapse;

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

const producerData: Producer[] = [
  // Same producer data as before, but let's add more details
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
  // ... other producers
];

export default function ProducerProfile() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState("services");
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Array<{sender: string, text: string, time: string}>>([]);
  
  const producer = producerData.find(p => p.id === Number(params.id));

  if (!producer) {
    return <div>Producer not found</div>;
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const sendMessage = () => {
    if (!messageText.trim()) return;
    
    const newMessage = {
      sender: "You",
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setMessageText("");
    message.success("Message sent!");
    
    // Simulate reply after 1-3 seconds
    setTimeout(() => {
      const reply = {
        sender: producer.name,
        text: "Thanks for reaching out! I'll get back to you soon.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, reply]);
    }, 1000 + Math.random() * 2000);
  };

  return (
    <div className="max-w-[1200px] mx-auto p-4">
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => window.history.back()}
        className="mb-4"
      >
        Back to Producers
      </Button>

      {/* Cover and Profile Header */}
      <div className="relative rounded-lg overflow-hidden mb-6">
        <img 
          src={producer.cover} 
          alt={producer.name} 
          className="w-full h-64 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
          <div className="flex items-end">
            <Avatar 
              src={producer.avatar} 
              size={100} 
              className="border-4 border-white mr-4"
            />
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{producer.name}</h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">{producer.handle}</span>
                <Tag color={producer.online ? "green" : "red"} className="text-xs">
                  {producer.online ? "Online" : producer.lastActive}
                </Tag>
                <Rate 
                  disabled 
                  defaultValue={producer.rating} 
                  allowHalf 
                  character={<StarFilled />}
                  className="[&_.ant-rate-star]:mr-0.5 text-sm"
                />
                <span className="text-white text-sm">{producer.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 mb-6">
        <Button 
          type="primary" 
          icon={<MessageOutlined />}
          onClick={() => setMessageModalVisible(true)}
        >
          Send Message
        </Button>
        <Button icon={<HeartOutlined />}>Follow</Button>
        <Button icon={<ShareAltOutlined />}>Share</Button>
        <Button icon={<UserAddOutlined />}>Collaborate</Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Services" key="services" />
            <TabPane tab="Works" key="works" />
          
            <TabPane tab="Credits" key="credits" />
            <TabPane tab="Reviews" key="reviews" />
          </Tabs>

          {activeTab === "works" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Recent Works</h2>
              {producer.recentWorks.map((work, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <div className="flex">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={work.image}
                        alt={work.title}
                        width={80}
                        height={80}
                        className="rounded object-cover"
                      />
                      <PlayCircleOutlined className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-medium">{work.title}</h3>
                      <p className="text-gray-600 text-sm">{work.artist}</p>
                      <p className="text-gray-500 text-xs">{formatNumber(work.plays)} plays</p>
                    </div>
                    <Button type="text" icon={<HeartOutlined />} />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "services" && producer.services && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Services Offered</h2>
              {producer.services.map((service, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{service.name}</h3>
                      <p className="text-gray-600 text-sm">{service.description}</p>
                    </div>
                    <Tag color="blue" className="text-lg font-semibold">
                      {service.price}
                    </Tag>
                  </div>
                  <Button type="primary" className="mt-3">
                    Request Service
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "credits" && producer.credits && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold mb-4">Credits & Achievements</h2>
              <List
                dataSource={producer.credits}
                renderItem={(item) => (
                  <List.Item>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      {item}
                    </div>
                  </List.Item>
                )}
              />
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* About */}
          <Card title="About">
            <p className="text-gray-700 mb-4">{producer.bio}</p>
            <div className="mb-2">
              <span className="font-semibold">Location:</span> {producer.location}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Genres:</span> {producer.genres.join(", ")}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Skills:</span> {producer.skills.join(", ")}
            </div>
          </Card>

          {/* Featured Gear */}
          {producer.featuredGear && (
            <Card title="Featured Gear">
              <List
                dataSource={producer.featuredGear}
                renderItem={(item) => (
                  <List.Item>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      {item}
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Social Stats */}
          <Card title="Stats">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{formatNumber(producer.social.followers)}</div>
                <div className="text-gray-500 text-sm">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatNumber(producer.social.following)}</div>
                <div className="text-gray-500 text-sm">Following</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{producer.social.posts}</div>
                <div className="text-gray-500 text-sm">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{producer.recentWorks.length}</div>
                <div className="text-gray-500 text-sm">Tracks</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Message Modal */}
      <Modal
        title={`Message ${producer.name}`}
        visible={messageModalVisible}
        onCancel={() => setMessageModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setMessageModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="send" 
            type="primary" 
            onClick={sendMessage}
            disabled={!messageText.trim()}
          >
            Send
          </Button>,
        ]}
      >
        <div className="h-64 overflow-y-auto mb-4 border rounded p-3 bg-gray-50">
          {messages.length > 0 ? (
            messages.map((msg, index) => (
              <div 
                key={index} 
                className={`mb-3 ${msg.sender === "You" ? "text-right" : "text-left"}`}
              >
                <div className={`inline-block p-2 rounded-lg ${msg.sender === "You" ? "bg-blue-100" : "bg-gray-200"}`}>
                  <div className="font-medium text-xs text-gray-500 mb-1">
                    {msg.sender} • {msg.time}
                  </div>
                  <div>{msg.text}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              Start a conversation with {producer.name}
            </div>
          )}
        </div>
        <Input.TextArea
          rows={3}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder={`Message ${producer.name}...`}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
      </Modal>
    </div>
  );
}