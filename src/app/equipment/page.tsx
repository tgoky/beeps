"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Heart, Star, MapPin, Clock, TrendingUp, DollarSign, Zap, Package, Truck, Shield, Users, CheckCircle, Share2 } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";

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
      { label: "Polar Pattern", value: "Multi-pattern" },
      { label: "Frequency", value: "20Hz-20kHz" }
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
    tags: ["Vintage", "Electric", "Collector"],
    specs: [
      { label: "Year", value: "2015 Reissue" },
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
    category: "Synthesizers",
    brand: "Moog",
    location: "Remote",
    availability: "Available next week",
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4"
    ],
    liked: false,
    rating: 4.6,
    reviewCount: 27,
    deliveryOptions: ["Shipping"],
    tags: ["Analog", "Keyboard", "Bass"],
    specs: [
      { label: "Keys", value: "37" },
      { label: "Type", value: "Paraphonic" },
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
    price: "550",
    category: "Drum Machines",
    brand: "Roland",
    location: "Brooklyn, NY",
    availability: "Auction ends in 2 days",
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04"
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
  }
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function GearMarketplace() {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState("rent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [gear, setGear] = useState<Equipment[]>(gearData);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidPrice, setBidPrice] = useState(600);

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setGear(gear.map(item => 
      item.id === id ? { ...item, liked: !item.liked } : item
    ));
  };

  const filteredGear = gear.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesBrand = selectedBrand === "all" || item.brand === selectedBrand;
    const matchesTab = activeTab === "rent" ? item.type === "rent" :
                       activeTab === "sale" ? item.type === "sale" :
                       activeTab === "auction" ? item.type === "auction" : true;
    return matchesSearch && matchesCategory && matchesBrand && matchesTab;
  });

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className={`text-2xl font-semibold mb-1 ${
                  theme === "dark" ? "text-gray-100" : "text-gray-900"
                }`}>
                  Gear Marketplace
                </h1>
                <p className={`text-[13px] ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>
                  Rent, buy, or sell professional music equipment
                </p>
              </div>
              <button
                className={`
                  flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                  ${theme === "dark"
                    ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20"
                    : "bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200/50"
                  }
                  active:scale-95
                `}
              >
                <Package className="w-3.5 h-3.5" />
                List Your Gear
              </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {[
                { label: "Available Items", value: "1,248" },
                { label: "Verified Sellers", value: "327" },
                { label: "Daily Rentals", value: "89" },
                { label: "Avg. Rating", value: "4.7" }
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`
                    p-3 rounded-lg border backdrop-blur-sm
                    ${theme === "dark"
                      ? "bg-gray-900/40 border-gray-800/60"
                      : "bg-white/50 border-gray-200/60"
                    }
                  `}
                >
                  <div className={`text-[11px] mb-1 ${
                    theme === "dark" ? "text-gray-500" : "text-gray-600"
                  }`}>
                    {stat.label}
                  </div>
                  <div className={`text-xl font-bold ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className={`
            flex flex-wrap gap-2 mb-6 p-4 rounded-lg border backdrop-blur-sm
            ${theme === "dark" 
              ? "bg-gray-950/40 border-gray-800/50" 
              : "bg-white/40 border-gray-200/60"
            }
          `}>
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`} />
              <input
                type="text"
                placeholder="Search gear, brands, sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`
                  w-full pl-9 pr-3 py-2 text-[13px] rounded-lg border transition-all duration-200
                  ${theme === "dark"
                    ? "bg-gray-900/40 border-gray-800/60 text-gray-200 placeholder-gray-600 focus:border-purple-500/50"
                    : "bg-gray-50/50 border-gray-200/60 text-gray-900 placeholder-gray-400 focus:border-purple-300"
                  }
                  focus:outline-none focus:ring-2 ${theme === "dark" ? "focus:ring-purple-500/20" : "focus:ring-purple-200"}
                `}
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`
                px-3 py-2 text-[13px] rounded-lg border transition-all duration-200 cursor-pointer
                ${theme === "dark"
                  ? "bg-gray-900/40 border-gray-800/60 text-gray-200"
                  : "bg-gray-50/50 border-gray-200/60 text-gray-900"
                }
                focus:outline-none focus:ring-2 ${theme === "dark" ? "focus:ring-purple-500/20" : "focus:ring-purple-200"}
              `}
            >
              <option value="all">All Categories</option>
              <option value="Microphones">Microphones</option>
              <option value="Guitars">Guitars</option>
              <option value="Synthesizers">Synthesizers</option>
              <option value="Drum Machines">Drum Machines</option>
            </select>

            {/* Brand Filter */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className={`
                px-3 py-2 text-[13px] rounded-lg border transition-all duration-200 cursor-pointer
                ${theme === "dark"
                  ? "bg-gray-900/40 border-gray-800/60 text-gray-200"
                  : "bg-gray-50/50 border-gray-200/60 text-gray-900"
                }
                focus:outline-none focus:ring-2 ${theme === "dark" ? "focus:ring-purple-500/20" : "focus:ring-purple-200"}
              `}
            >
              <option value="all">All Brands</option>
              <option value="Neumann">Neumann</option>
              <option value="Fender">Fender</option>
              <option value="Moog">Moog</option>
              <option value="Roland">Roland</option>
            </select>

            {/* Tab Filters */}
            <div className="flex gap-1">
              {[
                { key: "rent", label: "Rent", icon: <Clock className="w-3.5 h-3.5" /> },
                { key: "sale", label: "Buy", icon: <ShoppingCart className="w-3.5 h-3.5" /> },
                { key: "auction", label: "Auction", icon: <Zap className="w-3.5 h-3.5" /> }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                    ${activeTab === tab.key
                      ? theme === "dark"
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-purple-50 text-purple-600 border border-purple-200"
                      : theme === "dark"
                        ? "bg-gray-900/40 hover:bg-gray-800/60 text-gray-400 hover:text-gray-300 border border-gray-800/60"
                        : "bg-gray-50/50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200/60"
                    }
                    active:scale-95
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className={`text-[13px] mb-4 ${
            theme === "dark" ? "text-gray-500" : "text-gray-600"
          }`}>
            {filteredGear.length} {filteredGear.length === 1 ? "item" : "items"} found
          </div>

          {/* Gear List */}
          <div className="space-y-4">
            {filteredGear.map((item) => (
              <div
                key={item.id}
                className={`
                  group rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer
                  ${theme === "dark"
                    ? "bg-gray-900/40 border-gray-800/60 hover:border-gray-700/80 hover:bg-gray-900/60"
                    : "bg-white/50 border-gray-200/60 hover:border-gray-300/80 hover:bg-white/80"
                  }
                  hover:shadow-lg
                `}
                onClick={() => router.push(`/equipment/${item.id}`)}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Images Column */}
                  <div className="md:w-1/3 p-3">
                    <div className="space-y-2">
                      {item.images.slice(0, 3).map((img, i) => (
                        <div
                          key={i}
                          className="relative h-32 rounded-lg overflow-hidden"
                        >
                          <img
                            alt={`${item.title} - ${i + 1}`}
                            src={img}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {i === 0 && item.discount && (
                            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm bg-red-500/90 text-white border border-red-400/50">
                              {item.discount}% OFF
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content Column */}
                  <div className="md:w-2/3 p-4">
                    <div className="flex flex-col h-full">
                      {/* Seller Info */}
                      <div className={`
                        flex items-center gap-3 mb-3 pb-3 border-b
                        ${theme === "dark" ? "border-gray-800/60" : "border-gray-200/60"}
                      `}>
                        <img
                          src={item.seller.avatar}
                          alt={item.seller.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[13px] font-semibold ${
                              theme === "dark" ? "text-gray-200" : "text-gray-900"
                            }`}>
                              {item.seller.name}
                            </span>
                            {item.seller.verified && (
                              <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                              <span className={`text-[11px] font-medium ${
                                theme === "dark" ? "text-gray-400" : "text-gray-600"
                              }`}>
                                {item.seller.rating}
                              </span>
                            </div>
                            <span className={`text-[11px] ${
                              theme === "dark" ? "text-gray-600" : "text-gray-500"
                            }`}>
                              ({item.seller.transactions} sales)
                            </span>
                          </div>
                        </div>
                        <span
                          className={`
                            px-2.5 py-1 rounded-full text-[10px] font-semibold
                            ${item.type === 'rent'
                              ? theme === "dark"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-blue-50 text-blue-600 border border-blue-200/50"
                              : item.type === 'auction'
                                ? theme === "dark"
                                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                  : "bg-orange-50 text-orange-600 border border-orange-200/50"
                                : theme === "dark"
                                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                  : "bg-green-50 text-green-600 border border-green-200/50"
                            }
                          `}
                        >
                          {item.type === 'rent' ? 'RENT' : item.type === 'auction' ? 'AUCTION' : 'SALE'}
                        </span>
                      </div>

                      {/* Main Info */}
                      <div className="flex-1">
                        <h3 className={`text-[16px] font-semibold mb-2 ${
                          theme === "dark" ? "text-gray-200" : "text-gray-900"
                        }`}>
                          {item.title}
                        </h3>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin className={`w-3 h-3 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                            <span className={`text-[12px] ${
                              theme === "dark" ? "text-gray-400" : "text-gray-600"
                            }`}>
                              {item.location}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Package className={`w-3 h-3 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                            <span className={`text-[12px] ${
                              theme === "dark" ? "text-gray-400" : "text-gray-600"
                            }`}>
                              {item.availability}
                            </span>
                          </div>
                        </div>

                        {/* Tags & Specs */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className={`
                                px-2 py-0.5 text-[10px] font-medium rounded-md
                                ${theme === "dark"
                                  ? "bg-gray-800/60 text-gray-400"
                                  : "bg-gray-100 text-gray-600"
                                }
                              `}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Delivery Options */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {item.deliveryOptions.map((option, i) => (
                            <div
                              key={i}
                              className={`
                                flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium
                                ${theme === "dark"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : "bg-blue-50 text-blue-600 border border-blue-200/50"
                                }
                              `}
                            >
                              <Truck className="w-3 h-3" />
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex items-center justify-between gap-4 mt-auto pt-3">
                        <div>
                          {typeof item.price === 'number' ? (
                            <div className="flex items-baseline gap-2">
                              <span className={`text-[24px] font-bold ${
                                theme === "dark" ? "text-green-400" : "text-green-600"
                              }`}>
                                ${item.price}
                              </span>
                              {item.originalPrice && (
                                <span className={`text-[12px] line-through ${
                                  theme === "dark" ? "text-gray-600" : "text-gray-400"
                                }`}>
                                  ${item.originalPrice}
                                </span>
                              )}
                              {item.type === 'rent' && (
                                <span className={`text-[12px] ${
                                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                                }`}>
                                  /day
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className={`text-[18px] font-semibold ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}>
                              ${item.price}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            className={`
                              p-2 rounded-lg transition-all duration-200
                              ${theme === "dark"
                                ? "bg-gray-800/60 hover:bg-gray-800 border border-gray-800/60"
                                : "bg-gray-100/80 hover:bg-gray-200 border border-gray-200/60"
                              }
                              active:scale-95
                            `}
                            onClick={(e) => toggleLike(item.id, e)}
                          >
                            <Heart className={`w-3.5 h-3.5 ${item.liked ? "fill-red-500 text-red-500" : theme === "dark" ? "text-gray-400" : "text-gray-600"}`} />
                          </button>

                          <button
                            className={`
                              flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                              ${theme === "dark"
                                ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20"
                                : "bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200/50"
                              }
                              active:scale-95
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.type === 'auction') {
                                setShowBidModal(true);
                              }
                            }}
                          >
                            {item.type === 'rent' ? (
                              <>
                                <Clock className="w-3.5 h-3.5" />
                                Rent Now
                              </>
                            ) : item.type === 'auction' ? (
                              <>
                                <Zap className="w-3.5 h-3.5" />
                                Place Bid
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-3.5 h-3.5" />
                                Buy Now
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredGear.length === 0 && (
            <div className={`
              text-center py-12 rounded-lg border backdrop-blur-sm
              ${theme === "dark"
                ? "bg-gray-950/40 border-gray-800/50"
                : "bg-white/40 border-gray-200/60"
              }
            `}>
              <Package className={`w-12 h-12 mx-auto mb-3 ${
                theme === "dark" ? "text-gray-700" : "text-gray-300"
              }`} />
              <p className={`text-[14px] font-medium mb-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                No gear found
              </p>
              <p className={`text-[12px] ${
                theme === "dark" ? "text-gray-600" : "text-gray-500"
              }`}>
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Sidebar */}
      <div className={`
        w-80 border-l hidden xl:block p-6 overflow-y-auto
        ${theme === "dark"
          ? "bg-black border-gray-800/50"
          : "bg-white/40 border-gray-200/60"
        }
      `}>
        <div className="sticky top-6">
          <h2 className={`text-lg font-semibold mb-4 ${
            theme === "dark" ? "text-gray-200" : "text-gray-900"
          }`}>
            Gear Activity
          </h2>
          
          {/* Activity Feed */}
          <div className="space-y-3 mb-6">
            {gearActivityData.map((activity) => (
              <div
                key={activity.id}
                className={`
                  p-3 rounded-lg border transition-all duration-200
                  ${theme === "dark"
                    ? "bg-gray-900/40 border-gray-800/60"
                    : "bg-white/50 border-gray-200/60"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={activity.user.avatar}
                    alt={activity.user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[12px] ${
                      theme === "dark" ? "text-gray-300" : "text-gray-900"
                    }`}>
                      <span className="font-medium flex items-center gap-1">
                        {activity.user.name}
                        {activity.user.verified && (
                          <CheckCircle className="w-3 h-3 text-blue-500" />
                        )}
                      </span>
                      {' '}
                      <span className={theme === "dark" ? "text-gray-500" : "text-gray-600"}>
                        {activity.action === 'purchased' ? 'purchased' :
                         activity.action === 'listed' ? 'listed' :
                         activity.action === 'rented' ? 'rented' :
                         activity.action === 'reviewed' ? 'reviewed' : 'bid on'}
                      </span>
                      {' '}
                      <span className="font-medium">{activity.item}</span>
                      {activity.price && (
                        <>
                          {' for '}
                          <span className="font-semibold">{activity.price}</span>
                        </>
                      )}
                    </div>
                    {activity.rating && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-2.5 h-2.5 ${
                              i < activity.rating!
                                ? "fill-yellow-500 text-yellow-500"
                                : theme === "dark"
                                  ? "text-gray-700"
                                  : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <div className={`text-[11px] mt-1 ${
                      theme === "dark" ? "text-gray-600" : "text-gray-500"
                    }`}>
                      {activity.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className={`h-px my-6 ${
            theme === "dark" ? "bg-gray-800/60" : "bg-gray-200/60"
          }`} />

          {/* Trusted Sellers */}
          <div>
            <h3 className={`text-[15px] font-semibold mb-4 ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              Trusted Sellers
            </h3>
            <div className="space-y-3">
              {gear.filter(s => s.seller.verified).slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className={`
                    flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200 cursor-pointer
                    ${theme === "dark"
                      ? "bg-gray-900/40 border-gray-800/60 hover:bg-gray-900/60"
                      : "bg-white/50 border-gray-200/60 hover:bg-white/80"
                    }
                  `}
                >
                  <img
                    src={item.seller.avatar}
                    alt={item.seller.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] font-medium truncate flex items-center gap-1 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-900"
                    }`}>
                      {item.seller.name}
                      <CheckCircle className="w-3 h-3 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span className={`text-[11px] font-medium ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {item.seller.rating} ({item.seller.transactions})
                      </span>
                    </div>
                  </div>
                  <button
                    className={`
                      px-3 py-1 text-[11px] font-medium rounded-lg transition-all duration-200
                      ${theme === "dark"
                        ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20"
                        : "bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200/50"
                      }
                      active:scale-95
                    `}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className={`h-px my-6 ${
            theme === "dark" ? "bg-gray-800/60" : "bg-gray-200/60"
          }`} />

          {/* Safety Tips */}
          <div>
            <h3 className={`text-[15px] font-semibold mb-4 ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              Safety Tips
            </h3>
            <div className="space-y-3">
              {[
                { icon: <Shield className="w-4 h-4" />, title: "Meet safely", desc: "Use verified meetup spots" },
                { icon: <CheckCircle className="w-4 h-4" />, title: "Inspect gear", desc: "Check before payment" },
                { icon: <Shield className="w-4 h-4" />, title: "Secure payment", desc: "Avoid cash when possible" }
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`p-1.5 rounded ${
                    theme === "dark" ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
                  }`}>
                    {tip.icon}
                  </div>
                  <div>
                    <div className={`text-[12px] font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-900"
                    }`}>
                      {tip.title}
                    </div>
                    <div className={`text-[11px] ${
                      theme === "dark" ? "text-gray-600" : "text-gray-500"
                    }`}>
                      {tip.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`
            w-full max-w-md rounded-lg border p-6
            ${theme === "dark"
              ? "bg-gray-900 border-gray-800"
              : "bg-white border-gray-200"
            }
          `}>
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === "dark" ? "text-gray-200" : "text-gray-900"
            }`}>
              Place Your Bid
            </h3>

            {/* Item Preview */}
            <div className="flex items-start gap-3 mb-4">
              <img
                src={gear.find(i => i.type === 'auction')?.images[0]}
                alt="Auction item"
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className={`font-semibold text-[14px] mb-1 ${
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                }`}>
                  Roland TR-8S Rhythm Performer
                </h4>
                <div className={`text-[12px] ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>
                  Current bid: $550
                </div>
              </div>
            </div>

            {/* Bid Amount */}
            <div className="mb-4">
              <label className={`block text-[13px] font-medium mb-2 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}>
                Your Bid: ${bidPrice}
              </label>
              <input
                type="range"
                min="550"
                max="1200"
                step="10"
                value={bidPrice}
                onChange={(e) => setBidPrice(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: theme === "dark"
                    ? `linear-gradient(to right, #a855f7 0%, #a855f7 ${((bidPrice - 550) / 650) * 100}%, #374151 ${((bidPrice - 550) / 650) * 100}%, #374151 100%)`
                    : `linear-gradient(to right, #9333ea 0%, #9333ea ${((bidPrice - 550) / 650) * 100}%, #e5e7eb ${((bidPrice - 550) / 650) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className={`text-[11px] mt-1 ${
                theme === "dark" ? "text-gray-600" : "text-gray-500"
              }`}>
                Next minimum bid: $560
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className={`block text-[13px] font-medium mb-2 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}>
                Payment Method
              </label>
              <select
                className={`
                  w-full px-3 py-2 text-[13px] rounded-lg border transition-all duration-200
                  ${theme === "dark"
                    ? "bg-gray-800/40 border-gray-700/60 text-gray-200"
                    : "bg-gray-50/50 border-gray-200/60 text-gray-900"
                  }
                  focus:outline-none focus:ring-2 ${theme === "dark" ? "focus:ring-purple-500/20" : "focus:ring-purple-200"}
                `}
              >
                <option>PayPal</option>
                <option>Credit/Debit Card</option>
                <option>Crypto</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowBidModal(false)}
                className={`
                  flex-1 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                  ${theme === "dark"
                    ? "bg-gray-800/60 hover:bg-gray-800 text-gray-300 border border-gray-700/60"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                  }
                  active:scale-95
                `}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowBidModal(false);
                  // Handle bid submission
                }}
                className={`
                  flex-1 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200
                  ${theme === "dark"
                    ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
                    : "bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200"
                  }
                  active:scale-95
                `}
              >
                Submit Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}