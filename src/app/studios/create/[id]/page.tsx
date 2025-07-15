"use client";

import { useState } from "react";
import {
  Breadcrumb,
  Tag,
  Rate,
  Button,
  Card,
  Tabs,
  Calendar,
  Form,
  Input,
  DatePicker,
  TimePicker,
  message,
  Divider,
  Avatar,
  List,
  Select,
} from "antd";
import {
  StarFilled,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { studioData } from "@app/studios/studiosjson";// Import the mock data

const { TextArea } = Input;
const { TabPane } = Tabs;


export default function BookStudio({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  // Find the studio by ID from the mock data
  const studio = studioData.find((s) => s.id === parseInt(params.id));

  const [bookingForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState("details");
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState("");

  const onFinish = (values: any) => {
    console.log("Booking details:", values);
    message.success(
      "Booking request submitted! You'll be notified when the studio owner responds."
    );
    router.push("/studios");
  };

  const disabledDate = (current: dayjs.Dayjs) => {
    return current && current < dayjs().startOf("day");
  };

  // If studio is not found, show not found message
  if (!studio) {
    return <div>Studio not found</div>;
  }

  const timeSlots = studio.availableHours?.map((time) => (
    <Button
      key={time}
      type={selectedTime === time ? "primary" : "default"}
      onClick={() => setSelectedTime(time)}
      className="m-1"
    >
      {time}
    </Button>
  ));

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Breadcrumb />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-2">{studio.name}</h1>
          <div className="flex items-center mb-4">
            <Rate
              disabled
              defaultValue={studio.rating}
              allowHalf
              character={<StarFilled className="text-yellow-400" />}
            />
            <span className="ml-2 text-gray-600">
              {studio.rating} ({studio.reviews.length} reviews)
            </span>
            <span className="mx-3 text-gray-300">|</span>
            <EnvironmentOutlined className="text-gray-500" />
            <span className="ml-1 text-gray-600">{studio.location}</span>
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-6">
            <TabPane tab="Details" key="details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={studio.image}
                    alt={studio.name}
                    className="w-full h-64 object-cover rounded-lg shadow-md"
                  />
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-3">Description</h3>
                    <p className="text-gray-700">{studio.description}</p>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-3">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {studio.amenities.map((amenity, index) => (
                        <Tag
                          key={index}
                          color="blue"
                          className="py-1 px-3 rounded-full"
                        >
                          {amenity}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Equipment</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {studio.equipment.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-gray-50 p-3 rounded-lg"
                      >
                        <CheckCircleOutlined className="text-green-500 mr-2" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Divider />
                  <h3 className="text-xl font-semibold mb-3">Reviews</h3>
                  <List
                    itemLayout="horizontal"
                    dataSource={studio.reviews}
                    renderItem={(review) => (
                      <div className="mb-4">
                        <div className="flex items-center">
                          <Avatar src={review.avatar} alt={review.user} />
                          <div className="ml-3">
                            <span className="font-medium">{review.user}</span>
                            <div>
                              <Rate
                                disabled
                                defaultValue={review.rating}
                                allowHalf
                                character={
                                  <StarFilled className="text-yellow-400 text-sm" />
                                }
                                className="mb-1"
                              />
                              <p className="text-gray-700">{review.content}</p>
                              <span className="text-gray-400 text-sm">
                                {dayjs(review.date).format("MMMM D, YYYY")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>
            </TabPane>
            <TabPane tab="Availability" key="availability">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold mb-4">
                  Select Date & Time
                </h3>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/2">
                    <Calendar
                      fullscreen={false}
                      value={selectedDate}
                      onChange={setSelectedDate}
                      disabledDate={disabledDate}
                      className="border rounded-lg p-2"
                    />
                  </div>
                  </div>
                  <div className="w-full md:w-1/2">
                    <h4>Available Times for {selectedDate.format("MMMM D, YYYY")}</h4>
                    <div className="flex flex-wrap mb-6">{timeSlots}</div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <ClockCircleOutlined className="text-blue-500 mr-2" />
                        <span className="font-medium">Session Length:</span>
                        <span className="ml-2">Minimum 2 hours</span>
                      </div>
                      <div className="flex items-center">
                        <DollarOutlined className="text-blue-500 mr-2" />
                        <span className="font-medium">Rate:</span>
                        <span className="ml-2">{studio.price}/hour</span>
                      </div>
                    </div>
  </div>
</div>
</TabPane>
</Tabs>
</div>
<div className="lg:col-span-1">
<Card className="sticky top-4 shadow-lg border border-gray-100">
<h3 className="text-xl font-semibold mb-4">Book This Studio</h3>
<Form
form={bookingForm}
layout="vertical"
onFinish={onFinish}
initialValues={{
date: dayjs(),
hours: 2,
}}
>
<Form.Item
label="Select Date"
name="date"
rules={[{ required: true, message: "Please select a date" }]}
>
<DatePicker className="w-full" disabledDate={disabledDate} />
</Form.Item>
<Form.Item
label="Select Time Slot"
name="time"
rules={[{ required: true, message: "Please select a time slot" }]}
>
<Select placeholder="Choose a time slot" className="w-full">
{studio.availableHours.map((time) => (
<Select.Option key={time} value={time}>
{time}
</Select.Option>
))}
</Select>
</Form.Item>
<Form.Item
label="Session Length (hours)"
name="hours"
rules={[
{ required: true, message: "Please select session length" },
]}
>
<Select className="w-full">
<Select.Option value="2">2 hours</Select.Option>
<Select.Option value="4">4 hours</Select.Option>
<Select.Option value="8">Full day (8 hours)</Select.Option>
</Select>
</Form.Item>
<Form.Item label="Special Requests" name="requests">
<TextArea
rows={4}
placeholder="Any special equipment or setup requirements?"
/>
</Form.Item>
<Divider />
<div className="mb-4">
<div className="flex justify-between mb-2">
<span className="text-gray-600">Hourly Rate</span>
<span>{studio.price}</span>
</div>
<div className="flex justify-between mb-2">
<span className="text-gray-600">Estimated Total</span>
<span className="font-semibold">
${(parseFloat(studio.price.replace("$", "")) * 2).toFixed(2)}
</span>
</div>
</div>
<Button
type="primary"
htmlType="submit"
block
size="large"
className="bg-black hover:bg-green-600 h-12 font-medium"
>
Request Booking
</Button>
<p className="text-center text-gray-500 text-xs mt-3">
You will only be charged when the studio owner confirms your booking
</p>
</Form>
</Card>
</div>
</div>
</div>
);
}