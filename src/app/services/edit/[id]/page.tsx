"use client";

import { useState } from "react";
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Rate,
  Upload,
  Tag,
  Divider,
  Avatar,
  List,
  Collapse,
  Badge,
  Progress,
  message,
  Spin,
} from "antd";
import {
  StarFilled,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  UserOutlined,
  FileTextOutlined,
  BookOutlined,
  GlobalOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Panel } = Collapse;

type Writer = {
  id: number;
  name: string;
  image?: string;
  rating: number;
  reviews: number;
  location: string;
  bio: string;
  skills: string[];
  specialties: string[];
  languages: string[];
  education: string;
  experience: number;
  rate: string;
  deliveryTime: string;
  samples: Array<{
    title: string;
    type: string;
    description: string;
    date: string;
  }>;
  reviewsList: Array<{
    user: string;
    avatar: string;
    rating: number;
    content: string;
    date: string;
  }>;
};

export default function HireWriter({ writer }: { writer?: Writer }) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("about");
  const [fileList, setFileList] = useState<any[]>([]);

  // Show loading spinner if writer data is not available
  if (!writer) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  const onFinish = (values: any) => {
    console.log("Writer hire request:", values);
    message.success(
      "Your request has been sent! The writer will respond within 24 hours."
    );
    router.push("/dashboard");
  };

  const onFileChange = ({ fileList }: any) => {
    setFileList(fileList);
  };

  const writingTypes = [
    "Blog Post",
    "Article",
    "Website Copy",
    "Product Description",
    "White Paper",
    "Technical Writing",
    "Creative Writing",
    "Academic Writing",
    "Script Writing",
    "Business Writing",
  ];

  const toneOptions = [
    "Professional",
    "Conversational",
    "Formal",
    "Friendly",
    "Authoritative",
    "Humorous",
    "Inspirational",
    "Technical",
    "Persuasive",
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Writer Profile Sidebar */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-0 rounded-xl sticky top-6">
            <div className="flex flex-col items-center text-center">
              <Avatar
                src={writer.image || "/images/default-avatar.jpg"}
                alt={writer.name || "Writer"}
                size={120}
                className="border-4 border-white shadow-lg"
                icon={!writer.image && <UserOutlined />}
              />
              <h2 className="text-2xl font-bold mt-4">{writer.name || "Unknown Writer"}</h2>
              <div className="flex items-center mt-2">
                <Rate
                  disabled
                  defaultValue={writer.rating || 0}
                  allowHalf
                  character={<StarFilled className="text-yellow-400" />}
                  className="text-lg"
                />
                <span className="ml-2 text-gray-600">
                  ({writer.reviews || 0})
                </span>
              </div>
              <div className="flex items-center mt-2 text-gray-600">
                <EnvironmentOutlined className="mr-1" />
                <span>{writer.location || "Location not specified"}</span>
              </div>

              <Divider className="my-4" />

              <div className="w-full space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-500 text-sm">
                    STARTING AT
                  </h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {writer.rate || "Contact for pricing"}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-500 text-sm">
                    DELIVERY TIME
                  </h4>
                  <p className="text-lg font-medium">{writer.deliveryTime || "Contact for details"}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-500 text-sm">
                    LANGUAGES
                  </h4>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {(writer.languages || []).map((lang, i) => (
                      <Tag key={i} color="blue" className="rounded-full px-3">
                        {lang}
                      </Tag>
                    ))}
                    {(!writer.languages || writer.languages.length === 0) && (
                      <span className="text-gray-500 text-sm">No languages specified</span>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="primary"
                    block
                    size="large"
                    className="h-12 font-bold bg-gradient-to-r from-purple-600 to-blue-500 border-0"
                    onClick={() =>
                      document
                        .getElementById("hire-form")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Hire {writer.name?.split(" ")[0] || "Writer"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-0">
            {/* Tabs */}
            <div className="border-b border-gray-100">
              <div className="flex space-x-8 px-6">
                <button
                  className={`py-4 font-medium text-lg relative ${
                    activeTab === "about"
                      ? "text-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("about")}
                >
                  About
                  {activeTab === "about" && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-purple-600 rounded-t"></span>
                  )}
                </button>
                <button
                  className={`py-4 font-medium text-lg relative ${
                    activeTab === "portfolio"
                      ? "text-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("portfolio")}
                >
                  Portfolio
                  {activeTab === "portfolio" && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-purple-600 rounded-t"></span>
                  )}
                </button>
                <button
                  className={`py-4 font-medium text-lg relative ${
                    activeTab === "reviews"
                      ? "text-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("reviews")}
                >
                  Reviews
                  {activeTab === "reviews" && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-purple-600 rounded-t"></span>
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "about" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold mb-4">Bio</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {writer.bio || "No bio available."}
                    </p>
                  </div>

                  <Divider className="my-6" />

                  <div>
                    <h3 className="text-xl font-bold mb-4">Expertise</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-600 mb-2">
                          Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(writer.skills || []).map((skill, i) => (
                            <Tag
                              key={i}
                              color="geekblue"
                              className="py-1 px-3 rounded-full"
                            >
                              {skill}
                            </Tag>
                          ))}
                          {(!writer.skills || writer.skills.length === 0) && (
                            <span className="text-gray-500 text-sm">No skills specified</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-600 mb-2">
                          Specialties
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(writer.specialties || []).map((item, i) => (
                            <Tag
                              key={i}
                              color="purple"
                              className="py-1 px-3 rounded-full"
                            >
                              {item}
                            </Tag>
                          ))}
                          {(!writer.specialties || writer.specialties.length === 0) && (
                            <span className="text-gray-500 text-sm">No specialties specified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Divider className="my-6" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-bold mb-4">Education</h3>
                      <div className="flex items-start">
                        <div className="bg-purple-100 p-3 rounded-lg mr-4">
                          <BookOutlined className="text-purple-600 text-xl" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{writer.education || "Education not specified"}</h4>
                          <p className="text-gray-500">Degree in Journalism</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-4">Experience</h3>
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-3 rounded-lg mr-4">
                          <SafetyCertificateOutlined className="text-blue-600 text-xl" />
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {writer.experience || 0}+ years
                          </h4>
                          <p className="text-gray-500">
                            Professional writing experience
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "portfolio" && (
                <div>
                  <h3 className="text-xl font-bold mb-6">Writing Samples</h3>
                  {writer.samples && writer.samples.length > 0 ? (
                    <List
                      itemLayout="vertical"
                      dataSource={writer.samples}
                      renderItem={(sample) => (
                        <List.Item className="!px-0 !py-6 border-b border-gray-100 last:border-0">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="bg-gray-50 w-full md:w-48 h-32 rounded-lg flex items-center justify-center">
                              <FileTextOutlined className="text-4xl text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="text-lg font-semibold">
                                  {sample.title}
                                </h4>
                                <Tag color="cyan">{sample.type}</Tag>
                              </div>
                              <p className="text-gray-600 my-2">
                                {sample.description}
                              </p>
                              <div className="text-sm text-gray-400">
                                <CalendarOutlined className="mr-1" />
                                {dayjs(sample.date).format("MMMM YYYY")}
                              </div>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No portfolio samples available.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div>
                  <h3 className="text-xl font-bold mb-6">Client Reviews</h3>
                  {writer.reviewsList && writer.reviewsList.length > 0 ? (
                    <List
                      dataSource={writer.reviewsList}
                      renderItem={(review) => (
                        <List.Item className="!px-0 !py-6 border-b border-gray-100 last:border-0">
                          <div className="flex items-start w-full">
                            <Avatar src={review.avatar} size={48} icon={<UserOutlined />} />
                            <div className="ml-4 flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="font-semibold">{review.user}</h4>
                                <Rate
                                  disabled
                                  defaultValue={review.rating}
                                  allowHalf
                                  character={
                                    <StarFilled className="text-yellow-400" />
                                  }
                                  className="text-sm"
                                />
                              </div>
                              <p className="text-gray-600 my-2">
                                {review.content}
                              </p>
                              <div className="text-sm text-gray-400">
                                {dayjs(review.date).format("MMMM D, YYYY")}
                              </div>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No reviews available.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Hire Form */}
          <div id="hire-form" className="mt-8">
            <Card className="shadow-lg border-0 rounded-xl">
              <div className="flex items-center mb-6">
                <div className="bg-purple-100 p-2 rounded-lg mr-4">
                  <FileTextOutlined className="text-purple-600 text-2xl" />
                </div>
                <h2 className="text-2xl font-bold">Request Custom Writing</h2>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item
                    label="Project Title"
                    name="title"
                    rules={[
                      { required: true, message: "Please enter a title" },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="e.g. Blog post about sustainable fashion"
                      prefix={<FileTextOutlined className="text-gray-400" />}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Writing Type"
                    name="type"
                    rules={[
                      { required: true, message: "Please select a type" },
                    ]}
                  >
                    <Select
                      size="large"
                      placeholder="Select writing type"
                      options={writingTypes.map((type) => ({
                        label: type,
                        value: type,
                      }))}
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  label="Detailed Instructions"
                  name="instructions"
                  rules={[
                    { required: true, message: "Please provide instructions" },
                  ]}
                >
                  <TextArea
                    rows={6}
                    placeholder="Provide detailed instructions about your project, including any specific requirements, target audience, key points to cover, etc."
                    className="resize-none"
                  />
                </Form.Item>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Form.Item
                    label="Word Count"
                    name="wordCount"
                    rules={[
                      { required: true, message: "Please select word count" },
                    ]}
                  >
                    <Select
                      size="large"
                      placeholder="Select word count"
                      options={[
                        { label: "500 words", value: "500" },
                        { label: "1000 words", value: "1000" },
                        { label: "1500 words", value: "1500" },
                        { label: "2000 words", value: "2000" },
                        { label: "Custom", value: "custom" },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Tone"
                    name="tone"
                    rules={[{ required: true, message: "Please select tone" }]}
                  >
                    <Select
                      size="large"
                      placeholder="Select writing tone"
                      options={toneOptions.map((tone) => ({
                        label: tone,
                        value: tone,
                      }))}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Delivery Date"
                    name="deliveryDate"
                    rules={[
                      { required: true, message: "Please select delivery date" },
                    ]}
                  >
                    <DatePicker
                      size="large"
                      className="w-full"
                      disabledDate={(current) =>
                        current && current < dayjs().startOf("day")
                      }
                    />
                  </Form.Item>
                </div>

                <Form.Item label="Reference Files" name="files">
                  <Upload.Dragger
                    fileList={fileList}
                    onChange={onFileChange}
                    beforeUpload={() => false}
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                    className="border-2 border-dashed border-gray-200 hover:border-purple-300 rounded-xl"
                  >
                    <div className="p-8 text-center">
                      <UploadOutlined className="text-3xl text-purple-500 mb-2" />
                      <p className="font-medium">
                        Click or drag files to upload
                      </p>
                      <p className="text-gray-500 text-sm">
                        Upload any reference documents, images, or guidelines
                      </p>
                    </div>
                  </Upload.Dragger>
                </Form.Item>

                <Divider />

                <div className="bg-purple-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4">Project Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-gray-500 text-sm">Writer</div>
                      <div className="font-medium">{writer.name || "Unknown Writer"}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-gray-500 text-sm">Starting Price</div>
                      <div className="font-medium">{writer.rate || "Contact for pricing"}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-gray-500 text-sm">Delivery Time</div>
                      <div className="font-medium">{writer.deliveryTime || "Contact for details"}</div>
                    </div>
                  </div>
                </div>

                <Form.Item className="mt-8">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    className="h-14 font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 border-0 shadow-lg"
                  >
                    Submit Writing Request
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}