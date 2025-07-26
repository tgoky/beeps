"use client";

import { useState } from "react";
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Upload,
  Tag,
  Divider,
  Avatar,
  message,
  Spin,
  Progress,
  Collapse,
  List,
} from "antd";
import {
  UploadOutlined,
  UserOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  LinkOutlined,
  StarFilled,
  ClockCircleOutlined,
  DollarOutlined
} from "@ant-design/icons";

const { TextArea } = Input;
const { Panel } = Collapse;

type AuditionSubmissionProps = {
  jobTitle: string;
  clientName: string;
  budget: string;
  deadline: string;
  requirements: string[];
};

export default function SubmitAudition({
  jobTitle,
  clientName,
  budget,
  deadline,
  requirements,
}: AuditionSubmissionProps) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFinish = (values: any) => {
    setIsSubmitting(true);
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsSubmitting(false);
          message.success("Audition submitted successfully!");
          form.resetFields();
          setFileList([]);
          setUploadProgress(0);
        }, 500);
      }
    }, 300);
  };

  const onFileChange = ({ fileList }: any) => {
    setFileList(fileList);
  };

  const mediaTypes = [
    "Writing Sample",
    "Video Introduction",
    "Audio Recording",
    "Portfolio Link",
    "Document",
    "Presentation",
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg border-0 rounded-xl">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Submit Audition for: {jobTitle || "Writing Position"}
            </h1>
            <div className="flex items-center text-gray-600 mb-4">
              <span className="mr-4">
                <UserOutlined className="mr-1" /> {clientName || "Client"}
              </span>
              <span className="mr-4">
                <DollarOutlined className="mr-1" /> {budget || "Negotiable"}
              </span>
              <span>
                <ClockCircleOutlined className="mr-1" /> {deadline || "Flexible"}
              </span>
            </div>

            {requirements && requirements.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Client Requirements:
                </h3>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  {requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-700 mb-2">
                Tips for a Successful Audition:
              </h3>
              <ul className="list-disc pl-5 text-blue-600 space-y-1 text-sm">
                <li>Showcase your best work that matches the job requirements</li>
                <li>Keep written samples concise and relevant</li>
                <li>Highlight your unique skills and experience</li>
                <li>Follow any specific instructions from the client</li>
              </ul>
            </div>
          </div>

          <div className="md:w-64 flex flex-col items-center p-4 bg-gray-50 rounded-lg">
            <Avatar
              size={80}
              icon={<UserOutlined />}
              className="mb-3 bg-purple-100 text-purple-600"
            />
            <div className="text-center">
              <p className="font-medium">Your Profile Strength</p>
              <Progress
                percent={75}
                strokeColor="#7c3aed"
                className="my-2"
                size="small"
              />
              <Tag color="purple" className="rounded-full">
                <StarFilled className="mr-1" />
                Pro Writer
              </Tag>
            </div>
          </div>
        </div>

        <Divider className="my-6" />

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="space-y-6"
        >
          <Form.Item
            label="Cover Letter"
            name="coverLetter"
            rules={[
              { required: true, message: "Please write a cover letter" },
              {
                min: 100,
                message: "Cover letter should be at least 100 characters",
              },
              {
                max: 1000,
                message: "Cover letter should not exceed 1000 characters",
              },
            ]}
            extra="Explain why you're the best fit for this project (100-1000 characters)"
          >
            <TextArea
              rows={6}
              placeholder="Dear Client, I'm excited to apply for this position because..."
              className="resize-none"
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item
              label="Media Type"
              name="mediaType"
              rules={[
                { required: true, message: "Please select a media type" },
              ]}
            >
              <Select
                placeholder="Select media type"
                options={mediaTypes.map((type) => ({
                  label: type,
                  value: type,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Relevant Skills"
              name="skills"
              rules={[
                { required: true, message: "Please select relevant skills" },
              ]}
              extra="Select skills that match this project"
            >
              <Select
                mode="multiple"
                placeholder="Select skills"
                options={[
                  { label: "Content Writing", value: "Content Writing" },
                  { label: "Copywriting", value: "Copywriting" },
                  { label: "SEO Writing", value: "SEO Writing" },
                  { label: "Technical Writing", value: "Technical Writing" },
                  { label: "Creative Writing", value: "Creative Writing" },
                  { label: "Editing", value: "Editing" },
                  { label: "Proofreading", value: "Proofreading" },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Audition Materials"
            name="materials"
            extra="Upload files or provide links to your work samples"
          >
            <Collapse bordered={false} className="bg-gray-50">
              <Panel
                header="Upload Files (PDF, DOC, MP3, MP4)"
                key="1"
                className="font-medium"
              >
                <Upload.Dragger
                  fileList={fileList}
                  onChange={onFileChange}
                  beforeUpload={() => false}
                  multiple
                  accept=".pdf,.doc,.docx,.mp3,.mp4,.mov,.avi"
                  className="border-2 border-dashed border-gray-200 hover:border-purple-300 rounded-xl"
                >
                  <div className="p-6 text-center">
                    <UploadOutlined className="text-3xl text-purple-500 mb-2" />
                    <p className="font-medium">Click or drag files to upload</p>
                    <p className="text-gray-500 text-sm">
                      Maximum file size: 50MB
                    </p>
                  </div>
                </Upload.Dragger>

                {fileList.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Selected Files:</h4>
                    <List
                      dataSource={fileList}
                      renderItem={(file) => (
                        <List.Item className="!px-0">
                          <div className="flex items-center">
                            {file.type?.includes("video") ? (
                              <VideoCameraOutlined className="text-red-500 mr-2" />
                            ) : file.type?.includes("audio") ? (
                              <AudioOutlined className="text-blue-500 mr-2" />
                            ) : (
                              <FileTextOutlined className="text-green-500 mr-2" />
                            )}
                            <span className="truncate flex-1">{file.name}</span>
                            <span className="text-gray-500 text-sm">
                              {(file.size / (1024 * 1024)).toFixed(2)}MB
                            </span>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                )}
              </Panel>
              <Panel
                header="Add Links to Your Work"
                key="2"
                className="font-medium"
              >
                <Form.List name="links">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field, index) => (
                        <div
                          key={field.key}
                          className="flex items-start mb-2"
                        >
                          <Form.Item
                            {...field}
                            name={[field.name, "url"]}
                            rules={[
                              { required: true, message: "URL is required" },
                              {
                                type: "url",
                                message: "Please enter a valid URL",
                              },
                            ]}
                            className="flex-1 mb-0"
                          >
                            <Input
                              placeholder="https://example.com/your-work"
                              prefix={<LinkOutlined className="text-gray-400" />}
                            />
                          </Form.Item>
                          <Button
                            danger
                            type="text"
                            onClick={() => remove(field.name)}
                            className="ml-2"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        icon={<LinkOutlined />}
                        className="w-full"
                      >
                        Add Link
                      </Button>
                    </>
                  )}
                </Form.List>
              </Panel>
            </Collapse>
          </Form.Item>

          <Form.Item
            label="Your Proposed Rate"
            name="rate"
            rules={[
              { required: true, message: "Please specify your rate" },
            ]}
            extra="Consider the client's budget when proposing your rate"
          >
            <div className="flex items-center">
              <span className="mr-2 text-gray-500">$</span>
              <Input
                type="number"
                placeholder="e.g. 50"
                className="w-32"
                min={0}
                step={5}
              />
              <Select
                defaultValue="per_hour"
                className="ml-2 w-32"
                options={[
                  { label: "per hour", value: "per_hour" },
                  { label: "per project", value: "per_project" },
                  { label: "per word", value: "per_word" },
                ]}
              />
            </div>
          </Form.Item>

          {isSubmitting && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <Progress
                  type="circle"
                  percent={uploadProgress}
                  width={50}
                  strokeColor="#7c3aed"
                />
                <div>
                  <h4 className="font-medium">Uploading your audition...</h4>
                  <p className="text-sm text-gray-600">
                    Please do not close this window
                  </p>
                </div>
              </div>
            </div>
          )}

          <Form.Item className="mt-8">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={isSubmitting}
              className="h-14 font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 border-0 shadow-lg"
            >
              Submit Audition
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}