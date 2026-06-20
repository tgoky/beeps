"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Heart, Star, MapPin, Clock, TrendingUp, DollarSign, Zap, Package, Truck, Shield, Users, CheckCircle, Share2, Plus, Loader2 } from "lucide-react";
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

// Helper to safely extract the array from the API response
function extractEquipmentArray(data: any): APIEquipment[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.equipment)) return data.equipment;
  if (Array.isArray(data.data?.equipment)) return data.data.equipment;
  return [];
}

// Helper to transform API equipment to display format
const transformEquipment = (apiEquipment: APIEquipment): Equipment => {
  const type: 'rent' | 'sale' | 'auction' = apiEquipment.rentalRate ? 'rent' : 'sale';
  const price = type === 'rent' ? apiEquipment.rentalRate! : apiEquipment.salePrice!;

  return {
    id: parseInt(apiEquipment.id, 36) || Math.floor(Math.random() * 10000), // Convert UUID to number fallback
    title: apiEquipment.name,
    type,
    seller: {
      name: apiEquipment.owner?.name || apiEquipment.owner?.email?.split('@')[0] || "Unknown User",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiEquipment.owner?.id || 'default'}`,
      rating: 4.5 + Math.random() * 0.5, // Mock rating until real reviews
      verified: true,
      transactions: Math.floor(Math.random() * 50) + 10
    },
    price,
    category: apiEquipment.category,
    brand: apiEquipment.name.split(' ')[0],
    location: "Remote",
    availability: apiEquipment.isActive ? "Available now" : "Unavailable",
    images: apiEquipment.imageUrl ? [apiEquipment.imageUrl] : ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04"],
    liked: false,
    rating: 4.5 + Math.random() * 0.5,
    reviewCount: Math.floor(Math.random() * 30) + 5,
    deliveryOptions: type === 'rent' ? ["Pickup"] : ["Pickup", "Shipping"],
    tags: [apiEquipment.condition || 'Used', apiEquipment.category],
    specs: [
      { label: "Condition", value: apiEquipment.condition || 'Used' },
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
  const { permissions, isGearSales, isProducer, isStudioOwner } = usePermissions();

  const [activeTab, setActiveTab] = useState("rent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidPrice, setBidPrice] = useState(600);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Search, category, and type are filtered server-side
  const { data: rawApiData, isLoading, error } = useEquipment({
    search: debouncedSearch || undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    forRent: activeTab === "rent" ? true : undefined,
    forSale: activeTab === "sale" ? true : undefined,
  });

  // Safely extract and transform the data
  const safeApiEquipment = extractEquipmentArray(rawApiData);
  const gear = safeApiEquipment.map(transformEquipment);

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Like equipment:", id);
  };

  const filteredGear = selectedBrand !== "all"
    ? gear.filter(item => item.brand === selectedBrand)
    : gear;

  return (
    <div className="h-full overflow-y-auto bg-[#030303] text-white">
      <div className="max-w-[1600px] mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Main Content - 3 columns */}
          <div className="xl:col-span-3">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <Package className="w-5 h-5 text-black" strokeWidth={2.5} />
                  </div>
                  <h1 className="text-2xl font-semibold tracking-tight text-white">
                    Gear Marketplace
                  </h1>
                </div>
                <p className="text-sm text-zinc-400">
                  Rent, buy, or sell professional music equipment
                </p>
              </div>

              {/* Create Listing Buttons */}
              <div className="flex flex-wrap gap-2">
                {permissions.canListGearForSale && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all active:scale-95 bg-white border border-white text-black hover:bg-zinc-200"
                    onClick={() => router.push('/equipment/create?type=sale')}
                  >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    List for Sale
                  </button>
                )}
                {permissions.canListGearForRent && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all active:scale-95 bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800"
                    onClick={() => router.push('/equipment/create?type=rent')}
                  >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    List for Rent
                  </button>
                )}
                {permissions.canCreateGearAuction && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all active:scale-95 bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800"
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
              <div className="mb-6 p-4 rounded-xl border bg-emerald-950/20 border-emerald-900/30">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-300">
                      Certified Gear Dealer {permissions.isCertifiedGearDealer && "✓"}
                      {permissions.hasGearCollectorTier && " • Gear Collector Tier"}
                    </p>
                    <p className="text-xs mt-1 text-emerald-400/70">
                      Full marketplace access: List vintage equipment, create auctions, manage club inventory, VIP gear drops, and full analytics.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(isProducer || isStudioOwner) && !isGearSales && (
              <div className="mb-6 p-4 rounded-xl border bg-blue-950/20 border-blue-900/30">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-300">
                      {isProducer ? "Producer" : "Studio Owner"} Marketplace Access
                    </p>
                    <p className="text-xs mt-1 text-blue-400/70">
                      List professional gear for sale/rent, create auctions, access VIP drops, and view analytics on your listings.
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
                  placeholder="Search gear, brands, sellers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-lg border transition-all focus:outline-none bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-600 focus:bg-zinc-800"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 text-sm rounded-lg border transition-all cursor-pointer focus:outline-none bg-zinc-900 border-zinc-800 text-white focus:border-zinc-600 focus:bg-zinc-800"
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
                className="px-4 py-3 text-sm rounded-lg border transition-all cursor-pointer focus:outline-none bg-zinc-900 border-zinc-800 text-white focus:border-zinc-600 focus:bg-zinc-800"
              >
                <option value="all">All Brands</option>
                <option value="Neumann">Neumann</option>
                <option value="Fender">Fender</option>
                <option value="Moog">Moog</option>
                <option value="Roland">Roland</option>
              </select>

              {/* Tab Filters */}
              <div className="flex items-center gap-1 p-1 rounded-lg border border-zinc-800 bg-zinc-900 overflow-x-auto scrollbar-hide">
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
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-all whitespace-nowrap
                        ${activeTab === tab.key
                          ? "bg-white text-black shadow-sm"
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
              <div className="p-4 rounded-xl border bg-red-500/10 border-red-500/20 text-red-400">
                <p className="text-sm">Failed to load equipment. Please try again.</p>
              </div>
            )}

            {/* Results Count */}
            {!isLoading && !error && (
              <div className="text-sm font-medium text-zinc-500 mb-6">
                {filteredGear.length} {filteredGear.length === 1 ? "item" : "items"} found
              </div>
            )}

            {/* Gear List */}
            {!isLoading && !error && (
              <div className="space-y-4">
              {filteredGear.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.98] border-zinc-800 bg-[#0A0A0A] hover:border-zinc-700 hover:bg-zinc-900"
                  onClick={() => router.push(`/equipment/${item.id}`)}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Images Column */}
                    <div className="md:w-1/3 p-3">
                      <div className="space-y-2">
                        {item.images.slice(0, 3).map((img, i) => (
                          <div key={i} className="relative h-32 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
                            <img
                              alt={`${item.title} - ${i + 1}`}
                              src={img}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {i === 0 && item.discount && (
                              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-red-500/90 text-white shadow-sm">
                                {item.discount}% OFF
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Content Column */}
                    <div className="md:w-2/3 p-4 flex flex-col h-full">
                      {/* Seller Info */}
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800">
                        <img
                          src={item.seller.avatar}
                          alt={item.seller.name}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-800"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white">
                              {item.seller.name}
                            </span>
                            {item.seller.verified && (
                              <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                              <span className="text-xs font-medium text-zinc-400">
                                {item.seller.rating}
                              </span>
                            </div>
                            <span className="text-xs text-zinc-500">
                              ({item.seller.transactions} sales)
                            </span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border
                          ${item.type === 'rent'
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : item.type === 'auction'
                              ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                              : "bg-green-500/10 text-green-400 border-green-500/20"
                          }`}
                        >
                          {item.type === 'rent' ? 'Rent' : item.type === 'auction' ? 'Auction' : 'Sale'}
                        </span>
                      </div>

                      {/* Main Info */}
                      <div className="flex-1">
                        <h3 className="text-base font-medium mb-3 text-white">
                          {item.title}
                        </h3>

                        <div className="flex flex-wrap gap-4 mb-4">
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <MapPin className="w-4 h-4" />
                            <span className="text-xs">{item.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Package className="w-4 h-4" />
                            <span className="text-xs">{item.availability}</span>
                          </div>
                        </div>

                        {/* Tags & Options */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {item.deliveryOptions.map((option, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900/50 border border-zinc-800 text-zinc-400">
                              <Truck className="w-3.5 h-3.5" />
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex items-center justify-between gap-4 mt-auto pt-4 border-t border-zinc-800">
                        <div>
                          {typeof item.price === 'number' ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-semibold text-green-400">
                                ${item.price}
                              </span>
                              {item.originalPrice && (
                                <span className="text-sm text-zinc-500 line-through">
                                  ${item.originalPrice}
                                </span>
                              )}
                              {item.type === 'rent' && (
                                <span className="text-sm text-zinc-500">/day</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-lg font-medium text-white">
                              {item.price}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 rounded-lg border transition-all active:scale-95 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800"
                            onClick={(e) => toggleLike(item.id, e)}
                          >
                            <Heart className={`w-4 h-4 ${item.liked ? "fill-red-500 text-red-500" : ""}`} />
                          </button>

                          <button
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all active:scale-95 bg-white border-white text-black hover:bg-zinc-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.type === 'auction') {
                                setShowBidModal(true);
                              }
                            }}
                          >
                            {item.type === 'rent' ? (
                              <><Clock className="w-4 h-4" /> Rent Now</>
                            ) : item.type === 'auction' ? (
                              <><Zap className="w-4 h-4" /> Place Bid</>
                            ) : (
                              <><ShoppingCart className="w-4 h-4" /> Buy Now</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {filteredGear.length === 0 && (
                <div className="text-center py-16 rounded-xl border border-zinc-800 bg-[#0A0A0A]">
                  <Package className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                  <p className="text-sm font-medium mb-1 text-zinc-300">
                    No gear found
                  </p>
                  <p className="text-xs text-zinc-500">
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
            <div className="rounded-xl border p-5 border-zinc-800 bg-[#0A0A0A]">
              <h2 className="text-sm font-semibold tracking-wide mb-4 text-white">
                Marketplace Stats
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400">Total Listings</span>
                  <span className="text-sm font-medium text-white">{gear.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400">For Rent</span>
                  <span className="text-sm font-medium text-white">{gear.filter(g => g.type === 'rent').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400">For Sale</span>
                  <span className="text-sm font-medium text-white">{gear.filter(g => g.type === 'sale').length}</span>
                </div>
              </div>
            </div>

            {/* Trusted Sellers */}
            <div className="rounded-xl border p-5 border-zinc-800 bg-[#0A0A0A]">
              <h3 className="text-sm font-semibold tracking-wide mb-4 text-white">
                Trusted Sellers
              </h3>
              <div className="space-y-3">
                {gear.filter(s => s.seller.verified).slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800"
                  >
                    <img
                      src={item.seller.avatar}
                      alt={item.seller.name}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-800"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-1.5 text-white mb-0.5">
                        {item.seller.name}
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-400">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span>{item.seller.rating}</span>
                        <span className="text-zinc-600">•</span>
                        <span>{item.seller.transactions} sales</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Tips */}
            <div className="rounded-xl border p-5 border-zinc-800 bg-[#0A0A0A]">
              <h3 className="text-sm font-semibold tracking-wide mb-4 text-white">
                Safety Tips
              </h3>
              <div className="space-y-4">
                {[
                  { icon: <Shield className="w-4 h-4" />, title: "Meet safely", desc: "Use verified meetup spots" },
                  { icon: <CheckCircle className="w-4 h-4" />, title: "Inspect gear", desc: "Check before payment" },
                  { icon: <Shield className="w-4 h-4" />, title: "Secure payment", desc: "Avoid cash when possible" }
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 shrink-0">
                      {tip.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white mb-0.5">{tip.title}</div>
                      <div className="text-xs text-zinc-400">{tip.desc}</div>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-xl border p-6 border-zinc-800 bg-[#0A0A0A] shadow-2xl">
            <h3 className="text-lg font-medium mb-5 text-white">
              Place Your Bid
            </h3>

            {/* Item Preview */}
            <div className="flex items-start gap-4 mb-6 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <img
                src={gear.find(i => i.type === 'auction')?.images[0] || gear[0]?.images[0]}
                alt="Auction item"
                className="w-16 h-16 rounded-lg object-cover border border-zinc-700"
              />
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1 text-white">
                  Roland TR-8S Rhythm Performer
                </h4>
                <div className="text-xs font-medium text-zinc-400 bg-zinc-900 px-2 py-1 rounded inline-block border border-zinc-800">
                  Current bid: <span className="text-white">$550</span>
                </div>
              </div>
            </div>

            {/* Bid Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3 text-zinc-300">
                Your Bid: <span className="text-white ml-1">${bidPrice}</span>
              </label>
              <input
                type="range"
                min="550"
                max="1200"
                step="10"
                value={bidPrice}
                onChange={(e) => setBidPrice(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-zinc-800 outline-none"
                style={{
                  background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((bidPrice - 550) / 650) * 100}%, #27272a ${((bidPrice - 550) / 650) * 100}%, #27272a 100%)`
                }}
              />
              <div className="text-xs text-zinc-500 mt-2">
                Next minimum bid: $560
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-2 text-zinc-300">
                Payment Method
              </label>
              <select className="w-full px-4 py-3 text-sm rounded-xl border transition-all cursor-pointer focus:outline-none bg-zinc-900 border-zinc-800 text-white focus:border-zinc-600 focus:bg-zinc-800">
                <option>PayPal</option>
                <option>Credit/Debit Card</option>
                <option>Crypto</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowBidModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all active:scale-95 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowBidModal(false);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all active:scale-95 bg-white border-white text-black hover:bg-zinc-200 shadow-sm"
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