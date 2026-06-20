"use client";

import { useState } from "react";
import { 
  Table, 
  Tag, 
  Button, 
  Card, 
  Badge, 
  Tabs, 
  Avatar, 
  List, 
  Divider, 
  Popover, 
  Modal, 
  message,
  Timeline,
  Progress,
  Statistic,
  Space,
  Input,
  Select,
  DatePicker,
    Rate
} from "antd";
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  StarFilled,
  EnvironmentOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  FileTextOutlined,
  MessageOutlined,
  PhoneOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { studioData } from "@app/studios/studiosjson";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

type Booking = {
  key: string;
  id: string;
  studioId: number; // Reference to studioData.id
  date: string;
  time: string;
  duration: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  price: string;
  paymentStatus: 'paid' | 'pending' | 'refunded';
  equipment: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

const bookingsData: Booking[] = [
  {
    key: '1',
    id: 'BK-2023-001',
    studioId: 1, // Maps to Harmony Studios
    date: '2023-06-15',
    time: '14:00 - 18:00',
    duration: '4 hours',
    status: 'confirmed',
    price: '$200',
    paymentStatus: 'paid',
    equipment: ['Neve Console', 'Pro Tools HD', 'Grand Piano'],
    notes: 'Need 2 extra microphones',
    createdAt: '2023-06-10T14:30:00Z',
    updatedAt: '2023-06-10T14:30:00Z'
  },
  {
    key: '2',
    id: 'BK-2023-002',
    studioId: 3, // Maps to Vocal Booth Pro
    date: '2023-06-20',
    time: '10:00 - 14:00',
    duration: '4 hours',
    status: 'pending',
    price: '$300',
    paymentStatus: 'pending',
    equipment: ['Isolation Booth', 'U87 Mic'],
    createdAt: '2023-06-15T09:15:00Z',
    updatedAt: '2023-06-15T09:15:00Z'
  },
  {
    key: '3',
    id: 'BK-2023-003',
    studioId: 2, // Maps to Beat Factory
    date: '2023-06-25',
    time: '16:00 - 20:00',
    duration: '4 hours',
    status: 'cancelled',
    price: '$250',
    paymentStatus: 'refunded',
    equipment: ['SSL Console', 'Drum Room'],
    notes: 'Cancelled due to illness',
    createdAt: '2023-06-18T11:20:00Z',
    updatedAt: '2023-06-22T16:45:00Z'
  },
  {
    key: '4',
    id: 'BK-2023-004',
    studioId: 1, // Maps to Harmony Studios
    date: '2023-07-02',
    time: '09:00 - 13:00',
    duration: '4 hours',
    status: 'completed',
    price: '$180',
    paymentStatus: 'paid',
    equipment: ['SSL Console', 'Vocal Booth'],
    notes: 'Great session!',
    createdAt: '2023-06-25T08:45:00Z',
    updatedAt: '2023-07-02T13:30:00Z'
  },
];

const statusColors = {
  confirmed: 'green',
  pending: 'orange',
  cancelled: 'red',
  completed: 'blue'
};

const paymentStatusColors = {
  paid: 'green',
  pending: 'orange',
  refunded: 'purple'
};

export default function MyBookings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');

const showDetailModal = (booking: Booking) => {
  setSelectedBooking(booking);
  setIsDetailModalOpen(true);
};

  const handleCancel = () => {
    Modal.confirm({
      title: 'Are you sure you want to cancel this booking?',
      content: 'Cancellation fees may apply depending on studio policy.',
      okText: 'Yes, cancel',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        message.success('Booking cancellation requested');
      },
    });
  };

 const filteredBookings = bookingsData.filter(booking => {
  const studio = studioData.find(s => s.id === booking.studioId);
  const matchesSearch = 
    (studio && studio.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    booking.id.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesStatus = 
    statusFilter === 'all' || booking.status === statusFilter;
  const matchesDate = 
    !dateRange || (
      dayjs(booking.date).isAfter(dayjs(dateRange[0]).subtract(1, 'day')) && 
      dayjs(booking.date).isBefore(dayjs(dateRange[1]).add(1, 'day'))
    );
  return matchesSearch && matchesStatus && matchesDate;
});

  const upcomingBookings = filteredBookings.filter(
    b => b.status === 'confirmed' || b.status === 'pending'
  ).length;

  const completedBookings = filteredBookings.filter(
    b => b.status === 'completed'
  ).length;

  const cancelledBookings = filteredBookings.filter(
    b => b.status === 'cancelled'
  ).length;

  const pendingBookings = filteredBookings.filter(
  b => b.status === 'pending'
).length;

  const columns = [
  {
    title: 'Booking ID',
    dataIndex: 'id',
    key: 'id',
    render: (id: string) => <span className="font-mono">{id}</span>
  },
  {
    title: 'Studio',
    key: 'studio',
    render: (_: any, record: Booking) => {
      const studio = studioData.find(s => s.id === record.studioId);
      if (!studio) return <span>Studio not found</span>;
      return (
        <div className="flex items-center gap-3">
          <Avatar 
            src={studio.image} 
            shape="square" 
            size="large"
          />
          <div>
            <div className="font-medium">{studio.name}</div>
            <div className="flex items-center text-xs text-gray-500">
              <EnvironmentOutlined className="mr-1" />
              {studio.location}
            </div>
          </div>
        </div>
      );
    }
  },
  {
    title: 'Date & Time',
    key: 'datetime',
    render: (record: Booking) => (
      <div>
        <div>{dayjs(record.date).format('MMM D, YYYY')}</div>
        <div className="text-sm text-gray-500">{record.time}</div>
      </div>
    )
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string, record: Booking) => (
      <div className="flex flex-col gap-1">
        <Tag 
          color={statusColors[status as keyof typeof statusColors]} 
          icon={
            status === 'confirmed' ? <CheckCircleOutlined /> :
            status === 'pending' ? <ClockCircleOutlined /> :
            status === 'cancelled' ? <CloseCircleOutlined /> : null
          }
        >
          {status.toUpperCase()}
        </Tag>
        <Tag color={paymentStatusColors[record.paymentStatus as keyof typeof paymentStatusColors]}>
          {record.paymentStatus.toUpperCase()}
        </Tag>
      </div>
    )
  },
  {
    title: 'Price',
    dataIndex: 'price',
    key: 'price',
    render: (price: string) => (
      <div className="font-medium">{price}</div>
    )
  },
  {
    title: 'Action',
    key: 'action',
    render: (_: any, record: Booking) => (
      <Space>
        <Button 
          size="small" 
          onClick={() => showDetailModal(record)}
        >
          Details
        </Button>
        {record.status === 'pending' && (
          <Button 
            size="small" 
            danger
            onClick={handleCancel}
          >
            Cancel
          </Button>
        )}
      </Space>
    )
  },
];

  return (
   <div className="max-w-7xl mx-auto p-4">
  {/* Header */}
  <div className="mb-6">
    <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
    <p className="text-gray-600">
      Manage your upcoming, completed, and cancelled studio sessions
    </p>
  </div>

  {/* Stats Overview */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <Card className="text-center h-full">
      <Statistic 
        title="Upcoming Sessions" 
        value={upcomingBookings} 
        prefix={<CalendarOutlined />}
        valueStyle={{ color: '#3f8600' }}
      />
      <Progress 
        percent={Math.round((upcomingBookings / bookingsData.length) * 100)} 
        status="active" 
        strokeColor="#52c41a"
        showInfo={false}
      />
    </Card>

    <Card className="text-center h-full">
      <Statistic 
        title="Pending Sessions" 
        value={pendingBookings} 
        prefix={<ClockCircleOutlined />}
        valueStyle={{ color: '#fa8c16' }}
      />
      <Progress 
        percent={Math.round((pendingBookings / bookingsData.length) * 100)} 
        status="normal" 
        strokeColor="#fa8c16"
        showInfo={false}
      />
    </Card>

    <Card className="text-center h-full">
      <Statistic 
        title="Completed Sessions" 
        value={completedBookings} 
        prefix={<CheckCircleOutlined />}
        valueStyle={{ color: '#1890ff' }}
      />
      <Progress 
        percent={Math.round((completedBookings / bookingsData.length) * 100)} 
        status="normal" 
        strokeColor="#1890ff"
        showInfo={false}
      />
    </Card>

    <Card className="text-center h-full">
      <Statistic 
        title="Cancelled Sessions" 
        value={cancelledBookings} 
        prefix={<CloseCircleOutlined />}
        valueStyle={{ color: '#cf1322' }}
      />
      <Progress 
        percent={Math.round((cancelledBookings / bookingsData.length) * 100)} 
        status="exception" 
        strokeColor="#ff4d4f"
        showInfo={false}
      />
    </Card>
  </div>


      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search bookings or studios..."
            prefix={<SearchOutlined />}
            className="w-full md:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <Select
            placeholder="Filter by status"
            className="w-full md:w-[200px]"
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="all">All Statuses</Option>
            <Option value="confirmed">Confirmed</Option>
            <Option value="pending">Pending</Option>
            <Option value="completed">Completed</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
          
          <RangePicker
            className="w-full md:w-[300px]"
            onChange={setDateRange}
            disabledDate={(current) => current && current > dayjs().endOf('day')}
          />
          
          <Button icon={<FilterOutlined />}>
            More Filters
          </Button>
        </div>
      </Card>

      {/* Main Content */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'all',
            label: 'All Bookings',
          },
          {
            key: 'upcoming',
            label: 'Upcoming',
          },
          {
            key: 'past',
            label: 'Past',
          },
        ]}
      >
        <TabPane key="all" tab="All Bookings">
          <Table 
            columns={columns} 
            dataSource={filteredBookings}
            rowClassName={(record) => 
              record.status === 'cancelled' ? 'bg-gray-50' : ''
            }
            expandable={{
              expandedRowRender: (record) => (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Equipment</h4>
                      <div className="flex flex-wrap gap-1">
                        {record.equipment.map((item, index) => (
                          <Tag key={index}>{item}</Tag>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Duration</h4>
                      <p>{record.duration}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Created</h4>
                      <p>{dayjs(record.createdAt).format('MMM D, YYYY h:mm A')}</p>
                    </div>
                  </div>
                  {record.notes && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-gray-700">{record.notes}</p>
                    </div>
                  )}
                </div>
              ),
              rowExpandable: (record) => !!record.notes || record.equipment.length > 0,
            }}
          />
        </TabPane>
        <TabPane key="upcoming" tab="Upcoming">
          <Table 
            columns={columns} 
            dataSource={filteredBookings.filter(b => 
              b.status === 'confirmed' || b.status === 'pending'
            )}
          />
        </TabPane>
        <TabPane key="past" tab="Past">
          <Table 
            columns={columns} 
            dataSource={filteredBookings.filter(b => 
              b.status === 'completed' || b.status === 'cancelled'
            )}
          />
        </TabPane>
      </Tabs>

      {/* Booking Detail Modal */}
   <Modal
  title={<span className="font-bold">Booking Details</span>}
  open={isDetailModalOpen}
  onCancel={() => setIsDetailModalOpen(false)}
  footer={[
    <Button key="back" onClick={() => setIsDetailModalOpen(false)}>
      Close
    </Button>,
    selectedBooking?.status === 'pending' && (
      <Button key="cancel" danger onClick={handleCancel}>
        Cancel Booking
      </Button>
    ),
    <Button 
      key="contact" 
      type="primary"
      icon={<MessageOutlined />}
    >
      Contact Studio
    </Button>
  ]}
  width={800}
>
  {selectedBooking && (
    <div className="mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {(() => {
            const studio = studioData.find(s => s.id === selectedBooking.studioId);
            if (!studio) return <span>Studio not found</span>;
            return (
              <div className="flex items-start gap-4 mb-6">
                <Avatar 
                  src={studio.image} 
                  shape="square" 
                  size={80}
                />
                <div>
                  <h2 className="text-xl font-bold mb-1">
                    {studio.name}
                  </h2>
                  <div className="flex items-center mb-2">
                    <Rate 
                      disabled 
                      defaultValue={studio.rating} 
                      allowHalf 
                      character={<StarFilled className="text-sm" />}
                    />
                    <span className="ml-2 text-gray-600">
                      {studio.rating}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <EnvironmentOutlined className="mr-1" />
                    {studio.location}
                  </div>
                </div>
              </div>
            );
          })()}

          <Timeline>
            <Timeline.Item 
              color="green" 
              dot={<CheckCircleOutlined />}
            >
              <div className="font-medium">Booking Created</div>
              <div className="text-gray-500">
                {dayjs(selectedBooking.createdAt).format('MMM D, YYYY h:mm A')}
              </div>
            </Timeline.Item>
            {selectedBooking.status === 'confirmed' && (
              <Timeline.Item 
                color="green" 
                dot={<CheckCircleOutlined />}
              >
                <div className="font-medium">Booking Confirmed</div>
                <div className="text-gray-500">
                  {dayjs(selectedBooking.updatedAt).format('MMM D, YYYY h:mm A')}
                </div>
              </Timeline.Item>
            )}
            {selectedBooking.status === 'cancelled' && (
              <Timeline.Item 
                color="red" 
                dot={<CloseCircleOutlined />}
              >
                <div className="font-medium">Booking Cancelled</div>
                <div className="text-gray-500">
                  {dayjs(selectedBooking.updatedAt).format('MMM D, YYYY h:mm A')}
                </div>
              </Timeline.Item>
            )}
            <Timeline.Item
              color={selectedBooking.status === 'completed' ? 'green' : 'blue'}
              dot={<CalendarOutlined />}
            >
              <div className="font-medium">Scheduled Session</div>
              <div className="text-gray-500">
                {dayjs(selectedBooking.date).format('dddd, MMMM D, YYYY')}
              </div>
              <div className="text-gray-500">
                {selectedBooking.time} ({selectedBooking.duration})
              </div>
            </Timeline.Item>
          </Timeline>
        </div>

        <div className="md:col-span-1">
          <Card className="border border-gray-200">
            <h3 className="font-bold mb-4">Booking Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID:</span>
                <span className="font-mono">{selectedBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Tag color={statusColors[selectedBooking.status]}>
                  {selectedBooking.status.toUpperCase()}
                </Tag>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment:</span>
                <Tag color={paymentStatusColors[selectedBooking.paymentStatus]}>
                  {selectedBooking.paymentStatus.toUpperCase()}
                </Tag>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>{selectedBooking.price}</span>
              </div>
            </div>

            <Divider className="my-4" />

            <h4 className="font-medium mb-2">Equipment Included</h4>
            <div className="flex flex-wrap gap-1 mb-4">
              {selectedBooking.equipment.map((item, index) => (
                <Tag key={index}>{item}</Tag>
              ))}
            </div>

            {selectedBooking.notes && (
              <>
                <h4 className="font-medium mb-2">Special Requests</h4>
                <p className="text-gray-700">{selectedBooking.notes}</p>
              </>
            )}
          </Card>

          <div className="mt-4 space-y-2">
            <Button block icon={<MessageOutlined />}>
              Message Studio
            </Button>
            <Button block icon={<PhoneOutlined />}>
              Call Studio
            </Button>
            <Button block icon={<FileTextOutlined />}>
              View Receipt
            </Button>
          </div>
        </div>
      </div>
    </div>
  )}
</Modal>
    </div>
  );
}
