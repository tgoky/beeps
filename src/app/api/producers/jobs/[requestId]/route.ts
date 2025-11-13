// API Route: /api/producers/jobs/[requestId]
// Allows producers to manage their service requests (accept, reject, etc.)

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';

// Update service request status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const { requestId } = params;
      const user = req.user!;
      const permissions = req.permissions!;

      // 🆕 Only producers can manage service requests
      if (!permissions.canAcceptJobs) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: 'Only producers can manage service requests',
            code: 'INSUFFICIENT_PERMISSIONS'
          }
        }, { status: 403 });
      }

      const body = await request.json();
      const { status, response } = body;

      // Validate status
      const validStatuses = ['ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: 'Invalid status',
            code: 'VALIDATION_ERROR'
          }
        }, { status: 400 });
      }

      // Find the service request
      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id: requestId },
        include: {
          client: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          },
          producer: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          }
        }
      });

      if (!serviceRequest) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: 'Service request not found',
            code: 'REQUEST_NOT_FOUND'
          }
        }, { status: 404 });
      }

      // Verify the producer owns this request
      if (serviceRequest.producerId !== user.id) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: 'You can only manage your own service requests',
            code: 'UNAUTHORIZED'
          }
        }, { status: 403 });
      }

      // Update the service request
      const updatedRequest = await prisma.serviceRequest.update({
        where: { id: requestId },
        data: {
          status,
          producerResponse: response,
          respondedAt: status === 'ACCEPTED' || status === 'REJECTED' ? new Date() : undefined
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

      // Create notification for client
      let notificationMessage = '';
      let notificationType: 'JOB_ACCEPTED' | 'JOB_REJECTED' | 'JOB_UPDATED' = 'JOB_UPDATED';

      switch (status) {
        case 'ACCEPTED':
          notificationMessage = `${user.fullName || user.username} accepted your service request for "${serviceRequest.projectTitle}"`;
          notificationType = 'JOB_ACCEPTED';
          break;
        case 'REJECTED':
          notificationMessage = `${user.fullName || user.username} declined your service request for "${serviceRequest.projectTitle}"`;
          notificationType = 'JOB_REJECTED';
          break;
        case 'IN_PROGRESS':
          notificationMessage = `Work has started on your project "${serviceRequest.projectTitle}"`;
          break;
        case 'COMPLETED':
          notificationMessage = `${user.fullName || user.username} completed your project "${serviceRequest.projectTitle}"`;
          break;
        case 'CANCELLED':
          notificationMessage = `Service request for "${serviceRequest.projectTitle}" was cancelled`;
          break;
      }

      await prisma.notification.create({
        data: {
          userId: serviceRequest.clientId,
          type: notificationType,
          title: `Service Request ${status}`,
          message: notificationMessage,
          referenceId: serviceRequest.id,
          referenceType: 'SERVICE_REQUEST'
        }
      });

      // Create activity for producer
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: 'JOB_STATUS_UPDATED',
          title: `Service Request ${status}`,
          description: `Updated service request for "${serviceRequest.projectTitle}" to ${status}`,
          referenceId: serviceRequest.id,
          referenceType: 'SERVICE_REQUEST'
        }
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: updatedRequest
      });

    } catch (error: any) {
      console.error('Update service request error:', error);
      
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

// Delete service request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  return withAuth(request, async (req) => {
    try {
      const { requestId } = params;
      const user = req.user!;
      const permissions = req.permissions!;

      // Only producers can delete service requests
      if (!permissions.isProducer) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: 'Only producers can delete service requests',
            code: 'INSUFFICIENT_PERMISSIONS'
          }
        }, { status: 403 });
      }

      // Find the service request
      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id: requestId }
      });

      if (!serviceRequest) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: 'Service request not found',
            code: 'REQUEST_NOT_FOUND'
          }
        }, { status: 404 });
      }

      // Verify the producer owns this request
      if (serviceRequest.producerId !== user.id) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            message: 'You can only delete your own service requests',
            code: 'UNAUTHORIZED'
          }
        }, { status: 403 });
      }

      // Delete the service request
      await prisma.serviceRequest.delete({
        where: { id: requestId }
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { message: 'Service request deleted successfully' }
      });

    } catch (error: any) {
      console.error('Delete service request error:', error);
      
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