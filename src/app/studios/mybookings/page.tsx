"use client";

import { Table, Tag, Button, Card, Badge } from "antd";
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const bookingsData = [
  {
    key: '1',
    studio: 'Electric Lady Studios',
    date: '2023-06-15',
    time: '14:00 - 18:00',
    status: 'confirmed',
    price: '$200',
  },
  {
    key: '2',
    studio: 'Abbey Road Studios',
    date: '2023-06-20',
    time: '10:00 - 14:00',
    status: 'pending',
    price: '$300',
  },
  {
    key: '3',
    studio: 'Sunset Sound',
    date: '2023-06-25',
    time: '16:00 - 20:00',
    status: 'cancelled',
    price: '$250',
  },
];

export default function MyBookings() {
  const router = useRouter();
  
  const columns = [
    {
      title: 'Studio',
      dataIndex: 'studio',
      key: 'studio',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let icon, color;
        switch (status) {
          case 'confirmed':
            icon = <CheckCircleOutlined />;
            color = 'green';
            break;
          case 'pending':
            icon = <ClockCircleOutlined />;
            color = 'orange';
            break;
          case 'cancelled':
            icon = <CloseCircleOutlined />;
            color = 'red';
            break;
          default:
            icon = null;
            color = '';
        }
        return (
          <Tag icon={icon} color={color}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="link" 
          onClick={() => router.push(`/studios/book/${record.key}`)}
          className="text-black hover:text-green-600"
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4">

      
      <Card title="My Bookings" className="mt-6 shadow-sm">
        <Table 
          columns={columns} 
          dataSource={bookingsData} 
          pagination={false}
          className="w-full"
        />
      </Card>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <Badge count={5} className="mb-2">
            <div className="text-3xl font-bold">Upcoming</div>
          </Badge>
          <p className="text-gray-600">Sessions booked</p>
        </Card>
        
        <Card className="text-center">
          <Badge count={2} className="mb-2" status="processing">
            <div className="text-3xl font-bold">Pending</div>
          </Badge>
          <p className="text-gray-600">Awaiting confirmation</p>
        </Card>
        
        <Card className="text-center">
          <Badge count={12} className="mb-2" status="default">
            <div className="text-3xl font-bold">Past</div>
          </Badge>
          <p className="text-gray-600">Completed sessions</p>
        </Card>
      </div>
    </div>
  );
}