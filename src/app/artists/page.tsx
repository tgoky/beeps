"use client";

import { 
  Card, 
  Avatar, 
  Button, 
  Tabs, 
  List, 
  Tag, 
  Progress, 
  Statistic, 
  Divider, 
  Input, 
  Upload, 
  Select, 
  Switch, 
  Form, 
  message,
  Badge,
  Rate,
  Modal,
  Collapse,
  Radio,
  Slider
} from "antd";
import { 
  EditOutlined, 
  MailOutlined, 
  LinkOutlined, 
  EnvironmentOutlined, 
  TeamOutlined, 
  SoundOutlined, 
  FileTextOutlined, 
  HeartOutlined, 
  MessageOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  LockOutlined,
  CheckOutlined,
  PlusOutlined,
  UploadOutlined,
  StarOutlined,
  CrownOutlined,
  SafetyOutlined,
  DollarOutlined,
  BankOutlined
} from "@ant-design/icons";
import { useState } from "react";

const { TabPane } = Tabs;
const { Option } = Select;
const { Panel } = Collapse;

// Mock user data
const userProfile = {
  id: 1,
  name: "Alex Melody",
  username: "@alexmelody",
  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  bio: "Professional producer & songwriter. Creating hits since 2015. Let's make something amazing together!",
  location: "Los Angeles, CA",
  website: "alexmelody.com",
  verified: true,
  proMember: true,
  stats: {
    followers: 12400,
    following: 843,
    snippets: 56,
    collabs: 32,
    completedProjects: 78,
    avgRating: 4.7
  },
  skills: ["Producer", "Songwriter", "Mixing Engineer", "Vocalist"],
  genres: ["Pop", "R&B", "Hip Hop"],
  equipment: ["Ableton Live", "Neumann U87", "Apollo Twin", "Komplete Kontrol"],
  rates: {
    production: "$500-$1000",
    songwriting: "$300-$700",
    mixing: "$200-$400"
  },
  availability: "Available for new projects",
  socialLinks: {
    instagram: "instagram.com/alexmelody",
    twitter: "twitter.com/alexmelody",
    soundcloud: "soundcloud.com/alexmelody",
    youtube: "youtube.com/alexmelody"
  }
};

const userActivity = [
  {
    id: 1,
    type: "upload",
    title: "Uploaded new snippet 'Summer Vibes'",
    date: "2 hours ago"
  },
  {
    id: 2,
    type: "collab",
    title: "Started collab with @vocalqueen on 'Midnight Dreams'",
    date: "1 day ago"
  },
  {
    id: 3,
    type: "like",
    title: "Liked snippet 'Lofi Chill Loop' by @chillbeats",
    date: "2 days ago"
  },
  {
    id: 4,
    type: "follow",
    title: "Followed @beatmaster",
    date: "3 days ago"
  },
  {
    id: 5,
    type: "complete",
    title: "Completed project 'City Lights' with @urbanrecords",
    date: "1 week ago"
  }
];

const userSnippets = [
  {
    id: 1,
    title: "Summer Vibes Hook",
    plays: 1245,
    likes: 342,
    duration: "1:02",
    genre: "Pop",
    date: "2 days ago"
  },
  {
    id: 2,
    title: "R&B Vocal Loop",
    plays: 876,
    likes: 231,
    duration: "0:45",
    genre: "R&B",
    date: "1 week ago"
  },
  {
    id: 3,
    title: "Trap 808 Pattern",
    plays: 765,
    likes: 198,
    duration: "0:52",
    genre: "Hip Hop",
    date: "2 weeks ago"
  }
];

const userCollabs = [
  {
    id: 1,
    title: "Midnight Dreams (with @vocalqueen)",
    status: "in-progress",
    progress: 65,
    date: "1 week ago"
  },
  {
    id: 2,
    title: "City Lights (with @urbanrecords)",
    status: "completed",
    progress: 100,
    date: "3 weeks ago"
  },
  {
    id: 3,
    title: "Lonely Nights (with @soulsinger)",
    status: "on-hold",
    progress: 30,
    date: "1 month ago"
  }
];

const userReviews = [
  {
    id: 1,
    user: {
      name: "Vocal Queen",
      avatar: "https://randomuser.me/api/portraits/women/22.jpg"
    },
    rating: 5,
    comment: "Alex is an amazing producer to work with! Delivered exactly what I needed and was very professional.",
    date: "2 weeks ago"
  },
  {
    id: 2,
    user: {
      name: "Beat Master",
      avatar: "https://randomuser.me/api/portraits/men/41.jpg"
    },
    rating: 4,
    comment: "Great communication and solid production skills. Would collab again!",
    date: "1 month ago"
  }
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("activity");
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isEmailPublic, setIsEmailPublic] = useState(true);
  const [isLocationPublic, setIsLocationPublic] = useState(true);
  const [isSocialLinksPublic, setIsSocialLinksPublic] = useState(true);

  const handleEditProfile = () => {
    form.setFieldsValue({
      name: userProfile.name,
      username: userProfile.username,
      bio: userProfile.bio,
      location: userProfile.location,
      website: userProfile.website,
      skills: userProfile.skills,
      genres: userProfile.genres,
      equipment: userProfile.equipment,
      availability: userProfile.availability
    });
    setEditMode(true);
  };

  const { TextArea } = Input; 
  
  const handleSaveProfile = () => {
    message.success('Profile updated successfully');
    setEditMode(false);
  };

  const showRateModal = () => {
    setIsRateModalOpen(true);
  };

  const handleRateUpdate = () => {
    message.success('Rates updated successfully');
    setIsRateModalOpen(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Cover Photo */}
      <div 
        className="h-64 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${userProfile.coverImage})` }}
      >
        {editMode && (
          <div className="absolute top-4 right-4">
            <Upload showUploadList={false}>
              <Button type="primary" icon={<UploadOutlined />}>
                Change Cover
              </Button>
            </Upload>
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col md:flex-row gap-6 -mt-16 relative z-10">
          {/* Avatar Section */}
          <div className="flex-shrink-0">
            <div className="relative">
              <Avatar 
                size={128} 
                src={userProfile.avatar} 
                className="border-4 border-white shadow-lg"
              />
              {editMode && (
                <Upload showUploadList={false} className="absolute bottom-0 right-0">
                  <Button 
                    shape="circle" 
                    icon={<EditOutlined />} 
                    className="shadow-md"
                  />
                </Upload>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">
                    {editMode ? (
                      <Form.Item name="name" noStyle>
                        <Input className="text-3xl font-bold p-0 border-none" />
                      </Form.Item>
                    ) : (
                      userProfile.name
                    )}
                  </h1>
                  {userProfile.verified && (
                    <CrownOutlined className="text-blue-500 text-xl" />
                  )}
                </div>
                
                <div className="text-gray-600 mb-2">
                  {editMode ? (
                    <Form.Item name="username" noStyle>
                      <Input 
                        prefix="@" 
                        className="border-none p-0 bg-transparent" 
                        style={{ width: 200 }}
                      />
                    </Form.Item>
                  ) : (
                    userProfile.username
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {!editMode ? (
                  <>
                    <Button 
                      icon={<EditOutlined />} 
                      onClick={handleEditProfile}
                    >
                      Edit Profile
                    </Button>
                    <Button type="primary" icon={<MailOutlined />}>
                      Contact
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="primary" 
                      onClick={handleSaveProfile}
                    >
                      Save Changes
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mb-4">
              {editMode ? (
                <Form.Item name="bio" noStyle>
                  <TextArea 
                    rows={3} 
                    placeholder="Tell us about yourself..." 
                    className="border-gray-300"
                  />
                </Form.Item>
              ) : (
                <p className="text-gray-700">{userProfile.bio}</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <Statistic 
                title="Followers" 
                value={userProfile.stats.followers} 
                className="text-center"
              />
              <Statistic 
                title="Following" 
                value={userProfile.stats.following} 
                className="text-center"
              />
              <Statistic 
                title="Snippets" 
                value={userProfile.stats.snippets} 
                className="text-center"
              />
              <Statistic 
                title="Collabs" 
                value={userProfile.stats.collabs} 
                className="text-center"
              />
              <div className="flex flex-col items-center">
                <Rate 
                  disabled 
                  defaultValue={userProfile.stats.avgRating} 
                  allowHalf 
                  className="text-sm"
                />
                <span className="text-gray-600 text-sm">
                  {userProfile.stats.avgRating} avg rating
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {editMode ? (
                <>
                  <Form.Item name="location" noStyle>
                    <Input 
                      prefix={<EnvironmentOutlined />} 
                      placeholder="Location" 
                      className="w-48"
                    />
                  </Form.Item>
                  <Form.Item name="website" noStyle>
                    <Input 
                      prefix={<LinkOutlined />} 
                      placeholder="Website" 
                      className="w-48"
                    />
                  </Form.Item>
                </>
              ) : (
                <>
                  {userProfile.location && (
                    <div className="flex items-center">
                      <EnvironmentOutlined className="mr-1" />
                      {userProfile.location}
                    </div>
                  )}
                  {userProfile.website && (
                    <div className="flex items-center">
                      <LinkOutlined className="mr-1" />
                      <a href={`https://${userProfile.website}`} target="_blank" rel="noopener noreferrer">
                        {userProfile.website}
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <Divider />

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar */}
          <div className="w-full lg:w-1/3">
            <Card className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Skills & Services</h2>
                {editMode && (
                  <Button type="link" size="small" icon={<PlusOutlined />}>
                    Add
                  </Button>
                )}
              </div>
              
              {editMode ? (
                <Form.Item name="skills" noStyle>
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Add your skills"
                  />
                </Form.Item>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userProfile.skills.map((skill, i) => (
                    <Tag key={i} color="blue">{skill}</Tag>
                  ))}
                </div>
              )}
            </Card>

            <Card className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Genres</h2>
                {editMode && (
                  <Button type="link" size="small" icon={<PlusOutlined />}>
                    Add
                  </Button>
                )}
              </div>
              
              {editMode ? (
                <Form.Item name="genres" noStyle>
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Add genres you work with"
                  />
                </Form.Item>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userProfile.genres.map((genre, i) => (
                    <Tag key={i}>{genre}</Tag>
                  ))}
                </div>
              )}
            </Card>

            <Card className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Equipment</h2>
                {editMode && (
                  <Button type="link" size="small" icon={<PlusOutlined />}>
                    Add
                  </Button>
                )}
              </div>
              
              {editMode ? (
                <Form.Item name="equipment" noStyle>
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Add your equipment"
                  />
                </Form.Item>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userProfile.equipment.map((item, i) => (
                    <Tag key={i} color="purple">{item}</Tag>
                  ))}
                </div>
              )}
            </Card>

            <Card className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Rates</h2>
                <Button 
                  type="link" 
                  size="small" 
                  icon={<EditOutlined />}
                  onClick={showRateModal}
                >
                  Edit
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Production:</span>
                  <span className="font-medium">{userProfile.rates.production}</span>
                </div>
                <div className="flex justify-between">
                  <span>Songwriting:</span>
                  <span className="font-medium">{userProfile.rates.songwriting}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mixing:</span>
                  <span className="font-medium">{userProfile.rates.mixing}</span>
                </div>
              </div>
            </Card>

            <Card className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Availability</h2>
                {editMode && (
                  <Button type="link" size="small" icon={<EditOutlined />}>
                    Edit
                  </Button>
                )}
              </div>
              
              {editMode ? (
                <Form.Item name="availability" noStyle>
                  <Select
                    style={{ width: '100%' }}
                    defaultValue={userProfile.availability}
                  >
                    <Option value="Available for new projects">Available for new projects</Option>
                    <Option value="Limited availability">Limited availability</Option>
                    <Option value="Not currently available">Not currently available</Option>
                  </Select>
                </Form.Item>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge status="success" />
                  <span>{userProfile.availability}</span>
                </div>
              )}
            </Card>

            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Social Links</h2>
                {editMode && (
                  <Button type="link" size="small" icon={<PlusOutlined />}>
                    Add
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                {Object.entries(userProfile.socialLinks).map(([platform, link]) => (
                  <div key={platform} className="flex items-center">
                    <span className="w-24 capitalize">{platform}:</span>
                    {editMode ? (
                      <Input 
                        value={link} 
                        className="flex-1" 
                        prefix={<LinkOutlined />}
                      />
                    ) : (
                      <a 
                        href={`https://${link}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500"
                      >
                        {link}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Privacy Settings (only visible to profile owner) */}
            {editMode && (
              <Card className="mt-6">
                <h2 className="font-bold text-lg mb-4">Privacy Settings</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Private Account</div>
                      <div className="text-sm text-gray-500">
                        {isPrivate ? 
                          "Only approved followers can see your content" : 
                          "Anyone can see your profile and content"}
                      </div>
                    </div>
                    <Switch 
                      checked={isPrivate} 
                      onChange={setIsPrivate}
                      checkedChildren={<LockOutlined />}
                      unCheckedChildren={<UserOutlined />}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Show Email</div>
                      <div className="text-sm text-gray-500">
                        {isEmailPublic ? 
                          "Your email is visible to others" : 
                          "Your email is private"}
                      </div>
                    </div>
                    <Switch 
                      checked={isEmailPublic} 
                      onChange={setIsEmailPublic}
                      checkedChildren={<CheckOutlined />}
                      unCheckedChildren={<PlusOutlined />}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Show Location</div>
                      <div className="text-sm text-gray-500">
                        {isLocationPublic ? 
                          "Your location is visible" : 
                          "Your location is hidden"}
                      </div>
                    </div>
                    <Switch 
                      checked={isLocationPublic} 
                      onChange={setIsLocationPublic}
                      checkedChildren={<CheckOutlined />}
                      unCheckedChildren={<PlusOutlined />}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Show Social Links</div>
                      <div className="text-sm text-gray-500">
                        {isSocialLinksPublic ? 
                          "Your social links are visible" : 
                          "Your social links are hidden"}
                      </div>
                    </div>
                    <Switch 
                      checked={isSocialLinksPublic} 
                      onChange={setIsSocialLinksPublic}
                      checkedChildren={<CheckOutlined />}
                      unCheckedChildren={<PlusOutlined />}
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="w-full lg:w-2/3">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              tabBarExtraContent={
                !editMode && (
                  <Button type="primary" icon={<PlusOutlined />}>
                    Upload Snippet
                  </Button>
                )
              }
            >
              <TabPane 
                tab={
                  <span>
                    <ClockCircleOutlined />
                    Activity
                  </span>
                } 
                key="activity"
              >
                <List
                  itemLayout="horizontal"
                  dataSource={userActivity}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <div className="bg-gray-100 p-3 rounded-full">
                            {item.type === "upload" && <SoundOutlined />}
                            {item.type === "collab" && <TeamOutlined />}
                            {item.type === "like" && <HeartOutlined />}
                            {item.type === "follow" && <UserOutlined />}
                            {item.type === "complete" && <CheckOutlined />}
                          </div>
                        }
                        title={item.title}
                        description={<span className="text-gray-500">{item.date}</span>}
                      />
                    </List.Item>
                  )}
                />
              </TabPane>
              
              <TabPane 
                tab={
                  <span>
                    <SoundOutlined />
                    Snippets
                  </span>
                } 
                key="snippets"
              >
                <List
                  itemLayout="horizontal"
                  dataSource={userSnippets}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <span key="plays">{item.plays} plays</span>,
                        <span key="likes">{item.likes} likes</span>,
                        <Button key="edit" type="link" icon={<EditOutlined />} />
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div className="bg-gray-100 p-3 rounded-lg">
                            <PlusOutlined className="text-2xl" />
                          </div>
                        }
                        title={<a>{item.title}</a>}
                        description={
                          <>
                            <Tag>{item.genre}</Tag>
                            <span className="text-gray-500">{item.duration}</span>
                            <span className="text-gray-500 ml-2">{item.date}</span>
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
              </TabPane>
              
              <TabPane 
                tab={
                  <span>
                    <TeamOutlined />
                    Collaborations
                  </span>
                } 
                key="collabs"
              >
                <List
                  itemLayout="horizontal"
                  dataSource={userCollabs}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Button key="view" type="link">View</Button>,
                        <Button key="edit" type="link" icon={<EditOutlined />} />
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div className="bg-gray-100 p-3 rounded-full">
                            <TeamOutlined className="text-xl" />
                          </div>
                        }
                        title={<a>{item.title}</a>}
                        description={
                          <div className="w-full">
                            <div className="flex justify-between mb-1">
                              <span className="capitalize">{item.status.replace('-', ' ')}</span>
                              <span>{item.progress}%</span>
                            </div>
                            <Progress 
                              percent={item.progress} 
                              status={
                                item.status === "completed" ? "success" :
                                item.status === "on-hold" ? "exception" : "active"
                              }
                            />
                            <div className="text-gray-500 text-sm mt-1">{item.date}</div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </TabPane>
              
              <TabPane 
                tab={
                  <span>
                    <StarOutlined />
                    Reviews
                  </span>
                } 
                key="reviews"
              >
                <List
                  itemLayout="horizontal"
                  dataSource={userReviews}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar src={item.user.avatar} />}
                        title={
                          <div className="flex justify-between">
                            <span>{item.user.name}</span>
                            <Rate 
                              disabled 
                              defaultValue={item.rating} 
                              className="text-sm"
                            />
                          </div>
                        }
                        description={
                          <>
                            <p>{item.comment}</p>
                            <div className="text-gray-500 text-sm">{item.date}</div>
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
              </TabPane>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Rate Update Modal */}
      <Modal
        title="Update Your Rates"
        open={isRateModalOpen}
        onOk={handleRateUpdate}
        onCancel={() => setIsRateModalOpen(false)}
        width={600}
      >
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Production Rate</h3>
            <div className="flex items-center gap-4">
              <Select defaultValue="$" style={{ width: 80 }}>
                <Option value="$">$ USD</Option>
                <Option value="€">€ EUR</Option>
                <Option value="£">£ GBP</Option>
              </Select>
              <Slider 
                range 
                defaultValue={[500, 1000]} 
                min={100} 
                max={5000} 
                step={100}
                className="flex-1"
              />
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Songwriting Rate</h3>
            <div className="flex items-center gap-4">
              <Select defaultValue="$" style={{ width: 80 }}>
                <Option value="$">$ USD</Option>
                <Option value="€">€ EUR</Option>
                <Option value="£">£ GBP</Option>
              </Select>
              <Slider 
                range 
                defaultValue={[300, 700]} 
                min={100} 
                max={3000} 
                step={100}
                className="flex-1"
              />
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Mixing Rate</h3>
            <div className="flex items-center gap-4">
              <Select defaultValue="$" style={{ width: 80 }}>
                <Option value="$">$ USD</Option>
                <Option value="€">€ EUR</Option>
                <Option value="£">£ GBP</Option>
              </Select>
              <Slider 
                range 
                defaultValue={[200, 400]} 
                min={50} 
                max={2000} 
                step={50}
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Payment Methods</h3>
            <div className="flex flex-wrap gap-4">
              <Radio.Group defaultValue="paypal">
                <Radio value="paypal">
                  <div className="flex items-center gap-2">
                    <BankOutlined />
                    PayPal
                  </div>
                </Radio>
                <Radio value="venmo" className="ml-4">
                  <div className="flex items-center gap-2">
                    <DollarOutlined />
                    Venmo
                  </div>
                </Radio>
                <Radio value="crypto" className="ml-4">
                  <div className="flex items-center gap-2">
                    <SafetyOutlined />
                    Crypto
                  </div>
                </Radio>
              </Radio.Group>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}