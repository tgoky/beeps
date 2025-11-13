// API Route: /api/producers/[producerId]/request-service
// Allows clients to request services from producers

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { producerId: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const { producerId } = params;
      const user = req.user!;
      const permissions = req.permissions!;

      // 🆕 Check using enhanced permissions
      if (!permissions.canRequestProducerService) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: 'Only artists and clients can request producer services',
            code: 'INSUFFICIENT_PERMISSIONS'
          }
        }, { status: 403 });
      }

      const body = await request.json();
      const { projectTitle, projectDescription, budget, deadline } = body;

      // Validate required fields
      if (!projectTitle || !projectDescription) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: 'Project title and description are required',
            code: 'VALIDATION_ERROR'
          }
        }, { status: 400 });
      }

      // Find the producer
      const producer = await prisma.user.findUnique({
        where: { id: producerId },
        include: {
          producerProfile: true
        }
      });

      if (!producer || !producer.producerProfile) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: 'Producer not found',
            code: 'PRODUCER_NOT_FOUND'
          }
        }, { status: 404 });
      }

      // Create the service request
      const serviceRequest = await prisma.serviceRequest.create({
        data: {
          clientId: user.id,
          producerId: producer.id,
          projectTitle,
          projectDescription,
          budget,
          deadline: deadline ? new Date(deadline) : null,
          status: 'PENDING'
        },
        include: {
          client: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              primaryRole: true
            }
          },
          producer: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true
            }
          }
        }
      });

      // Create notification for producer
      await prisma.notification.create({
        data: {
          userId: producer.id,
          type: 'JOB_REQUEST',
          title: 'New Service Request',
          message: `${user.fullName || user.username} sent you a service request for "${projectTitle}"`,
          referenceId: serviceRequest.id,
          referenceType: 'SERVICE_REQUEST'
        }
      });

      // Create activity for client
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: 'JOB_REQUEST_SENT',
          title: 'Service Request Sent',
          description: `Sent service request to ${producer.fullName || producer.username}`,
          referenceId: serviceRequest.id,
          referenceType: 'SERVICE_REQUEST'
        }
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: serviceRequest
      }, { status: 201 });

    } catch (error: any) {
      console.error('Service request error:', error);
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      }, { status: 500 });
    }
  });
}

// Get all service requests for a producer
export async function GET(
  request: NextRequest,
  { params }: { params: { producerId: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const { producerId } = params;
      const user = req.user!;

      // Only the producer themselves can view their service requests
      if (user.id !== producerId) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: 'You can only view your own service requests',
            code: 'UNAUTHORIZED'
          }
        }, { status: 403 });
      }

      const serviceRequests = await prisma.serviceRequest.findMany({
        where: {
          producerId: user.id
        },
        include: {
          client: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              primaryRole: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: serviceRequests
      });

    } catch (error: any) {
      console.error('Fetch service requests error:', error);
      
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      }, { status: 500 });
    }
  });
}