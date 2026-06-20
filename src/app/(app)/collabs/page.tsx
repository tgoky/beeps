"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Clock, Heart, DollarSign, TrendingUp, Users, CheckCircle, Star, Music2, Zap, Plus, Loader2 } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useCollaborations, usePlaceBid, type Collaboration as APICollaboration } from "@/hooks/useCollaborations";

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

// Helper to transform API collaboration to display format
const transformCollaboration = (apiCollab: APICollaboration): BookingSession => {
  const type: 'deal' | 'collab' | 'bid' = apiCollab.type.toLowerCase() as any;

  return {
    id: parseInt(apiCollab.id, 36), // Convert UUID
    title: apiCollab.title,
    type,
    studio: apiCollab.studio ? {
      name: apiCollab.studio.name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiCollab.studio.id}`,
      rating: 4.5 + Math.random() * 0.5,
    } : undefined,
    producer: {
      name: apiCollab.creator.fullName || apiCollab.creator.username,
      avatar: apiCollab.creator.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiCollab.creator.id}`,
      rating: 4.5 + Math.random() * 0.5,
    },
    price: type === 'bid' ? "Bid Now" : type === 'collab' ? "Negotiable" : (apiCollab.price || 0),
    originalPrice: type === 'deal' && apiCollab.price ? apiCollab.price * 1.5 : undefined,
    discount: type === 'deal' ? 33 : undefined,
    duration: apiCollab.duration || "Flexible",
    location: apiCollab.location || "Remote",
    equipment: apiCollab.equipment,
    genre: apiCollab.genre,
    date: apiCollab.expiresAt ? `Ends ${new Date(apiCollab.expiresAt).toLocaleDateString()}` : "Ongoing",
    slots: apiCollab.slots,
    liked: false,
    image: apiCollab.imageUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
  };
};

const activityData: Activity[] = [
  {
    id: 1,
    user: { name: "Trapper King", avatar: "https://randomuser.me/api/portraits/men/22.jpg" },
    action: 'booked', session: "Weekend Studio Blowout", price: "$50", time: "5 min ago"
  },
  {
    id: 2,
    user: { name: "Luna Sky", avatar: "https://randomuser.me/api/portraits/women/33.jpg" },
    action: 'requested', session: "Collab with Producer Alex", price: "$80", time: "25 min ago"
  },
  {
    id: 3,
    user: { name: "Urban Flow", avatar: "https://randomuser.me/api/portraits/men/45.jpg" },
    action: 'accepted', session: "Name Your Price Session", price: "$65", time: "1 hour ago"
  },
];

export default function SessionBookings() {
  const router = useRouter();
  const { permissions, isProducer, isArtist, isLyricist, isStudioOwner } = usePermissions();

  const [activeTab, setActiveTab] = useState("deals");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
  const [bidPrice, setBidPrice] = useState(50);
  const [bidMessage, setBidMessage] = useState("");

  const tabTypeMap: Record<string, "DEAL" | "COLLAB" | "BID" | undefined> = {
    deals: "DEAL",
    collabs: "COLLAB",
    bids: "BID",
  };

  const { data: apiCollaborationsData, isLoading, error } = useCollaborations({
    type: tabTypeMap[activeTab],
    genre: selectedGenre !== "all" ? selectedGenre : undefined,
  });

  const apiCollaborations: APICollaboration[] = Array.isArray(apiCollaborationsData) 
    ? apiCollaborationsData 
    : [];

  const sessions: BookingSession[] = apiCollaborations.map(transformCollaboration);
  const placeBidMutation = usePlaceBid(selectedCollabId || "");

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Like collaboration:", id);
  };

  const handlePlaceBid = async () => {
    if (!selectedCollabId) return;
    try {
      await placeBidMutation.mutateAsync({
        amount: activeTab === "bids" ? bidPrice : undefined,
        message: bidMessage,
      });
      setShowBidModal(false);
      setBidPrice(50);
      setBidMessage("");
      setSelectedCollabId(null);
    } catch (error) {
      console.error("Failed to place bid:", error);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (session.studio?.name || session.producer?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "all" || session.genre.includes(selectedGenre);
    const matchesLocation = selectedLocation === "all" || session.location.includes(selectedLocation);
    const matchesTab = activeTab === "deals" ? session.type === "deal" :
                       activeTab === "collabs" ? session.type === "collab" :
                       activeTab === "bids" ? session.type === "bid" : true;
    return matchesSearch && matchesGenre && matchesLocation && matchesTab;
  });

  return (
    <div className="h-full overflow-y-auto p-6 bg-[#030303] text-white">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Main Content - 3 columns */}
          <div className="xl:col-span-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white">
                    <Music2 className="w-4 h-4 text-black" strokeWidth={2.5} />
                  </div>
                  <h1 className="text-2xl font-light tracking-tight text-white">
                    Collabs & Deals
                  </h1>
                </div>
                <p className="text-sm font-light tracking-wide text-zinc-400">
                  Find deals, collabs, or name your price for studio time
                </p>
              </div>

              {/* Create Session Buttons */}
              <div className="flex gap-2">
                {permissions.canCreateDeals && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 bg-white border-white text-black hover:bg-zinc-100"
                    onClick={() => router.push('/collabs/create/deal')}
                  >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    Create Deal
                  </button>
                )}
                {permissions.canCreateCollabs && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
                    onClick={() => router.push('/collabs/create/collab')}
                  >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    Create Collab
                  </button>
                )}
                {permissions.canCreateBids && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
                    onClick={() => router.push('/collabs/create/bid')}
                  >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    Create Bid
                  </button>
                )}
              </div>
            </div>

            {/* Permission Info Banners */}
            {isProducer && (
              <div className="mb-6 p-4 rounded-lg border bg-blue-950/20 border-blue-900/30">
                <div className="flex items-start gap-3">
                  <Music2 className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-300">
                      Producer Dashboard
                    </p>
                    <p className="text-xs mt-1 text-blue-400/70">
                      You can create deals, collabs, and bids. View analytics on your sessions and manage collaborations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isStudioOwner && (
              <div className="mb-6 p-4 rounded-lg border bg-purple-950/20 border-purple-900/30">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm font-medium text-purple-300">
                      Studio Owner Dashboard
                    </p>
                    <p className="text-xs mt-1 text-purple-400/70">
                      Create flash deals and bid sessions. Access premium features and session analytics.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(isArtist || isLyricist) && !isProducer && (
              <div className="mb-6 p-4 rounded-lg border bg-green-950/20 border-green-900/30">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-300">
                      {isArtist ? "Artist" : "Lyricist"} Dashboard
                    </p>
                    <p className="text-xs mt-1 text-green-400/70">
                      Create collabs, book sessions, negotiate terms, and place bids on studio time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl border border-zinc-800 bg-[#0A0A0A]">
              {/* Search */}
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-600 focus:bg-zinc-800"
                />
              </div>

              {/* Genre Filter */}
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 cursor-pointer tracking-wide focus:outline-none bg-zinc-900 border-zinc-800 text-white focus:border-zinc-600 focus:bg-zinc-800"
              >
                <option value="all">All Genres</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="Trap">Trap</option>
                <option value="R&B">R&B</option>
                <option value="Pop">Pop</option>
                <option value="Rock">Rock</option>
                <option value="Electronic">Electronic</option>
              </select>

              {/* Location Filter */}
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 cursor-pointer tracking-wide focus:outline-none bg-zinc-900 border-zinc-800 text-white focus:border-zinc-600 focus:bg-zinc-800"
              >
                <option value="all">All Locations</option>
                <option value="Los Angeles">Los Angeles</option>
                <option value="New York">New York</option>
                <option value="Miami">Miami</option>
                <option value="Chicago">Chicago</option>
                <option value="Online">Online/Remote</option>
              </select>

              {/* Tab Filters */}
              <div className="flex items-center gap-1 p-1 rounded-lg border border-zinc-800 bg-zinc-900">
                {[
                  { key: "deals", label: "Hot Deals", icon: Zap },
                  { key: "collabs", label: "Collabs", icon: Users },
                  { key: "bids", label: "Bids", icon: DollarSign }
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`
                        flex items-center gap-2 px-4 py-2 text-sm font-light rounded transition-all duration-200 tracking-wide
                        ${activeTab === tab.key
                          ? "bg-white text-black"
                          : "text-zinc-400 hover:text-white"
                        }
                      `}
                    >
                      <IconComponent className="w-4 h-4" strokeWidth={2} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/20 text-red-400">
                <p className="text-sm">Failed to load collaborations. Please try again.</p>
              </div>
            )}

            {/* Results Count */}
            {!isLoading && !error && (
              <div className="text-sm font-light tracking-wide mb-6 text-zinc-500">
                {filteredSessions.length} {filteredSessions.length === 1 ? "session" : "sessions"} found
              </div>
            )}

            {/* Compact Wide Cards */}
            {!isLoading && !error && (
              <div className="space-y-4">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="group rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.98] border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900"
                  onClick={() => router.push(`/bookings/${session.id}`)}
                >
                  <div className="flex">
                    {/* Cover Image */}
                    <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden">
                      <img
                        alt={session.title}
                        src={session.image}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Type Badge */}
                      <div className={`
                        absolute top-2 left-2 px-2 py-1 rounded text-xs font-light tracking-wide backdrop-blur-sm
                        ${session.type === 'deal'
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : session.type === 'collab'
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-green-500/20 text-green-400 border border-green-500/30"
                        }
                      `}>
                        {session.type === 'deal' ? 'DEAL' : session.type === 'collab' ? 'COLLAB' : 'BID'}
                      </div>

                      {/* Discount Badge */}
                      {session.discount && (
                        <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-light tracking-wide backdrop-blur-sm bg-red-500/20 text-red-400 border border-red-500/30">
                          {session.discount}% OFF
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between h-full">
                        {/* Left Section - Session Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-medium tracking-wide mb-1 truncate text-white">
                                {session.title}
                              </h3>
                              <div className="flex items-center gap-2 mb-2">
                                <img
                                  src={session.studio?.avatar || session.producer?.avatar}
                                  alt={session.studio?.name || session.producer?.name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                                <span className="text-xs font-light tracking-wide truncate text-zinc-400">
                                  {session.studio?.name || session.producer?.name}
                                </span>
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                  <span className="text-xs font-light text-zinc-400">
                                    {session.studio?.rating || session.producer?.rating}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex items-center gap-4 mb-2 text-xs font-light text-zinc-500">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{session.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{session.duration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{session.slots} left</span>
                            </div>
                          </div>

                          {/* Genres & Equipment */}
                          <div className="flex items-center gap-2 mb-2">
                            {session.genre.slice(0, 2).map((genre, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs font-light rounded-full tracking-wide bg-zinc-800 text-zinc-300 border-zinc-700 border"
                              >
                                {genre}
                              </span>
                            ))}
                            {session.equipment.slice(0, 1).map((equip, index) => (
                              <span
                                key={`equip-${index}`}
                                className="px-2 py-1 text-xs font-light rounded-full tracking-wide border bg-zinc-900 text-zinc-400 border-zinc-800"
                              >
                                {equip}
                              </span>
                            ))}
                          </div>

                          {/* Date */}
                          <p className="text-xs font-light tracking-wide text-zinc-500">
                            {session.date}
                          </p>
                        </div>

                        {/* Right Section - Price & Action */}
                        <div className="flex flex-col items-end gap-3 pl-4 border-l border-zinc-800">
                          <div className="text-right">
                            {typeof session.price === 'number' ? (
                              <div className="flex flex-col items-end">
                                <div className="text-lg font-medium tracking-tight text-white">
                                  ${session.price}
                                </div>
                                {session.originalPrice && (
                                  <div className="text-xs font-light text-red-400 tracking-wide line-through">
                                    ${session.originalPrice}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm font-medium tracking-wide text-white">
                                {session.price}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {/* Book Session Button */}
                            {session.type === 'deal' && permissions.canBookSessions && (
                              <button
                                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 w-32 justify-center bg-white border-white text-black hover:bg-zinc-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const apiCollab = apiCollaborations.find(c => parseInt(c.id, 36) === session.id);
                                  if (apiCollab) {
                                    setSelectedCollabId(apiCollab.id);
                                    setBidMessage("");
                                    setShowBidModal(true);
                                  }
                                }}
                              >
                                <CheckCircle className="w-3 h-3" strokeWidth={2} />
                                Book Now
                              </button>
                            )}

                            {/* Request Collab Button */}
                            {session.type === 'collab' && permissions.canNegotiateCollabTerms && (
                              <button
                                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 w-32 justify-center bg-white border-white text-black hover:bg-zinc-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const apiCollab = apiCollaborations.find(c => parseInt(c.id, 36) === session.id);
                                  if (apiCollab) {
                                    setSelectedCollabId(apiCollab.id);
                                    setBidMessage("");
                                    setShowBidModal(true);
                                  }
                                }}
                              >
                                <CheckCircle className="w-3 h-3" strokeWidth={2} />
                                Request
                              </button>
                            )}

                            {/* Place Bid Button */}
                            {session.type === 'bid' && permissions.canPlaceBids && (
                              <button
                                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 w-32 justify-center bg-white border-white text-black hover:bg-zinc-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const apiCollab = apiCollaborations.find(c => parseInt(c.id, 36) === session.id);
                                  if (apiCollab) {
                                    setSelectedCollabId(apiCollab.id);
                                    setBidPrice(apiCollab.currentBid ? parseFloat(apiCollab.currentBid.toString()) + 5 : 50);
                                    setShowBidModal(true);
                                  }
                                }}
                              >
                                <CheckCircle className="w-3 h-3" strokeWidth={2} />
                                Make Offer
                              </button>
                            )}

                            {/* No Permission State */}
                            {((session.type === 'deal' && !permissions.canBookSessions) ||
                              (session.type === 'collab' && !permissions.canNegotiateCollabTerms) ||
                              (session.type === 'bid' && !permissions.canPlaceBids)) && (
                              <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border w-32 justify-center border-zinc-800 text-zinc-500 bg-zinc-900/50">
                                <CheckCircle className="w-3 h-3" strokeWidth={2} />
                                {session.type === 'bid' ? 'Make Offer' : session.type === 'collab' ? 'Request' : 'Book Now'}
                              </div>
                            )}

                            <button
                              className="p-2 rounded-lg border transition-all duration-200 active:scale-95 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
                              onClick={(e) => toggleLike(session.id, e)}
                            >
                              <Heart className={`w-3.5 h-3.5 ${session.liked ? "fill-red-500 text-red-500" : ""}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {filteredSessions.length === 0 && (
                <div className="text-center py-16 rounded-xl border border-zinc-800 bg-[#0A0A0A]">
                  <Music2 className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                  <p className="text-sm font-medium tracking-wide mb-1 text-zinc-300">
                    No sessions found
                  </p>
                  <p className="text-xs font-light tracking-wide text-zinc-500">
                    Try adjusting your filters
                  </p>
                </div>
              )}
            </div>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Booking Activity */}
            <div className="rounded-xl border h-fit border-zinc-800 bg-[#0A0A0A]">
              <div className="p-5 border-b border-dashed border-zinc-800 flex justify-between items-center">
                <h2 className="text-base font-medium tracking-tight text-white">
                  Recent Activity
                </h2>
                <span className="text-xs px-2 py-1 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                  Live
                </span>
              </div>
              
              <div className="p-2">
                {activityData.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="group flex gap-4 p-3 rounded-lg transition-all duration-200 hover:bg-zinc-900/80 relative cursor-pointer"
                  >
                    {/* Timeline Line */}
                    {index !== activityData.length - 1 && (
                      <div className="absolute left-[27px] top-10 bottom-[-12px] w-[1px] bg-zinc-800" />
                    )}

                    {/* Avatar */}
                    <div className="relative flex-shrink-0 z-10">
                      <img
                        src={activity.user.avatar}
                        alt={activity.user.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-offset-2 group-hover:ring-zinc-700 transition-all bg-zinc-900"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center ${
                         activity.action === 'booked' ? "bg-green-500" :
                         activity.action === 'requested' ? "bg-yellow-500" :
                         activity.action === 'accepted' ? "bg-blue-500" : "bg-red-500"
                      }`}>
                        {activity.action === 'booked' ? <CheckCircle className="w-2 h-2 text-white" /> :
                         activity.action === 'requested' ? <Clock className="w-2 h-2 text-white" /> :
                         <Zap className="w-2 h-2 text-white" />}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className="text-sm font-medium truncate text-zinc-200">
                          {activity.user.name}
                        </p>
                        <span className="text-[10px] whitespace-nowrap text-zinc-500">
                          {activity.time}
                        </span>
                      </div>

                      <p className="text-xs mb-1.5 text-zinc-400">
                        <span className={
                          activity.action === 'booked' ? "text-green-400" :
                          activity.action === 'requested' ? "text-yellow-400" :
                          activity.action === 'accepted' ? "text-blue-400" : ""
                        }>
                          {activity.action === 'booked' ? 'Booked session' : 
                           activity.action === 'requested' ? 'Requested collab' :
                           activity.action === 'accepted' ? 'Accepted offer' : 'Rejected'}
                        </span>
                        <span className="mx-1 opacity-50 text-zinc-600">•</span>
                        <span className="text-zinc-500">
                          {activity.session}
                        </span>
                      </p>

                      {activity.price && (
                        <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <DollarSign className="w-2.5 h-2.5 mr-0.5" />
                          {activity.price.replace('$', '')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 border-t border-dashed border-zinc-800">
                <button className="w-full py-2 text-xs text-center transition-colors text-zinc-500 hover:text-zinc-300">
                  View all activity
                </button>
              </div>
            </div>

            {/* Trending Studios */}
            <div className="rounded-xl border overflow-hidden border-zinc-800 bg-[#0A0A0A]">
              <div className="p-5 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-medium tracking-wide text-white">
                    Trending Studios
                  </h3>
                </div>
              </div>
              
              <div className="divide-y divide-zinc-800">
                {sessions.filter(s => s.studio).slice(0, 4).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 p-4 transition-all duration-200 hover:bg-zinc-900 cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={session.studio?.avatar}
                        alt={session.studio?.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="absolute -top-1 -left-1 w-4 h-4 flex items-center justify-center bg-white text-black rounded-full text-[9px] font-bold">
                        {session.id}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-zinc-200">
                        {session.studio?.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{session.location.split(',')[0]}</span>
                      </div>
                    </div>
                    
                    <button className="p-1.5 rounded-md transition-colors hover:bg-zinc-800 text-zinc-400">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <div className="rounded-xl border p-5 border-zinc-800 bg-[#0A0A0A]">
              <h3 className="text-sm font-medium tracking-wide mb-4 text-white">
                  Market Overview
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-lg text-center border bg-zinc-900/50 border-zinc-800">
                   <p className="text-xs mb-1 text-zinc-500">Deals</p>
                   <p className="text-lg font-semibold text-white">{sessions.filter(s => s.type === 'deal').length}</p>
                </div>
                <div className="p-3 rounded-lg text-center border bg-zinc-900/50 border-zinc-800">
                   <p className="text-xs mb-1 text-zinc-500">Collabs</p>
                   <p className="text-lg font-semibold text-white">{sessions.filter(s => s.type === 'collab').length}</p>
                </div>
                <div className="p-3 rounded-lg text-center border bg-zinc-900/50 border-zinc-800">
                   <p className="text-xs mb-1 text-zinc-500">Bids</p>
                   <p className="text-lg font-semibold text-white">{sessions.filter(s => s.type === 'bid').length}</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-xl border p-6 border-zinc-800 bg-[#0A0A0A] shadow-2xl">
            <h3 className="text-lg font-medium tracking-wide mb-4 text-white">
              Make an Offer
            </h3>

            <div className="mb-5">
              <label className="block text-sm font-medium tracking-wide mb-2 text-zinc-300">
                Your Offer Price: <span className="text-white ml-1">${bidPrice}</span>
              </label>
              <input
                type="range"
                min="20"
                max="200"
                value={bidPrice}
                onChange={(e) => setBidPrice(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-zinc-800"
                style={{
                  background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((bidPrice - 20) / 180) * 100}%, #27272a ${((bidPrice - 20) / 180) * 100}%, #27272a 100%)`
                }}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium tracking-wide mb-2 text-zinc-300">
                Add a Message (Optional)
              </label>
              <textarea
                placeholder="E.g., 'I need 2 hours for vocal recording...'"
                rows={3}
                value={bidMessage}
                onChange={(e) => setBidMessage(e.target.value)}
                className="w-full px-4 py-3 text-sm font-light rounded-lg border tracking-wide resize-none focus:outline-none border-zinc-800 bg-zinc-900 text-white placeholder-zinc-500 focus:border-zinc-600 focus:bg-zinc-900/50"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBidModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceBid}
                disabled={placeBidMutation.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 tracking-wide active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-white border-white text-black hover:bg-zinc-200"
              >
                {placeBidMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  `Submit ${activeTab === 'bids' ? 'Bid' : 'Request'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}