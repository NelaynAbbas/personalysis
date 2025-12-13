import React, { useState, useEffect } from 'react';
import { Bell, BellOff, MessageSquare, CheckCircle, AlertCircle, Clock, User, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export type NotificationType = 
  | 'comment' 
  | 'review_requested' 
  | 'review_submitted'
  | 'element_locked'
  | 'element_unlocked'
  | 'user_joined'
  | 'user_left'
  | 'version_created'
  | 'changes_requested'
  | 'approved';

export interface CollaborationNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
  sender?: {
    id: number;
    username: string;
  };
  elementId?: string;
  sessionId: number;
}

interface NotificationSystemProps {
  notifications: CollaborationNotification[];
  notificationsEnabled: boolean;
  onToggleNotifications: (enabled: boolean) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onClickNotification: (notification: CollaborationNotification) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  notificationsEnabled,
  onToggleNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClickNotification,
}) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Close the popover when clicking a notification
  const handleNotificationClick = (notification: CollaborationNotification) => {
    onClickNotification(notification);
    onMarkAsRead(notification.id);
    setOpen(false);
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'review_requested':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'review_submitted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'element_locked':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'element_unlocked':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'user_joined':
      case 'user_left':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'version_created':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'changes_requested':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  // Format notification time
  const formatNotificationTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(date).toLocaleDateString();
  };
  
  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            aria-label="Notifications"
          >
            {notificationsEnabled ? (
              <Bell className="h-5 w-5" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
                variant="destructive"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <Card className="border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Notifications</CardTitle>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-muted-foreground">
                    {notificationsEnabled ? 'On' : 'Off'}
                  </span>
                  <Switch 
                    checked={notificationsEnabled} 
                    onCheckedChange={onToggleNotifications}
                    aria-label="Toggle notifications"
                  />
                </div>
              </div>
              <CardDescription>
                {notifications.length === 0 
                  ? 'No notifications yet' 
                  : `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
              </CardDescription>
            </CardHeader>
            
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-4 h-32">
                  <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    You don't have any notifications yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-muted/50 cursor-pointer ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {notification.sender ? (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {notification.sender.username.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              {getNotificationIcon(notification.type)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${!notification.read ? 'text-primary' : ''}`}>
                              {notification.title}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          {notification.actionUrl && (
                            <div className="pt-1">
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-auto p-0 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(notification);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View details
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            {notifications.length > 0 && (
              <CardFooter className="flex justify-between p-3 border-t">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onMarkAllAsRead}
                >
                  Mark all as read
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    toast({
                      title: 'Notification settings',
                      description: 'Notification settings would be displayed here.',
                    });
                  }}
                >
                  Settings
                </Button>
              </CardFooter>
            )}
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default NotificationSystem;