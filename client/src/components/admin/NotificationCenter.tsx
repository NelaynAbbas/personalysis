import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Notification } from "../../../../shared/schema";
import { PlusIcon, CheckIcon, EyeIcon, TrashIcon, AlertCircleIcon, InfoIcon, Bell, RefreshCwIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

// API Response interfaces
interface ApiResponse<T> {
  status: string;
  data: T;
}

interface NotificationsResponse {
  notifications: Notification[];
}

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const NotificationCard = ({ notification, onMarkAsRead, onDelete }: NotificationCardProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertCircleIcon className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertCircleIcon className="h-5 w-5 text-amber-500" />;
      case "success":
        return <CheckIcon className="h-5 w-5 text-emerald-500" />;
      case "info":
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
      case "system":
        return <Bell className="h-5 w-5 text-violet-500" />;
      default:
        return <InfoIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case "alert":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "warning":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case "success":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
      case "info":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "system":
        return "bg-violet-100 text-violet-800 hover:bg-violet-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  return (
    <Card className={`mb-4 overflow-hidden ${notification.isRead ? 'bg-gray-50' : 'bg-white border-l-4 border-l-primary'}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            {getIcon(notification.type)}
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`font-medium text-lg ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                  {notification.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
              </div>
              <div className="flex-shrink-0 flex space-x-2">
                <Badge variant="outline" className={getBadgeClass(notification.type)}>
                  {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                </Badge>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-muted-foreground">
                {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>
              <div className="flex space-x-2">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-blue-600"
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Mark as read
                  </Button>
                )}
                {notification.link && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => window.location.href = notification.link!}
                  >
                    View details
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-red-600"
                  onClick={() => onDelete(notification.id)}
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const NotificationSkeletonCard = () => {
  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="flex-grow space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between pt-4">
              <Skeleton className="h-4 w-24" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const NewNotificationForm = ({ onClose }: { onClose: () => void }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [userId, setUserId] = useState<string>('');
  const [link, setLink] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createNotificationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/notifications', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Success",
        description: "Notification sent successfully",
        variant: "default",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!message.trim()) {
      toast({
        title: "Validation Error",
        description: "Message is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!userId) {
      toast({
        title: "Validation Error",
        description: "User ID is required",
        variant: "destructive",
      });
      return;
    }
    
    const notificationData = {
      title,
      message,
      type,
      userId: parseInt(userId),
      link: link || null,
      isRead: false,
    };
    
    createNotificationMutation.mutate(notificationData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notification title"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Notification message"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="alert">Alert</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="userId">User ID</Label>
          <Input
            id="userId"
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Recipient User ID"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="link">Link (Optional)</Label>
        <Input
          id="link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="/dashboard"
        />
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createNotificationMutation.isPending}
        >
          {createNotificationMutation.isPending ? 
            <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" /> : 
            <PlusIcon className="mr-2 h-4 w-4" />}
          Send Notification
        </Button>
      </DialogFooter>
    </form>
  );
};

const NotificationCenter = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<ApiResponse<Notification[]>>({
    queryKey: ['/api/notifications'],
    staleTime: 60000, // 1 minute
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/notifications/${id}/read`, 'PATCH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/notifications/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Success",
        description: "Notification deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete notification",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id: number) => {
    deleteNotificationMutation.mutate(id);
  };

  // Filter notifications based on the active tab
  const filteredNotifications =
  data?.data?.filter((notification: Notification) => {
    if (currentTab === "all") return true;
    if (currentTab === "unread") return !notification.isRead;
    return notification.type === currentTab;
  }) || [];


  // Count notifications for badge displays
  const unreadCount = data?.data?.filter((n: Notification) => !n.isRead).length || 0;
  const countByType = data?.data?.reduce((acc: Record<string, number>, n: Notification) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-xl font-bold">Notification Center</CardTitle>
              <CardDescription>
                Manage platform notifications and alerts
              </CardDescription>
            </div>
            <div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Send Alert
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[475px]">
                  <DialogHeader>
                    <DialogTitle>Send New Notification</DialogTitle>
                    <DialogDescription>
                      Create a new notification to send to users
                    </DialogDescription>
                  </DialogHeader>
                  <NewNotificationForm onClose={() => setIsDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-6 flex flex-wrap">
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-2">{data?.data?.length || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                <Badge variant="secondary" className="ml-2">{unreadCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="system">
                System
                <Badge variant="secondary" className="ml-2">{countByType?.system || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="alert">
                Alerts
                <Badge variant="secondary" className="ml-2">{countByType?.alert || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="info">
                Info
                <Badge variant="secondary" className="ml-2">{countByType?.info || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="success">
                Success
                <Badge variant="secondary" className="ml-2">{countByType?.success || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="warning">
                Warnings
                <Badge variant="secondary" className="ml-2">{countByType?.warning || 0}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={currentTab}>
              {isLoading ? (
                <>
                  <NotificationSkeletonCard />
                  <NotificationSkeletonCard />
                  <NotificationSkeletonCard />
                </>
              ) : isError ? (
                <div className="py-12 text-center text-muted-foreground">
                  <AlertCircleIcon className="h-10 w-10 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Error Loading Notifications</h3>
                  <p>{(error as any)?.message || "An error occurred while loading notifications"}</p>
                  <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/notifications'] })}>
                    <RefreshCwIcon className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              ) : (filteredNotifications?.length ?? 0) > 0 ? (
                filteredNotifications.map((notification: Notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Bell className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No notifications found</h3>
                  <p>You don't have any {currentTab !== "all" ? currentTab + " " : ""}notifications at the moment</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;
