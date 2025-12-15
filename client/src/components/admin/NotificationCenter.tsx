import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { CheckIcon, TrashIcon, RefreshCwIcon, Bell } from "lucide-react";

// Types
interface AdminNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  metadata: any;
  isGlobal: boolean;
  category: string | null;
  priority: string | null;
  actionableUserId: number | null;
  createdAt: Date | string;
  updatedAt: Date | string | null;
  expiresAt: Date | string | null;
}

interface NotificationsResponse {
  status: string;
  data: AdminNotification[];
  pagination?: {
    limit: number;
    offset: number;
    count: number;
  };
}

interface NotificationCardProps {
  notification: AdminNotification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

// Category badge colors
const getCategoryBadgeColor = (category: string | null): string => {
  switch (category) {
    case 'user':
      return 'bg-blue-100 text-blue-800';
    case 'survey':
      return 'bg-green-100 text-green-800';
    case 'response':
      return 'bg-purple-100 text-purple-800';
    case 'ai':
      return 'bg-orange-100 text-orange-800';
    case 'system':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const NotificationCard = ({ notification, onMarkAsRead, onDelete }: NotificationCardProps) => {
  return (
    <Card
      className={`mb-3 overflow-hidden transition-colors ${
        notification.isRead
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-l-4 border-l-primary shadow-sm'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Category Badge */}
          <div className="flex-shrink-0 mt-1">
            <Badge className={getCategoryBadgeColor(notification.category)}>
              {notification.category?.toUpperCase() || 'SYSTEM'}
            </Badge>
          </div>

          {/* Notification Content */}
          <div className="flex-grow">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h3
                    className={`font-medium ${
                      notification.isRead ? 'text-gray-700' : 'text-gray-900'
                    }`}
                  >
                    {notification.title}
                  </h3>
                </div>
                <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-600' : 'text-gray-700'}`}>
                  {notification.message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 flex gap-2">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead(notification.id)}
                    title="Mark as read"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(notification.id)}
                  title="Delete notification"
                >
                  <TrashIcon className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>

            {/* Timestamp */}
            <div className="mt-3 pt-2 border-t border-gray-100">
              <span className="text-xs text-muted-foreground">
                {notification.createdAt &&
                  formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function NotificationCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // Fetch notifications
  const { data: notificationsData, isLoading, refetch } = useQuery<NotificationsResponse>({
    queryKey: ['admin-notifications', activeTab],
    queryFn: () => {
      const params: Record<string, any> = {
        limit: 100
      };

      // Only add isRead filter for unread tab
      if (activeTab === 'unread') {
        params.isRead = 'false';
      }

      return apiRequest(
        `/api/admin/notifications`,
        {
          skipAuthHeader: false,
          params
        }
      );
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      apiRequest(
        `/api/admin/notifications/${notificationId}/read`,
        { method: 'PATCH', skipAuthHeader: false }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast({
        title: 'Success',
        description: 'Notification marked as read',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark as read',
        variant: 'destructive',
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      apiRequest(
        `/api/admin/notifications/read-all`,
        { method: 'PATCH', skipAuthHeader: false }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark all as read',
        variant: 'destructive',
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: number) =>
      apiRequest(
        `/api/admin/notifications/${notificationId}`,
        { method: 'DELETE', skipAuthHeader: false }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete notification',
        variant: 'destructive',
      });
    },
  });

  // notificationsData is already unwrapped by apiRequest, so it's the array directly
  const notifications = Array.isArray(notificationsData) ? notificationsData : notificationsData?.data || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Notifications</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCwIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {activeTab === 'unread' && notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>

        {/* All Tab */}
        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-24 bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <Card className="p-8 text-center bg-blue-50">
              <Bell className="h-12 w-12 mx-auto text-blue-300 mb-4" />
              <p className="text-gray-600">No notifications yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Notifications will appear here when new events occur
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsReadMutation.mutate}
                  onDelete={deleteNotificationMutation.mutate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Unread Tab */}
        <TabsContent value="unread" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-24 bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <Card className="p-8 text-center bg-green-50">
              <CheckIcon className="h-12 w-12 mx-auto text-green-300 mb-4" />
              <p className="text-gray-600">All caught up!</p>
              <p className="text-sm text-gray-500 mt-2">You have no unread notifications</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsReadMutation.mutate}
                  onDelete={deleteNotificationMutation.mutate}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
