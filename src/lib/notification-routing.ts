/**
 * Notification Routing Utility
 * Maps notification types and reference types to their corresponding routes
 */

export interface NotificationRoute {
  path: string | null;
  closeDropdown?: boolean;
}

/**
 * Get the route for a notification based on its type and reference
 */
export function getNotificationRoute(
  notificationType: string,
  referenceType?: string | null,
  referenceId?: string | null
): NotificationRoute {
  // No reference means it's a generic notification - no specific route
  if (!referenceType || !referenceId) {
    return { path: null };
  }

  // Route based on reference type (what the notification is about)
  switch (referenceType) {
    // Service Request notifications
    case "SERVICE_REQUEST":
      return {
        path: `/service-requests?highlight=${referenceId}`,
        closeDropdown: true,
      };

    // Booking notifications
    case "BOOKING":
      return {
        path: `/bookings/show/${referenceId}`,
        closeDropdown: true,
      };

    // Studio notifications
    case "STUDIO":
      return {
        path: `/studios/show/${referenceId}`,
        closeDropdown: true,
      };

    // Beat/Music notifications
    case "BEAT":
      return {
        path: `/beats/${referenceId}`,
        closeDropdown: true,
      };

    // Club/Community notifications
    case "CLUB":
    case "CLUB_INVITATION":
      return {
        path: `/clubs/${referenceId}`,
        closeDropdown: true,
      };

    // Transaction notifications
    case "TRANSACTION":
      return {
        path: `/transactions/show/${referenceId}`,
        closeDropdown: true,
      };

    // Review notifications
    case "REVIEW":
      // Reviews are typically on user profiles or studios
      // You might want to route to the review section of the relevant page
      return {
        path: `/reviews/${referenceId}`,
        closeDropdown: true,
      };

    // User/Profile notifications (followers, etc.)
    case "USER":
    case "FOLLOWER":
      return {
        path: `/users/${referenceId}`,
        closeDropdown: true,
      };

    // Equipment notifications
    case "EQUIPMENT":
      return {
        path: `/equipment/${referenceId}`,
        closeDropdown: true,
      };

    // Collaboration notifications
    case "COLLABORATION":
      return {
        path: `/collaborations/${referenceId}`,
        closeDropdown: true,
      };

    default:
      // For unknown types, try to route based on notification type
      return getRouteByNotificationType(notificationType, referenceId);
  }
}

/**
 * Fallback routing based on notification type when reference type is unclear
 */
function getRouteByNotificationType(
  notificationType: string,
  referenceId: string
): NotificationRoute {
  switch (notificationType) {
    case "JOB_REQUEST":
    case "JOB_ACCEPTED":
    case "JOB_REJECTED":
    case "JOB_UPDATED":
      return {
        path: `/service-requests?highlight=${referenceId}`,
        closeDropdown: true,
      };

    case "BOOKING_CONFIRMED":
    case "BOOKING_CANCELLED":
      return {
        path: `/bookings/show/${referenceId}`,
        closeDropdown: true,
      };

    case "CLUB_INVITATION":
      return {
        path: `/clubs/${referenceId}`,
        closeDropdown: true,
      };

    case "NEW_FOLLOWER":
      return {
        path: `/users/${referenceId}`,
        closeDropdown: true,
      };

    case "NEW_REVIEW":
      return {
        path: `/reviews/${referenceId}`,
        closeDropdown: true,
      };

    case "TRANSACTION_COMPLETED":
      return {
        path: `/transactions/show/${referenceId}`,
        closeDropdown: true,
      };

    default:
      return { path: null };
  }
}

/**
 * Get a display-friendly label for notification types
 */
export function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    JOB_REQUEST: "Service Request",
    JOB_ACCEPTED: "Request Accepted",
    JOB_REJECTED: "Request Declined",
    JOB_UPDATED: "Request Updated",
    BOOKING_CONFIRMED: "Booking Confirmed",
    BOOKING_CANCELLED: "Booking Cancelled",
    NEW_REVIEW: "New Review",
    NEW_FOLLOWER: "New Follower",
    CLUB_INVITATION: "Club Invitation",
    TRANSACTION_COMPLETED: "Payment Complete",
  };

  return labels[type] || type.replace(/_/g, " ").toLowerCase();
}
