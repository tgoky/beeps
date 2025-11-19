"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Heart, Star, MapPin, Clock, TrendingUp, DollarSign, Zap, Package, Truck, Shield, Users, CheckCircle, Share2, Plus, Loader2 } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { useEquipment, type Equipment as APIEquipment } from "@/hooks/useEquipment";

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

// Helper to transform API equipment to display format
const transformEquipment = (apiEquipment: APIEquipment): Equipment => {
  const type: 'rent' | 'sale' | 'auction' = apiEquipment.rentalRate ? 'rent' : 'sale';
  const price = type === 'rent' ? apiEquipment.rentalRate! : apiEquipment.salePrice!;

  return {
    id: parseInt(apiEquipment.id, 36), // Convert UUID to number for component compatibility
    title: apiEquipment.name,
    type,
    seller: {
      name: apiEquipment.owner.name || apiEquipment.owner.email.split('@')[0],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiEquipment.owner.id}`,
      rating: 4.5 + Math.random() * 0.5, // Mock rating until we have real reviews
      verified: true,
      transactions: Math.floor(Math.random() * 50) + 10
    },
    price,
    category: apiEquipment.category,
    brand: apiEquipment.name.split(' ')[0], // Extract brand from name
    location: "Remote", // Will be added with location system later
    availability: apiEquipment.isActive ? "Available now" : "Unavailable",
    images: apiEquipment.imageUrl ? [apiEquipment.imageUrl] : ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04"],
    liked: false,
    rating: 4.5 + Math.random() * 0.5,
    reviewCount: Math.floor(Math.random() * 30) + 5,
    deliveryOptions: type === 'rent' ? ["Pickup"] : ["Pickup", "Shipping"],
    tags: [apiEquipment.condition, apiEquipment.category],
    specs: [
      { label: "Condition", value: apiEquipment.condition },
      { label: "Category", value: apiEquipment.category }
    ]
  };
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function GearMarketplace() {
  const router = useRouter();
  const { theme } = useTheme();
  const { permissions, isGearSales, isProducer, isStudioOwner } = usePermissions();

  const [activeTab, setActiveTab] = useState("rent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidPrice, setBidPrice] = useState(600);

  // Fetch equipment from API
  const { data: apiEquipment = [], isLoading, error } = useEquipment({
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    forRent: activeTab === "rent" ? true : undefined,
    forSale: activeTab === "sale" ? true : undefined,
  });

  // Transform API data to display format
  const gear = apiEquipment.map(transformEquipment);

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement like functionality with API
    console.log("Like equipment:", id);
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
    <div className={`min-h-screen p-6 transition-colors duration-200 ${
      theme === "dark" 
        ? "bg-black text-white" 
        : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Main Content - 3 columns */}
          <div className="xl:col-span-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    theme === "dark" ? "bg-white" : "bg-gray-900"
                  }`}>
                    <Package className={`w-4 h-4 ${
                      theme === "dark" ? "text-black" : "text-white"
                    }`} strokeWidth={2.5} />
                  </div>
                  <h1 className="text-2xl font-light tracking-tight">
                    Gear Marketplace
                  </h1>
                </div>
                <p className={`text-sm font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-600"
                }`}>
                  Rent, buy, or sell professional music equipment
                </p>
              </div>

              {/* Create Listing Buttons - Permission Based */}
              <div className="flex gap-2">
                {permissions.canListGearForSale && (
                  <button
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                      theme === "dark"
                        ? "bg-white border-white text-black hover:bg-zinc-100"
                        : "bg-black border-black text-white hover:bg-gray-800"
                    }`}
                    onClick={() => router.push('/equipment/create?type=sale')}
                  >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    List for Sale
                  </button>
                )}
                {permissions.canListGearForRent && (
                  <button
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                      theme === "dark"
                        ? "bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
                        : "bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200"
                    }`}
                    onClick={() => router.push('/equipment/create?type=rent')}
                  >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    List for Rent
                  </button>
                )}
                {permissions.canCreateGearAuction && (
                  <button
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                      theme === "dark"
                        ? "bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
                        : "bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200"
                    }`}
                    onClick={() => router.push('/equipment/create?type=auction')}
                  >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    Create Auction
                  </button>
                )}
              </div>
            </div>

            {/* Permission Info Banners */}
            {isGearSales && (
              <div className={`mb-6 p-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-emerald-950/20 border-emerald-900/30"
                  : "bg-emerald-50 border-emerald-200/50"
              }`}>
                <div className="flex items-start gap-3">
                  <Shield className={`w-5 h-5 ${
                    theme === "dark" ? "text-emerald-400" : "text-emerald-600"
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      theme === "dark" ? "text-emerald-300" : "text-emerald-900"
                    }`}>
                      Certified Gear Dealer {permissions.isCertifiedGearDealer && "✓"}
                      {permissions.hasGearCollectorTier && " • Gear Collector Tier"}
                    </p>
                    <p className={`text-xs mt-1 ${
                      theme === "dark" ? "text-emerald-400/70" : "text-emerald-700/70"
                    }`}>
                      Full marketplace access: List vintageequipment, create auctions, manage club inventory, VIP gear drops, and full analytics.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(isProducer || isStudioOwner) && !isGearSales && (
              <div className={`mb-6 p-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-blue-950/20 border-blue-900/30"
                  : "bg-blue-50 border-blue-200/50"
              }`}>
                <div className="flex items-start gap-3">
                  <Package className={`w-5 h-5 ${
                    theme === "dark" ? "text-blue-400" : "text-blue-600"
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      theme === "dark" ? "text-blue-300" : "text-blue-900"
                    }`}>
                      {isProducer ? "Producer" : "Studio Owner"} Marketplace Access
                    </p>
                    <p className={`text-xs mt-1 ${
                      theme === "dark" ? "text-blue-400/70" : "text-blue-700/70"
                    }`}>
                      List professional gear for sale/rent, create auctions, access VIP drops, and view analytics on your listings.
                    </p>
                  </div>
                </div>
              </div>
            )}


            {/* Filters */}
            <div className={`flex flex-wrap gap-3 mb-8 p-4 rounded-xl border ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950"
                : "border-gray-300 bg-white"
            }`}>
              {/* Search */}
              <div className="relative flex-1 min-w-[250px]">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  theme === "dark" ? "text-zinc-600" : "text-gray-500"
                }`} strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search gear, brands, sellers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none ${
                    theme === "dark"
                      ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus:border-white focus:bg-black"
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:bg-white"
                  }`}
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 cursor-pointer tracking-wide focus:outline-none ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800 text-white focus:border-white focus:bg-black"
                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-900 focus:bg-white"
                }`}
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
                className={`px-4 py-3 text-sm font-light rounded-lg border transition-all duration-200 cursor-pointer tracking-wide focus:outline-none ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800 text-white focus:border-white focus:bg-black"
                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-900 focus:bg-white"
                }`}
              >
                <option value="all">All Brands</option>
                <option value="Neumann">Neumann</option>
                <option value="Fender">Fender</option>
                <option value="Moog">Moog</option>
                <option value="Roland">Roland</option>
              </select>

              {/* Tab Filters */}
              <div className={`flex items-center gap-1 p-1 rounded-lg border ${
                theme === "dark" ? "border-zinc-800 bg-zinc-900" : "border-gray-300 bg-gray-100"
              }`}>
                {[
                  { key: "rent", label: "Rent", icon: Clock },
                  { key: "sale", label: "Buy", icon: ShoppingCart },
                  { key: "auction", label: "Auction", icon: Zap }
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`
                        flex items-center gap-2 px-4 py-2 text-sm font-light rounded transition-all duration-200 tracking-wide
                        ${activeTab === tab.key
                          ? theme === "dark"
                            ? "bg-white text-black"
                            : "bg-black text-white"
                          : theme === "dark"
                            ? "text-zinc-400 hover:text-white"
                            : "text-gray-600 hover:text-black"
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
                <Loader2 className={`w-8 h-8 animate-spin ${
                  theme === "dark" ? "text-zinc-600" : "text-gray-400"
                }`} />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className={`p-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}>
                <p className="text-sm">Failed to load equipment. Please try again.</p>
              </div>
            )}

            {/* Results Count */}
            {!isLoading && !error && (
              <div className={`text-sm font-light tracking-wide mb-6 ${
                theme === "dark" ? "text-zinc-500" : "text-gray-600"
              }`}>
                {filteredGear.length} {filteredGear.length === 1 ? "item" : "items"} found
              </div>
            )}

            {/* Gear List */}
            {!isLoading && !error && (
              <div className="space-y-4">
              {filteredGear.map((item) => (
                <div
                  key={item.id}
                  className={`group rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900"
                      : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                  }`}
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
                              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-light tracking-wide backdrop-blur-sm bg-red-500/90 text-white border border-red-400/50">
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
                          ${theme === "dark" ? "border-zinc-800" : "border-gray-300"}
                        `}>
                          <img
                            src={item.seller.avatar}
                            alt={item.seller.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-sm font-light tracking-wide ${
                                theme === "dark" ? "text-white" : "text-gray-900"
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
                                <span className={`text-xs font-light ${
                                  theme === "dark" ? "text-zinc-400" : "text-gray-600"
                                }`}>
                                  {item.seller.rating}
                                </span>
                              </div>
                              <span className={`text-xs font-light ${
                                theme === "dark" ? "text-zinc-600" : "text-gray-500"
                              }`}>
                                ({item.seller.transactions} sales)
                              </span>
                            </div>
                          </div>
                          <span
                            className={`
                              px-2.5 py-1 rounded-full text-xs font-light tracking-wide
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
                          <h3 className={`text-base font-light tracking-wide mb-2 ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}>
                            {item.title}
                          </h3>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="flex items-center gap-1.5">
                              <MapPin className={`w-3 h-3 ${
                                theme === "dark" ? "text-zinc-500" : "text-gray-500"
                              }`} />
                              <span className={`text-xs font-light tracking-wide ${
                                theme === "dark" ? "text-zinc-400" : "text-gray-600"
                              }`}>
                                {item.location}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Package className={`w-3 h-3 ${
                                theme === "dark" ? "text-zinc-500" : "text-gray-500"
                              }`} />
                              <span className={`text-xs font-light tracking-wide ${
                                theme === "dark" ? "text-zinc-400" : "text-gray-600"
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
                                className={`px-2 py-0.5 text-xs font-light tracking-wide rounded ${
                                  theme === "dark"
                                    ? "bg-zinc-800 text-zinc-300"
                                    : "bg-gray-100 text-gray-700"
                                }`}
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
                                  flex items-center gap-1 px-2 py-0.5 rounded text-xs font-light tracking-wide
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
                                <span className={`text-xl font-light tracking-tight ${
                                  theme === "dark" ? "text-green-400" : "text-green-600"
                                }`}>
                                  ${item.price}
                                </span>
                                {item.originalPrice && (
                                  <span className={`text-xs font-light tracking-wide line-through ${
                                    theme === "dark" ? "text-zinc-600" : "text-gray-400"
                                  }`}>
                                    ${item.originalPrice}
                                  </span>
                                )}
                                {item.type === 'rent' && (
                                  <span className={`text-xs font-light tracking-wide ${
                                    theme === "dark" ? "text-zinc-500" : "text-gray-600"
                                  }`}>
                                    /day
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className={`text-lg font-light tracking-wide ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}>
                                ${item.price}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              className={`p-2 rounded-lg border transition-all duration-200 active:scale-95 ${
                                theme === "dark"
                                  ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                                  : "border-gray-300 text-gray-500 hover:text-black hover:border-gray-400"
                              }`}
                              onClick={(e) => toggleLike(item.id, e)}
                            >
                              <Heart className={`w-4 h-4 ${item.liked ? "fill-red-500 text-red-500" : ""}`} />
                            </button>

                            <button
                              className={`flex items-center gap-2 px-4 py-2 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                                theme === "dark"
                                  ? "bg-white border-white text-black hover:bg-zinc-100"
                                  : "bg-black border-black text-white hover:bg-gray-800"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.type === 'auction') {
                                  setShowBidModal(true);
                                }
                              }}
                            >
                              {item.type === 'rent' ? (
                                <>
                                  <Clock className="w-4 h-4" />
                                  Rent Now
                                </>
                              ) : item.type === 'auction' ? (
                                <>
                                  <Zap className="w-4 h-4" />
                                  Place Bid
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-4 h-4" />
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
                <div className={`text-center py-16 rounded-xl border ${
                  theme === "dark"
                    ? "border-zinc-800 bg-zinc-950"
                    : "border-gray-300 bg-white"
                }`}>
                  <Package className={`w-12 h-12 mx-auto mb-3 ${
                    theme === "dark" ? "text-zinc-700" : "text-gray-400"
                  }`} />
                  <p className={`text-sm font-light tracking-wide mb-1 ${
                    theme === "dark" ? "text-zinc-400" : "text-gray-600"
                  }`}>
                    No gear found
                  </p>
                  <p className={`text-xs font-light tracking-wide ${
                    theme === "dark" ? "text-zinc-600" : "text-gray-500"
                  }`}>
                    Try adjusting your filters or search query
                  </p>
                </div>
              )}
            </div>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="xl:col-span-1 space-y-6">
            {/* Marketplace Stats */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950"
                : "border-gray-300 bg-white"
            }`}>
              <h2 className={`text-lg font-light tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Marketplace Stats
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-light ${
                    theme === "dark" ? "text-zinc-500" : "text-gray-600"
                  }`}>
                    Total Listings
                  </span>
                  <span className={`text-sm font-light ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {gear.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-light ${
                    theme === "dark" ? "text-zinc-500" : "text-gray-600"
                  }`}>
                    For Rent
                  </span>
                  <span className={`text-sm font-light ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {gear.filter(g => g.type === 'rent').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-light ${
                    theme === "dark" ? "text-zinc-500" : "text-gray-600"
                  }`}>
                    For Sale
                  </span>
                  <span className={`text-sm font-light ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {gear.filter(g => g.type === 'sale').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Trusted Sellers */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark" 
                ? "border-zinc-800 bg-zinc-950" 
                : "border-gray-300 bg-white"
            }`}>
              <h3 className={`text-lg font-light tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Trusted Sellers
              </h3>
              <div className="space-y-3">
                {gear.filter(s => s.seller.verified).slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800"
                        : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    <img
                      src={item.seller.avatar}
                      alt={item.seller.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-light tracking-wide truncate flex items-center gap-1 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {item.seller.name}
                        <CheckCircle className="w-3 h-3 text-blue-500" />
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span className={`text-xs font-light ${
                          theme === "dark" ? "text-zinc-400" : "text-gray-600"
                        }`}>
                          {item.seller.rating} ({item.seller.transactions})
                        </span>
                      </div>
                    </div>
                    <button
                      className={`px-3 py-1 text-xs font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                        theme === "dark"
                          ? "bg-white border-white text-black hover:bg-zinc-100"
                          : "bg-black border-black text-white hover:bg-gray-800"
                      }`}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Tips */}
            <div className={`rounded-xl border p-4 ${
              theme === "dark" 
                ? "border-zinc-800 bg-zinc-950" 
                : "border-gray-300 bg-white"
            }`}>
              <h3 className={`text-lg font-light tracking-wide mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
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
                      <div className={`text-xs font-light tracking-wide ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {tip.title}
                      </div>
                      <div className={`text-xs font-light tracking-wide ${
                        theme === "dark" ? "text-zinc-600" : "text-gray-500"
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
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`
            w-full max-w-md rounded-xl border p-6
            ${theme === "dark"
              ? "border-zinc-800 bg-zinc-950"
              : "border-gray-300 bg-white"
            }
          `}>
            <h3 className={`text-lg font-light tracking-wide mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
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
                <h4 className={`font-light tracking-wide text-sm mb-1 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Roland TR-8S Rhythm Performer
                </h4>
                <div className={`text-xs font-light tracking-wide ${
                  theme === "dark" ? "text-zinc-500" : "text-gray-600"
                }`}>
                  Current bid: $550
                </div>
              </div>
            </div>

            {/* Bid Amount */}
            <div className="mb-4">
              <label className={`block text-sm font-light tracking-wide mb-2 ${
                theme === "dark" ? "text-zinc-400" : "text-gray-600"
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
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                  theme === "dark" ? "bg-zinc-800" : "bg-gray-300"
                }`}
                style={{
                  background: theme === "dark"
                    ? `linear-gradient(to right, #a855f7 0%, #a855f7 ${((bidPrice - 550) / 650) * 100}%, #374151 ${((bidPrice - 550) / 650) * 100}%, #374151 100%)`
                    : `linear-gradient(to right, #9333ea 0%, #9333ea ${((bidPrice - 550) / 650) * 100}%, #e5e7eb ${((bidPrice - 550) / 650) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className={`text-xs font-light tracking-wide mt-1 ${
                theme === "dark" ? "text-zinc-600" : "text-gray-500"
              }`}>
                Next minimum bid: $560
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className={`block text-sm font-light tracking-wide mb-2 ${
                theme === "dark" ? "text-zinc-400" : "text-gray-600"
              }`}>
                Payment Method
              </label>
              <select
                className={`w-full px-3 py-2 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide focus:outline-none ${
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-800 text-white focus:border-white"
                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-900"
                }`}
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
                className={`flex-1 px-4 py-2.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                  theme === "dark"
                    ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                    : "border-gray-300 text-gray-600 hover:text-black hover:border-gray-400"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowBidModal(false);
                  // Handle bid submission
                }}
                className={`flex-1 px-4 py-2.5 text-sm font-light rounded-lg border transition-all duration-200 tracking-wide active:scale-95 ${
                  theme === "dark"
                    ? "bg-white border-white text-black hover:bg-zinc-100"
                    : "bg-black border-black text-white hover:bg-gray-800"
                }`}
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