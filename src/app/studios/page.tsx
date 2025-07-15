"use client";

import { useState, useEffect } from "react";
import { Card, Tag, Rate, Space, Button, Input, Select, message } from "antd";
import { SearchOutlined, FilterOutlined, StarFilled } from "@ant-design/icons";
import { studioData } from "./studiosjson";
import { useRouter } from "next/navigation";

const { Meta } = Card;
const { Option } = Select;

type Studio = {
  id: number;
  name: string;
  location: string;
  price: string;
  rating: number;
  equipment: string[];
  image: string;
  lat: number;
  lon: number;
};

// Haversine formula to calculate distance between two coordinates (in miles)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function StudioList() {
  const router = useRouter();

  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [filteredStudios, setFilteredStudios] = useState<Studio[]>([]);
  const [radius, setRadius] = useState(100); // Default radius in miles

  // Get user's location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          message.success("Location retrieved successfully!");
        },
        (error) => {
          message.error("Unable to retrieve location. Please allow location access.");
        }
      );
    } else {
      message.error("Geolocation is not supported by your browser.");
    }
  };

  // Filter studios based on radius and user location
  useEffect(() => {
    if (userLocation) {
      const filtered = studioData.filter((studio) => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lon,
          studio.lat,
          studio.lon
        );
        return distance <= radius;
      });
      setFilteredStudios(filtered);
    } else {
      setFilteredStudios(studioData); // Show all studios if no location
    }
  }, [userLocation, radius]);

  return (
    <div className="p-4 max-w-[1200px] mx-auto">
      {/* Header with search and filters */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Recording Studios</h1>
        <p className="text-xs text-gray-600 mb-4">Book professional studios</p>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search studios..."
            prefix={<SearchOutlined />}
            className="w-[200px]"
          />
          <Select
            placeholder="Filter by location"
            className="w-[150px]"
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">All Locations</Option>
            <Option value="la">Los Angeles</Option>
            <Option value="ny">New York</Option>
            <Option value="nashville">Nashville</Option>
          </Select>
          <Select
            value={radius}
            onChange={(value) => setRadius(value)}
            className="w-[120px]"
          >
            <Option value={50}>50 miles</Option>
            <Option value={100}>100 miles</Option>
            <Option value={200}>200 miles</Option>
            <Option value={9999}>All</Option>
          </Select>
          <Button onClick={getUserLocation} icon={<FilterOutlined />}>
            Use My Location
          </Button>
        </div>
      </div>

      {/* Studios Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredStudios.map((studio) => (
          <Card
            key={studio.id}
            hoverable
            className="w-full"
            cover={
              <div className="relative h-40 overflow-hidden">
                <img
                  alt={studio.name}
                  src={studio.image}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                  {studio.price}
                </div>
              </div>
            }
          >
            <Meta
              title={
                <div className="flex justify-between items-center text-sm">
                  {studio.name}
                  <Rate
                    disabled
                    defaultValue={studio.rating}
                    allowHalf
                    character={<StarFilled />}
                    className="[&_.ant-rate-star]:mr-0.5 [&_.ant-rate-star]:text-xs"
                  />
                </div>
              }
              description={
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center gap-1 text-gray-600">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {studio.location}
                    {userLocation && (
                      <span>
                        {" "}
                        ({Math.round(
                          calculateDistance(
                            userLocation.lat,
                            userLocation.lon,
                            studio.lat,
                            studio.lon
                          )
                        )} miles)
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs mb-1">Featured Gear:</h4>
                    <Space size={[2, 4]} wrap>
                      {studio.equipment.map((item, index) => (
                        <Tag
                          key={index}
                          color="geekblue"
                          className="text-xs px-1.5 py-0.5"
                        >
                          {item}
                        </Tag>
                      ))}
                    </Space>
                  </div>

                  <Button
                    block
                    type="text"
                    className="mt-2 !bg-black hover:!bg-green-500 !text-white hover:!text-white h-8 text-xs font-medium !border-none"
                    onClick={() => router.push(`/studios/create/${studio.id}`)} // Navigate to booking form
                  >
                    Book Studio
                  </Button>
                </div>
              }
            />
          </Card>
        ))}
      </div>
    </div>
  );
}