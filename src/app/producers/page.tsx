"use client";

import { useState, useEffect } from "react";
import { List, useTable } from "@refinedev/antd";
import { Avatar, Card, Tag, Rate, Space, Button, Input, Select, message, Tabs, Badge, Divider } from "antd";
import { SearchOutlined, FilterOutlined, StarFilled, HeartOutlined, MessageOutlined, ShareAltOutlined, EllipsisOutlined, PlayCircleOutlined, UserAddOutlined } from "@ant-design/icons";
import { IResourceComponentsProps } from "@refinedev/core";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { producerData } from "./producersdata";



const { Meta } = Card;
const { Option } = Select;
const { TabPane } = Tabs;

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
};

export default function ProducerHub() {
  const { tableProps } = useTable({
    syncWithLocation: true,
  });

  const [activeTab, setActiveTab] = useState("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");

    const router = useRouter();

  // Mock data for producers
  

  const filteredProducers = producerData.filter(producer => {
    const matchesSearch = producer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         producer.handle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "all" || producer.genres.includes(selectedGenre);
    return matchesSearch && matchesGenre;
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
    <div className="p-4 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Producer Hub</h1>
        <p className="text-sm text-gray-600">Connect with top music producers worldwide</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search producers..."
          prefix={<SearchOutlined />}
          className="w-full sm:w-[300px]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select
          placeholder="All Genres"
          className="w-full sm:w-[200px]"
          value={selectedGenre}
          onChange={(value) => setSelectedGenre(value)}
        >
          <Option value="all">All Genres</Option>
          <Option value="Hip Hop">Hip Hop</Option>
          <Option value="Trap">Trap</Option>
          <Option value="R&B">R&B</Option>
          <Option value="Electronic">Electronic</Option>
          <Option value="Pop">Pop</Option>
          <Option value="Jazz">Jazz</Option>
          <Option value="Soul">Soul</Option>
        </Select>
        <Button type="primary" icon={<UserAddOutlined />}>
          Recommended
        </Button>
      </div>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-6">
        <TabPane tab="Trending" key="trending" />
        <TabPane tab="Nearby" key="nearby" />
        <TabPane tab="New Producers" key="new" />
        <TabPane tab="Verified" key="verified" />
      </Tabs>

      {/* Producers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducers.map((producer) => (
          <Card
            key={producer.id}
            className="w-full overflow-hidden hover:shadow-lg transition-shadow duration-300"
            cover={
              <div className="relative h-40">
                <img 
                  alt={producer.name} 
                  src={producer.cover} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 flex items-center">
                  <Badge 
                    dot 
                    color={producer.online ? "#52c41a" : "#f5222d"} 
                    className="mr-2"
                  >
                    <Avatar 
                      src={producer.avatar} 
                      size={64} 
                      className="border-2 border-white"
                    />
                  </Badge>
                  <div className="ml-2 text-white drop-shadow-md">
                    <h3 className="font-bold text-lg">{producer.name}</h3>
                    <p className="text-sm">{producer.handle}</p>
                  </div>
                </div>
              </div>
            }
          actions={[
  <div key="actions" className="flex justify-between px-4">
    <div className="flex items-center">
      <HeartOutlined className="mr-1" />
      <span>{formatNumber(producer.social.followers)}</span>
    </div>
    <div className="flex items-center">
      <MessageOutlined className="mr-1" />
      <span>{producer.social.posts}</span>
    </div>
    <ShareAltOutlined />
  </div>
]}

          >
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <Rate 
                    disabled 
                    defaultValue={producer.rating} 
                    allowHalf 
                    character={<StarFilled />}
                    className="[&_.ant-rate-star]:mr-0.5 text-sm"
                  />
                  <span className="text-xs text-gray-500 ml-2">{producer.rating.toFixed(1)}</span>
                </div>
                <Tag color={producer.online ? "green" : "red"} className="text-xs">
                  {producer.online ? "Online" : producer.lastActive}
                </Tag>
              </div>

              <div className="mb-3">
                <h4 className="text-xs font-semibold mb-1">GENRES</h4>
                <Space size={[4, 8]} wrap>
                  {producer.genres.map((genre, index) => (
                    <Tag key={index} className="text-xs px-2 py-0.5">{genre}</Tag>
                  ))}
                </Space>
              </div>

              <div className="mb-3">
                <h4 className="text-xs font-semibold mb-1">SKILLS</h4>
                <Space size={[4, 8]} wrap>
                  {producer.skills.map((skill, index) => (
                    <Tag key={index} color="blue" className="text-xs px-2 py-0.5">{skill}</Tag>
                  ))}
                </Space>
              </div>
            </div>

            <Divider className="my-3" />

            <div className="mb-4">
              <h4 className="text-xs font-semibold mb-2">RECENT WORK</h4>
              <div className="space-y-3">
                {producer.recentWorks.map((work) => (
  <div key={work.title} className="flex items-center gap-3">
                    <div className="relative">
                     <Image
                     src={work.image}
                     alt={work.title}
                     width={48}
                      height={48}
                     className="rounded object-cover"
                      />
                      <PlayCircleOutlined className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{work.title}</div>
                      <div className="text-xs text-gray-500">{work.artist}</div>
                    </div>
                    <div className="text-xs text-gray-500">{formatNumber(work.plays)} plays</div>
                  </div>
                ))}
              </div>
            </div>

<Button 
  block 
  type="primary" 
  className="mt-2 h-8 text-xs font-medium"
  onClick={() => router.push(`/producers/create/${producer.id}`)}
>
  View Profile
</Button>
            <Button 
              block 
              className="mt-2 h-8 text-xs font-medium"
            >
              Send Message
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}