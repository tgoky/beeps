"use client";

import { useState } from "react";
import {
  Breadcrumb,
  Tag,
  Button,
  Card,
  Tabs,
  Form,
  Input,
  DatePicker,
  message,
  Divider,
  Avatar,
  List,
  Select,
  Upload,
  Radio,
  Checkbox,
  Collapse,
  Badge,
  Rate
} from "antd";
import {
  StarFilled,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  SoundOutlined,
  VideoCameraOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { artistData, collabTypes } from "../../collabsdata"; // Mock data import

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;

export default function RequestCollab({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("details");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [collabType, setCollabType] = useState("music");

  // Find the artist by ID from mock data
  const artist = artistData.find((a) => a.id === parseInt(params.id));

  const onFinish = (values: any) => {
    console.log("Collaboration request:", values);
    message.success(
      "Collaboration request sent! You'll be notified when the artist responds."
    );
    router.push("/collabs");
  };

  const onFileChange = ({ fileList }: any) => {
    setFileList(fileList);
  };

  const skillOptions = [
    "Vocals",
    "Guitar",
    "Piano",
    "Drums",
    "Bass",
    "Production",
    "Mixing",
    "Mastering",
    "Songwriting",
    "Lyrics",
  ];

  const collabDetails = {
    music: {
      icon: <SoundOutlined />,
      fields: [
        { name: "genre", label: "Music Genre", required: true },
        { name: "bpm", label: "BPM", required: false },
      ],
    },
    video: {
      icon: <VideoCameraOutlined />,
      fields: [
        { name: "videoType", label: "Video Type", required: true },
        { name: "concept", label: "Concept Description", required: true },
      ],
    },
    photo: {
      icon: <PictureOutlined />,
      fields: [
        { name: "shootType", label: "Shoot Type", required: true },
        { name: "theme", label: "Theme/Mood", required: true },
      ],
    },
  };

  // If artist is not found, show not found message
  if (!artist) {
    return <div>Artist not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Breadcrumb
        items={[
          { title: "Home", onClick: () => router.push("/") },
          { title: "Collaborations", onClick: () => router.push("/collabs") },
          { title: `Request ${artist.name}` },
        ]}
      />
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-2">Request Collaboration with {artist.name}</h1>
          <div className="flex items-center mb-4">
            <Rate
              disabled
              defaultValue={artist.rating}
              allowHalf
              character={<StarFilled className="text-yellow-400" />}
            />
            <span className="ml-2 text-gray-600">
              {artist.rating} ({artist.reviews.length} reviews)
            </span>
            <span className="mx-3 text-gray-300">|</span>
            <EnvironmentOutlined className="text-gray-500" />
            <span className="ml-1 text-gray-600">{artist.location}</span>
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-6">
            <TabPane tab="Details" key="details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-full h-64 object-cover rounded-lg shadow-md"
                  />
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-3">About</h3>
                    <p className="text-gray-700">{artist.bio}</p>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-3">Skills & Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {artist.skills.map((skill, index) => (
                        <Tag
                          key={index}
                          color="purple"
                          className="py-1 px-3 rounded-full"
                        >
                          {skill}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Previous Collaborations</h3>
                  <List
                    itemLayout="horizontal"
                    dataSource={artist.previousCollabs.slice(0, 3)}
                    renderItem={(collab) => (
                      <div className="mb-4">
                        <div className="flex items-start">
                          <Avatar src={collab.image} alt={collab.title} />
                          <div className="ml-3">
                            <span className="font-medium">{collab.title}</span>
                            <div>
                              <Tag color="blue" className="mb-1">
                                {collab.type}
                              </Tag>
                              <p className="text-gray-700">{collab.description}</p>
                              <div className="flex items-center text-gray-400 text-sm">
                                <TeamOutlined className="mr-1" />
                                <span className="mr-3">with {collab.with}</span>
                                <CalendarOutlined className="mr-1" />
                                <span>{dayjs(collab.date).format("MMMM YYYY")}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                  <Divider />
                  <h3 className="text-xl font-semibold mb-3">Testimonials</h3>
                  <List
                    itemLayout="horizontal"
                    dataSource={artist.reviews}
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
                <h3 className="text-xl font-semibold mb-4">Availability</h3>
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Preferred Collaboration Times</h4>
                  <div className="flex flex-wrap gap-2">
                    {artist.availability.days.map((day, index) => (
                      <Tag key={index} color="green">
                        {day}
                      </Tag>
                    ))}
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-600">Time range: </span>
                    <span>{artist.availability.timeRange}</span>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <ClockCircleOutlined className="text-blue-500 mr-2" />
                    <span className="font-medium">Response Time:</span>
                    <span className="ml-2">Usually responds within {artist.responseTime}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarOutlined className="text-blue-500 mr-2" />
                    <span className="font-medium">Collaboration Style:</span>
                    <span className="ml-2">{artist.collabStyle}</span>
                  </div>
                </div>
              </div>
            </TabPane>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4 shadow-lg border border-gray-100">
            <h3 className="text-xl font-semibold mb-4">Request Collaboration</h3>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                type: "music",
                timeline: "flexible",
              }}
            >
              <Form.Item
                label="Collaboration Type"
                name="type"
                rules={[{ required: true, message: "Please select a type" }]}
              >
                <Radio.Group
                  onChange={(e) => setCollabType(e.target.value)}
                  className="w-full"
                >
                  {collabTypes.map((type) => (
                    <Radio.Button key={type.value} value={type.value} className="w-full mb-2">
                      <div className="flex items-center">
                        {type.icon}
                        <span className="ml-2">{type.label}</span>
                      </div>
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>

              {collabDetails[collabType as keyof typeof collabDetails]?.fields.map(
                (field) => (
                  <Form.Item
                    key={field.name}
                    label={field.label}
                    name={field.name}
                    rules={[
                      {
                        required: field.required,
                        message: `Please provide ${field.label.toLowerCase()}`,
                      },
                    ]}
                  >
                    {field.name.includes("Type") ? (
                      <Select placeholder={`Select ${field.label}`}>
                        {artist.specialties[collabType as keyof typeof artist.specialties].map(
                          (item: string) => (
                            <Select.Option key={item} value={item}>
                              {item}
                            </Select.Option>
                          )
                        )}
                      </Select>
                    ) : (
                      <Input placeholder={`Enter ${field.label.toLowerCase()}`} />
                    )}
                  </Form.Item>
                )
              )}

              <Form.Item
                label="Project Title"
                name="title"
                rules={[{ required: true, message: "Please enter a title" }]}
              >
                <Input placeholder="Name your collaboration project" />
              </Form.Item>

              <Form.Item
                label="Detailed Description"
                name="description"
                rules={[
                  { required: true, message: "Please describe your collaboration idea" },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Describe your vision, goals, and any specific requirements..."
                />
              </Form.Item>

              <Form.Item
                label="Your Skills/Contributions"
                name="skills"
                rules={[
                  { required: true, message: "Please select at least one skill" },
                ]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select skills you bring to the collaboration"
                  onChange={setSelectedSkills}
                  options={skillOptions.map((skill) => ({ label: skill, value: skill }))}
                />
              </Form.Item>

              <Form.Item
                label="Timeline"
                name="timeline"
                rules={[{ required: true, message: "Please select a timeline" }]}
              >
                <Radio.Group className="w-full">
                  <Radio.Button value="flexible" className="w-full mb-2">
                    Flexible
                  </Radio.Button>
                  <Radio.Button value="specific" className="w-full">
                    Specific Dates
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.timeline !== currentValues.timeline
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue("timeline") === "specific" ? (
                    <Form.Item
                      label="Preferred Dates"
                      name="dates"
                      rules={[
                        { required: true, message: "Please select preferred dates" },
                      ]}
                    >
                      <DatePicker.RangePicker className="w-full" />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              <Form.Item label="Reference Files" name="files">
                <Upload
                  fileList={fileList}
                  onChange={onFileChange}
                  beforeUpload={() => false}
                  listType="picture"
                  multiple
                  accept=".mp3,.wav,.jpg,.png,.pdf,.mp4"
                >
                  <Button icon={<UploadOutlined />}>Upload Files</Button>
                </Upload>
                <p className="text-gray-500 text-xs mt-1">
                  Upload any reference tracks, images, or documents
                </p>
              </Form.Item>

              <Form.Item
                name="terms"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject("You must agree to the terms"),
                  },
                ]}
              >
                <Checkbox>
                  I agree to the{" "}
                  <a href="/terms" target="_blank" className="text-blue-500">
                    collaboration terms
                  </a>
                </Checkbox>
              </Form.Item>

              <Divider />

              <Collapse bordered={false} className="bg-gray-50 mb-4">
                <Panel
                  header={
                    <span className="font-medium">Collaboration Terms Summary</span>
                  }
                  key="1"
                >
                  <div className="text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Credit:</span>
                      <span>Equal credit for all contributors</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Revenue Share:</span>
                      <span>To be negotiated</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ownership:</span>
                      <span>Joint ownership of final product</span>
                    </div>
                  </div>
                </Panel>
              </Collapse>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                className="bg-purple-600 hover:bg-purple-700 h-12 font-medium"
              >
                Send Collaboration Request
              </Button>
              <p className="text-center text-gray-500 text-xs mt-3">
                This artist typically responds within {artist.responseTime}
              </p>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}