"use client";

import { useState } from "react";
import {
  Card,
  Rate,
  Avatar,
  Button,
  Divider,
  List,
  Form,
  Input,
  Tag,
  Popconfirm,
  message,
  Badge,
  Tooltip,
  Collapse,
  Breadcrumb,
// Keep Collapse import, remove Panel
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  MessageOutlined,
  UserOutlined,
  ClockCircleOutlined,
    ArrowLeftOutlined ,
  StarFilled,
  FireOutlined,
  HeartOutlined,
  StarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter, useSearchParams } from 'next/navigation';

dayjs.extend(relativeTime);

interface LyricSection {
  id: string;
  text: string;
  timestamp?: string;
  comments: Comment[];
  rating?: number;
  status?: "pending" | "approved" | "needs-work";
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  datetime: string;
  reactions?: {
    like: number;
    dislike: number;
  };
}

const initialLyrics: LyricSection[] = [
  {
    id: "1",
    text: "I'm burning up like a supernova\nHeart's a time bomb, watch it explode ya",
    timestamp: "0:45 - 0:52",
    status: "approved",
    rating: 4.5,
    comments: [
      {
        id: "c1",
        author: "Producer Jay",
        avatar: "",
        content: "Love the cosmic imagery here! Maybe simplify 'explode ya' to just 'explode'?",
        datetime: "2023-05-15T14:32:00Z",
        reactions: {
          like: 3,
          dislike: 0,
        },
      },
    ],
  },
  {
    id: "2",
    text: "Walking through the fire, I don't get burned\nLessons of the past, finally learned",
    timestamp: "0:53 - 1:01",
    status: "needs-work",
    rating: 3,
    comments: [
      {
        id: "c2",
        author: "Songwriter Mia",
        avatar: "",
        content: "The fire metaphor feels overused. Can we find a fresher angle?",
        datetime: "2023-05-16T09:15:00Z",
        reactions: {
          like: 1,
          dislike: 1,
        },
      },
    ],
  },
  {
    id: "3",
    text: "Silent screams in a crowded room\nDancing shadows consume the moon",
    timestamp: "1:02 - 1:10",
    status: "pending",
    rating: 0,
    comments: [],
  },
];

export default function LyricsReview() {
  const [lyrics, setLyrics] = useState<LyricSection[]>(initialLyrics);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "needs-work" | "approved" | "pending">("all");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get query parameters
  const from = searchParams.get('from');
  const title = searchParams.get('title');



  const handleEditStart = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleEditSave = (id: string) => {
    setLyrics(
      lyrics.map((lyric) =>
        lyric.id === id ? { ...lyric, text: editText } : lyric
      )
    );
    setEditingId(null);
    message.success("Lyrics updated!");
  };

  const handleDelete = (id: string) => {
    setLyrics(lyrics.filter((lyric) => lyric.id !== id));
    message.success("Lyric section deleted");
  };

  const handleCommentSubmit = (id: string) => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: `c${Date.now()}`,
      author: "Current User",
      avatar: "",
      content: commentText,
      datetime: new Date().toISOString(),
      reactions: {
        like: 0,
        dislike: 0,
      },
    };

    setLyrics(
      lyrics.map((lyric) =>
        lyric.id === id
          ? {
              ...lyric,
              comments: [...lyric.comments, newComment],
            }
          : lyric
      )
    );

    setCommentText("");
    setActiveCommentId(null);
    message.success("Comment added!");
  };

  const handleStatusChange = (id: string, status: LyricSection["status"]) => {
    setLyrics(
      lyrics.map((lyric) =>
        lyric.id === id ? { ...lyric, status } : lyric
      )
    );
    message.success(`Status updated to ${status?.replace("-", " ")}`);
  };

  const handleRate = (id: string, value: number) => {
    setLyrics(
      lyrics.map((lyric) =>
        lyric.id === id ? { ...lyric, rating: value } : lyric
      )
    );
  };

  const filteredLyrics = lyrics.filter((lyric) => {
    if (activeTab === "all") return true;
    return lyric.status === activeTab;
  });

  const statusTag = (status: LyricSection["status"]) => {
    switch (status) {
      case "approved":
        return (
          <Tag icon={<CheckOutlined />} color="success">
            Approved
          </Tag>
        );
      case "needs-work":
        return (
          <Tag icon={<EditOutlined />} color="warning">
            Needs Work
          </Tag>
        );
      case "pending":
        return (
          <Tag icon={<ClockCircleOutlined />} color="default">
            Pending
          </Tag>
        );
      default:
        return null;
    }
  };

  return (
   <div className="max-w-4xl mx-auto p-4">
  {/* Breadcrumbs */}
  <div className="mb-6">
    <Breadcrumb>
      <Breadcrumb.Item onClick={() => router.push('/services')}>
        Music Services
      </Breadcrumb.Item>
      <Breadcrumb.Item onClick={() => router.push('/services')}>
        Lyrics
      </Breadcrumb.Item>
      <Breadcrumb.Item>Lyric Review</Breadcrumb.Item>
    </Breadcrumb>
  </div>

  {/* Main Header */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <Button 
        type="default" 
        onClick={() => router.push(from ? `/${from}` : '/services')}
        icon={<ArrowLeftOutlined />}
        className="order-2 sm:order-1"
      >
        Back to {from ? from.replace('-', ' ') : 'Music Services'}
      </Button>
      
      <div className="order-1 sm:order-2">
        <h1 className="text-3xl font-bold flex items-center">
          <FireOutlined className="text-orange-500 mr-3" />
          Lyrics Review
        </h1>
        {title && (
          <h2 className="text-xl font-semibold mt-2">
            Reviewing: {decodeURIComponent(title as string)}
          </h2>
        )}
      </div>
    </div>

    {/* Tabs */}
    <div className="flex gap-2 flex-wrap">
      <Button
        type={activeTab === "all" ? "primary" : "default"}
        onClick={() => setActiveTab("all")}
        size="small"
      >
        All Sections
      </Button>
      <Button
        type={activeTab === "needs-work" ? "primary" : "default"}
        danger={activeTab === "needs-work"}
        onClick={() => setActiveTab("needs-work")}
        size="small"
      >
        Needs Work
      </Button>
      <Button
        type={activeTab === "approved" ? "primary" : "default"}
        onClick={() => setActiveTab("approved")}
        size="small"
      >
        Approved
      </Button>
      <Button
        type={activeTab === "pending" ? "primary" : "default"}
        onClick={() => setActiveTab("pending")}
        size="small"
      >
        Pending
      </Button>
    </div>
  </div>

      <Card className="shadow-lg border-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold"> - Collaboration with Vega</h2>
            <p className="text-gray-500">Last updated: {dayjs().format("MMMM D, YYYY")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Rate
              character={<StarFilled className="text-yellow-400" />}
              defaultValue={3.5}
              allowHalf
              disabled
            />
            <span className="text-gray-600">(12 reviews)</span>
          </div>
        </div>

        <Divider />

        <List
          itemLayout="vertical"
          dataSource={filteredLyrics}
          renderItem={(item) => (
            <li className="mb-8">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  {statusTag(item.status)}
                  {item.timestamp && (
                    <Tag color="blue" className="font-mono">
                      {item.timestamp}
                    </Tag>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEditStart(item.id, item.text)}
                  />
                  <Popconfirm
                    title="Delete this lyric section?"
                    onConfirm={() => handleDelete(item.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              </div>

              {editingId === item.id ? (
                <div className="mb-4">
                  <Input.TextArea
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="mb-2"
                  />
                  <div className="flex justify-end gap-2">
                    <Button onClick={handleEditCancel}>Cancel</Button>
                    <Button
                      type="primary"
                      onClick={() => handleEditSave(item.id)}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="whitespace-pre-line text-lg font-medium">
                    {item.text}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                  <Tooltip title="Rate these lyrics">
                    <Rate
                      allowHalf
                      value={item.rating}
                      onChange={(value) => handleRate(item.id, value)}
                      character={<HeartOutlined className="text-red-500" />}
                    />
                  </Tooltip>
                </div>
                <div className="flex gap-2">
                  {item.status !== "approved" && (
                    <Button
                      type="dashed"
                      icon={<CheckOutlined />}
                      onClick={() => handleStatusChange(item.id, "approved")}
                    >
                      Approve
                    </Button>
                  )}
                  {item.status !== "needs-work" && (
                    <Button
                      danger
                      icon={<EditOutlined />}
                      onClick={() => handleStatusChange(item.id, "needs-work")}
                    >
                      Needs Work
                    </Button>
                  )}
                </div>
              </div>

              <Collapse
                bordered={false}
                className="bg-white"
                expandIconPosition="end"
              >
                <Collapse.Panel // Use Collapse.Panel instead of Panel
                  header={
                    <span className="font-medium flex items-center">
                      <MessageOutlined className="mr-2" />
                      {item.comments.length} Comments
                    </span>
                  }
                  key="comments"
                >
                  <List
                    dataSource={item.comments}
                    renderItem={(comment) => (
                      <div className="mb-4">
                        <div className="flex items-start">
                          <Avatar src={comment.avatar} icon={<UserOutlined />} />
                          <div className="ml-3 flex-1">
                            <div className="flex justify-between">
                              <span className="font-medium">{comment.author}</span>
                              <Tooltip title={dayjs(comment.datetime).format("YYYY-MM-DD HH:mm:ss")}>
                                <span className="text-gray-500 text-sm">{dayjs(comment.datetime).fromNow()}</span>
                              </Tooltip>
                            </div>
                            <p className="text-gray-700">{comment.content}</p>
                            <div className="flex gap-2 mt-1">
                              <Button type="text" icon={<HeartOutlined />} />
                              <span>{comment.reactions?.like}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                  {activeCommentId === item.id ? (
                    <div className="mt-4">
                      <Input.TextArea
                        rows={2}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add your comment..."
                        className="mb-2"
                      />
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => setActiveCommentId(null)}>
                          Cancel
                        </Button>
                        <Button
                          type="primary"
                          onClick={() => handleCommentSubmit(item.id)}
                        >
                          Post
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="dashed"
                      onClick={() => setActiveCommentId(item.id)}
                      icon={<MessageOutlined />}
                      className="mt-2"
                    >
                      Add Comment
                    </Button>
                  )}
                </Collapse.Panel>
              </Collapse>
            </li>
          )}
        />

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Add New Lyric Section</h3>
          <Form layout="vertical">
            <Form.Item label="Lyrics Text">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item label="Timestamp (optional)">
              <Input placeholder="e.g. 1:15 - 1:30" />
            </Form.Item>
            <Form.Item>
              <Button type="primary">Add Section</Button>
            </Form.Item>
          </Form>
        </div>
      </Card>

      <div className="mt-6 flex justify-between items-center">
        <div className="flex gap-2">
          <Button size="large">Save Draft</Button>
          <Button type="primary" size="large">
            Submit Final Review
          </Button>
        </div>
        <div className="text-gray-500">
          <ClockCircleOutlined className="mr-1" />
          Last autosaved: {dayjs().format("h:mm A")}
        </div>
      </div>
    </div>
  );
}