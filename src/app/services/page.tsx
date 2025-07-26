"use client";

import { useState, useRef } from "react";
import { 
  Card, 
  Tag, 
  Button, 
  Input, 
  Select, 
  Tabs, 
  Avatar, 
  List, 
  Divider, 
  Radio, 
  Slider, 
  Rate, 
  Popover,
  Modal,
  message,
  Upload,
  Progress,
  Statistic,
  Tooltip,
  Switch,
  Collapse,

  Form,
  Badge
} from "antd";
import { useRouter } from "next/navigation";
import { 
  SearchOutlined, 
  FilterOutlined, 
  HeartOutlined, 
  HeartFilled, 
  ClockCircleOutlined, 
  UserOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
  EditOutlined,
  TeamOutlined,
  AuditOutlined,
  FileTextOutlined,
  SyncOutlined,
  CrownOutlined,
  MailOutlined,
  CheckOutlined,
  CloseOutlined,
  UploadOutlined,
  LikeOutlined,
  MessageOutlined,
  EllipsisOutlined
} from "@ant-design/icons";

const { Meta } = Card;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const { TextArea } = Input;

type MusicService = {
  id: number;
  type: 'snippet' | 'collab' | 'lyrics' | 'writer' | 'audition' | 'label';
  auditionType?: 'artist' | 'producer' | 'lyricist'; 
  title: string;
  user: {
    name: string;
    avatar: string;
    verified: boolean;
    followers: number;
  };
  description: string;
  tags: string[];
  genre: string[];
  likes: number;
  liked: boolean;
  plays?: number;
  duration?: string;
  audioUrl?: string;
  lyrics?: string;
  price?: number | string;
  deadline?: string;
  status?: 'open' | 'completed' | 'in-progress';
  collaborators?: number;
  comments?: number;
  date: string;
};

// Mock Data
const musicServices: MusicService[] = [
  {
    id: 1,
    type: 'snippet',
    title: "Summer Vibes Hook",
    user: {
      name: "Melody Maker",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg",
      verified: true,
      followers: 12400
    },
    description: "Catchy summer pop hook looking for verses to complete the song. Open to collab!",
    tags: ["Pop", "Upbeat", "Summer"],
    genre: ["Pop", "Dance"],
    likes: 124,
    liked: false,
    plays: 856,
    duration: "0:45",
    audioUrl: "#",
    date: "2 hours ago"
  },
  {
    id: 2,
    type: 'collab',
    title: "Need Rapper for Trap Beat",
    user: {
      name: "Beat Factory",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
      verified: false,
      followers: 3200
    },
    description: "Hard-hitting trap beat needs aggressive rapper. 50/50 split on any revenue.",
    tags: ["Trap", "Rap", "Dark"],
    genre: ["Hip Hop"],
    likes: 56,
    liked: true,
    plays: 210,
    price: "Revenue Share",
    status: 'open',
    collaborators: 3,
    comments: 12,
    date: "1 day ago"
  },
  {
    id: 3,
    type: 'lyrics',
    title: "Lyric Review Needed",
    user: {
      name: "Songbird",
      avatar: "https://randomuser.me/api/portraits/women/55.jpg",
      verified: true,
      followers: 8900
    },
    description: "Looking for feedback on these R&B lyrics before I record. Willing to pay for professional critique.",
    tags: ["R&B", "Love", "Ballad"],
    genre: ["R&B"],
    likes: 34,
    liked: false,
    lyrics: "You're the rhythm to my blues...",
    price: "$20-$50",
    date: "3 days ago"
  },
  {
    id: 4,
    type: 'writer',
    title: "Need Songwriter for Pop-Punk Band",
    user: {
      name: "Punk Out",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      verified: false,
      followers: 1200
    },
    description: "Looking for experienced pop-punk songwriter to help with our debut EP. Credit + payment.",
    tags: ["Pop-Punk", "Angsty", "Energetic"],
    genre: ["Rock"],
    likes: 78,
    liked: false,
    price: "$200-$500 per song",
    deadline: "June 30",
    status: 'open',
    date: "5 days ago"
  },
  {
    id: 5,
    type: 'audition',
      auditionType: 'producer',
    title: "Vocalist Auditions for Label",
    user: {
      name: "Urban Sounds Records",
      avatar: "https://randomuser.me/api/portraits/women/65.jpg",
      verified: true,
      followers: 45600
    },
    description: "Seeking talented R&B/Soul vocalists aged 18-25 for development deal. Submit your best performance.",
    tags: ["R&B", "Soul", "Vocalist"],
    genre: ["R&B", "Soul"],
    likes: 210,
    liked: false,
    status: 'open',
    deadline: "Ongoing",
    date: "1 week ago"
  },
  {
    id: 6,
    type: 'label',
    title: "Indie Label Seeking Producers",
    user: {
      name: "Beat Collective",
      avatar: "https://randomuser.me/api/portraits/men/33.jpg",
      verified: true,
      followers: 18700
    },
    description: "Looking for fresh producers to join our roster. Submit your best 3 tracks for consideration.",
    tags: ["Producers", "Contract", "Opportunity"],
    genre: ["All Genres"],
    likes: 145,
    liked: true,
    status: 'open',
    date: "2 weeks ago"
  }
];

const trendingSnippets = [
  {
    id: 1,
    title: "Lofi Chill Loop",
    user: "Chill Beats",
    plays: 1245,
    likes: 342,
    duration: "1:02"
  },
  {
    id: 2,
    title: "Dance Drop Idea",
    user: "EDM Creator",
    plays: 982,
    likes: 287,
    duration: "0:45"
  },
  {
    id: 3,
    title: "R&B Vocal Run",
    user: "Soul Singer",
    plays: 876,
    likes: 231,
    duration: "0:38"
  },
  {
    id: 4,
    title: "Trap 808 Pattern",
    user: "808 King",
    plays: 765,
    likes: 198,
    duration: "0:52"
  }
];

const comments = [
  {
    author: 'Producer Pro',
    avatar: 'https://randomuser.me/api/portraits/men/11.jpg',
    content: 'Love this hook! Would love to collab on a full track.',
    datetime: '2 hours ago',
  },
  {
    author: 'Vocal Queen',
    avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
    content: 'The melody is fire! Working on some lyrics for this.',
    datetime: '1 hour ago',
  },
  {
    author: 'Beat Maker',
    avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
    content: 'Could you send me the stems? Want to try a remix.',
    datetime: '45 minutes ago',
  },
];

export default function MusicServices() {
  const [activeTab, setActiveTab] = useState("snippets");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedService, setSelectedService] = useState("all");
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [services, setServices] = useState<MusicService[]>(musicServices);
  const audioRef = useRef<HTMLAudioElement | null>(null);
   const router = useRouter();


  const toggleLike = (id: number) => {
    setServices(services.map(service => 
      service.id === id ? { 
        ...service, 
        liked: !service.liked,
        likes: service.liked ? service.likes - 1 : service.likes + 1
      } : service
    ));
  };

  const togglePlay = (id: number) => {
    if (isPlaying === id) {
      setIsPlaying(null);
      audioRef.current?.pause();
    } else {
      setIsPlaying(id);
      // In a real app, we'd set the audio source here
      audioRef.current?.play();
    }
  };

  const showUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const showCollabModal = () => {
    setIsCollabModalOpen(true);
  };

  const handleUpload = () => {
    // Simulate upload
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    setTimeout(() => {
      message.success('Your snippet has been uploaded!');
      setIsUploadModalOpen(false);
      setUploadProgress(0);
    }, 3000);
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGenre = selectedGenre === "all" || service.genre.includes(selectedGenre);
    const matchesService = selectedService === "all" || service.type === selectedService;
    
    return matchesSearch && matchesGenre && matchesService;
  });

  return (
    <div className="flex h-full bg-gray-50">
      {/* Audio Element (hidden) */}
      <audio ref={audioRef} src="/sample.mp3" />
      
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Music Services</h1>
                <p className="text-gray-600">Collaborate, create, and connect with music professionals</p>
              </div>
              <Button 
                type="primary" 
                size="large" 
                icon={<PlusOutlined />}
                onClick={showUploadModal}
              >
                Upload Snippet
              </Button>
            </div>
            
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-gray-500 text-sm">Active Collaborations</div>
                <div className="text-2xl font-bold">1,248</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-gray-500 text-sm">Snippets Shared</div>
                <div className="text-2xl font-bold">3,427</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-gray-500 text-sm">Successful Matches</div>
                <div className="text-2xl font-bold">892</div>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Input
                placeholder="Search snippets, services, users..."
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
                <Option value="Pop">Pop</Option>
                <Option value="Hip Hop">Hip Hop</Option>
                <Option value="R&B">R&B</Option>
                <Option value="Rock">Rock</Option>
                <Option value="Electronic">Electronic</Option>
                <Option value="Country">Country</Option>
                <Option value="Jazz">Jazz</Option>
              </Select>
              <Select
                placeholder="All Services"
                className="w-full md:w-[180px]"
                value={selectedService}
                onChange={(value) => setSelectedService(value)}
              >
                <Option value="all">All Services</Option>
                <Option value="snippet">Snippets</Option>
                <Option value="collab">Collaborations</Option>
                <Option value="lyrics">Lyrics</Option>
                <Option value="writer">Songwriters</Option>
                <Option value="audition">Auditions</Option>
                <Option value="label">Labels</Option>
              </Select>
              <Button type="primary" icon={<FilterOutlined />}>
                Advanced
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            className="mb-6"
            tabBarExtraContent={
              <Radio.Group defaultValue="trending" size="small">
                <Radio.Button value="trending">Trending</Radio.Button>
                <Radio.Button value="recent">Recent</Radio.Button>
                <Radio.Button value="following">Following</Radio.Button>
              </Radio.Group>
            }
          >
            <TabPane tab={<span><SoundOutlined /> Snippets</span>} key="snippets" />
            <TabPane tab={<span><TeamOutlined /> Collabs</span>} key="collabs" />
            <TabPane tab={<span><EditOutlined /> Lyrics</span>} key="lyrics" />
            <TabPane tab={<span><FileTextOutlined /> Writers</span>} key="writers" />
            <TabPane tab={<span><AuditOutlined /> Auditions</span>} key="auditions" />
            <TabPane tab={<span><CrownOutlined /> Labels</span>} key="labels" />
          </Tabs>

          {/* Services Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                hoverable
                className="border rounded-lg overflow-hidden bg-white shadow-sm"
              >
                <div className="flex flex-col">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={service.user.avatar} size="large" />
                      <div>
                        <div className="font-bold flex items-center">
                          {service.user.name}
                          {service.user.verified && (
                            <CrownOutlined className="text-blue-500 ml-1" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {service.user.followers.toLocaleString()} followers
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag color={
                        service.type === 'snippet' ? 'blue' :
                        service.type === 'collab' ? 'purple' :
                        service.type === 'lyrics' ? 'green' :
                        service.type === 'writer' ? 'orange' :
                        service.type === 'audition' ? 'red' : 'gold'
                      }>
                        {service.type === 'snippet' ? 'SNIPPET' :
                         service.type === 'collab' ? 'COLLAB' :
                         service.type === 'lyrics' ? 'LYRICS' :
                         service.type === 'writer' ? 'WRITER' :
                         service.type === 'audition' ? 'AUDITION' : 'LABEL'}
                      </Tag>
                      <span className="text-xs text-gray-500">{service.date}</span>
                    </div>
                  </div>
                  
                  {/* Title & Description */}
                  <h3 className="text-lg font-bold mb-2">{service.title}</h3>
                  <p className="text-gray-700 mb-4">{service.description}</p>
                  
                  {/* Audio Player for Snippets */}
                  {service.type === 'snippet' && (
                    <div className="bg-gray-100 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => togglePlay(service.id)}
                          className="text-2xl"
                        >
                          {isPlaying === service.id ? (
                            <PauseCircleOutlined />
                          ) : (
                            <PlayCircleOutlined />
                          )}
                        </button>
                        <span className="text-sm text-gray-500">
                          {service.duration}
                        </span>
                        <span className="text-sm text-gray-500">
                          {service.plays.toLocaleString()} plays
                        </span>
                      </div>
                      <div className="mt-2">
                        <Progress 
                          percent={isPlaying === service.id ? 70 : 0} 
                          showInfo={false} 
                          strokeColor="#1890ff" 
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Lyrics Preview */}
                  {service.type === 'lyrics' && (
                    <div className="bg-gray-50 p-3 rounded mb-4">
                      <div className="text-sm italic text-gray-600">
                        {service.lyrics?.substring(0, 100)}...
                      </div>
                    </div>
                  )}
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {service.tags.map((tag, i) => (
                      <Tag key={i}>{tag}</Tag>
                    ))}
                    {service.genre.map((genre, i) => (
                      <Tag key={`g-${i}`} color="blue">{genre}</Tag>
                    ))}
                  </div>
                  
                  {/* Footer */}
                  <div className="flex justify-between items-center border-t pt-3">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => toggleLike(service.id)}
                        className="flex items-center gap-1"
                      >
                        {service.liked ? (
                          <HeartFilled className="text-red-500" />
                        ) : (
                          <HeartOutlined />
                        )}
                        <span>{service.likes}</span>
                      </button>
                      {service.comments && (
                        <div className="flex items-center gap-1">
                          <MessageOutlined />
                          <span>{service.comments}</span>
                        </div>
                      )}
                      {service.collaborators && (
                        <div className="flex items-center gap-1">
                          <TeamOutlined />
                          <span>{service.collaborators}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {service.type === 'snippet' && (
                        <Button 
                          type="primary" 
                          size="small"
                          onClick={showCollabModal}
                        >
                          Request Feature
                        </Button>
                      )}
                      {service.type === 'collab' && (
                        <Button 
                     onClick={() => router.push(`/collabs/create/${service.id}`)} 
                        type="primary" size="small">
                          Join Collab
                        </Button>
                      )}
        {service.type === 'lyrics' && (
  <Button 
    type="primary" 
    size="small"
    onClick={() => router.push(`/services/create/${service.id}`)}
  >
    Review Lyrics
  </Button>
)}
                      {service.type === 'writer' && (
                        <Button 
                         onClick={() => router.push(`/services/edit/${service.id}`)} 
                        
                        type="primary" size="small">
                          Hire Writer
                        </Button>
                      )}
                      {service.type === 'audition' && (
  <Button 
    onClick={() => router.push(`/services/auditions/${service.auditionType}/${service.id}`)}
    type="primary" 
    size="small"
  >
    Submit Audition
  </Button>
)}
                      {service.type === 'label' && (
                        <Button type="primary" size="small">
                          Contact Label
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-gray-200 hidden xl:block p-6 bg-white overflow-y-auto">
        <div className="sticky top-6">
          {/* Trending Snippets */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">🔥 Trending Snippets</h2>
            <div className="space-y-4">
              {trendingSnippets.map((snippet) => (
                <div 
                  key={snippet.id} 
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <div className="bg-gray-200 rounded-lg w-12 h-12 flex items-center justify-center">
                    <PlayCircleOutlined className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{snippet.title}</div>
                    <div className="text-xs text-gray-500">{snippet.user}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {snippet.duration}
                  </div>
                </div>
              ))}
            </div>
            <Button type="link" className="w-full mt-2">View All</Button>
          </div>
          
          <Divider />
          
          {/* Half Songs */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">
              <SyncOutlined className="mr-2" />
              Finish These Songs
            </h2>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div className="font-medium mb-1">Midnight  (Needs Verse)</div>
                <div className="text-xs text-gray-500 mb-2">Pop • 45% complete</div>
                <Progress percent={45} size="small" />
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-medium mb-1"> ds(Needs Hook)</div>
                <div className="text-xs text-gray-500 mb-2">R&B • 60% complete</div>
                <Progress percent={60} size="small" />
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-medium mb-1">Revolution (Needs Bridge)</div>
                <div className="text-xs text-gray-500 mb-2">Rock • 75% complete</div>
                <Progress percent={75} size="small" />
              </div>
            </div>
            <Button type="link" className="w-full mt-2">Browse More</Button>
          </div>
          
          <Divider />
          
          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar src="https://randomuser.me/api/portraits/men/41.jpg" />
                <div>
                  <div className="text-sm">
                    <span className="font-medium">Beat Master</span> liked your snippet summer vibes
                  </div>
                  <div className="text-xs text-gray-500">15 min ago</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Avatar src="https://randomuser.me/api/portraits/women/63.jpg" />
                <div>
                  <div className="text-sm">
                    <span className="font-medium">Lyric Queen</span> requested to collab on your track
                  </div>
                  <div className="text-xs text-gray-500">1 hour ago</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Avatar src="https://randomuser.me/api/portraits/men/32.jpg" />
                <div>
                  <div className="text-sm">
                    <span className="font-medium">Urban Records</span> viewed your profile
                  </div>
                  <div className="text-xs text-gray-500">3 hours ago</div>
                </div>
              </div>
            </div>
            <Button type="link" className="w-full mt-2">See All Activity</Button>
          </div>
        </div>
      </div>

      {/* Upload Snippet Modal */}
      <Modal 
        title="Upload Your Snippet" 
        open={isUploadModalOpen} 
        onOk={handleUpload}
        onCancel={() => setIsUploadModalOpen(false)}
        okText="Upload"
        width={600}
      >
        <div className="mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Snippet Title</label>
            <Input placeholder="e.g., 'Chill Lofi Hook'" />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <TextArea 
              rows={3} 
              placeholder="Describe your snippet, what you're looking for, etc." 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Genre</label>
              <Select className="w-full" placeholder="Select genre">
                <Option value="Pop">Pop</Option>
                <Option value="Hip Hop">Hip Hop</Option>
                <Option value="R&B">R&B</Option>
                <Option value="Rock">Rock</Option>
                <Option value="Electronic">Electronic</Option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mood/Tags</label>
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="e.g., Chill, Upbeat, Sad"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Upload Audio</label>
            <Upload.Dragger 
              name="file"
              multiple={false}
              accept=".mp3,.wav"
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">MP3 or WAV, max 5MB</p>
            </Upload.Dragger>
          </div>
          
          {uploadProgress > 0 && (
            <div className="mb-4">
              <Progress percent={uploadProgress} status="active" />
            </div>
          )}
          
          <div className="mb-4">
            <Switch defaultChecked /> 
            <span className="text-sm ml-2">Allow others to use this in collabs</span>
          </div>
        </div>
      </Modal>

      {/* Collab Request Modal */}
      <Modal 
        title="Request Feature on Snippet" 
        open={isCollabModalOpen} 
        onOk={() => {
          message.success('Collab request sent!');
          setIsCollabModalOpen(false);
        }}
        onCancel={() => setIsCollabModalOpen(false)}
        okText="Send Request"
        width={600}
      >
        <div className="mb-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar src={musicServices[0].user.avatar} size={64} />
            <div>
              <h4 className="font-bold">{musicServices[0].title}</h4>
              <div className="text-sm text-gray-600">{musicServices[0].user.name}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {musicServices[0].tags.slice(0, 3).map((tag, i) => (
                  <Tag key={i} className="text-xs">{tag}</Tag>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Your Role</label>
            <Select className="w-full" placeholder="Select your role">
              <Option value="vocalist">Vocalist</Option>
              <Option value="rapper">Rapper</Option>
              <Option value="producer">Producer</Option>
              <Option value="lyricist">Lyricist</Option>
              <Option value="instrumentalist">Instrumentalist</Option>
            </Select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Message</label>
            <TextArea 
              rows={4} 
              placeholder="Tell them about your ideas for the collab..." 
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Attach Your Work (Optional)</label>
            <Upload>
              <Button icon={<UploadOutlined />}>Upload File</Button>
            </Upload>
          </div>
          
          <div className="mb-4">
            <Switch defaultChecked /> 
            <span className="text-sm ml-2">Allow them to contact you</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}