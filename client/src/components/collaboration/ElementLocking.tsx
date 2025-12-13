import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Lock, Unlock, Clock, User, AlertTriangle, RefreshCw } from 'lucide-react';

// Element types that can be locked
export type LockableElementType = 
  | 'question' 
  | 'section' 
  | 'page' 
  | 'option' 
  | 'logic' 
  | 'setting';

// Status of a locked element
export interface LockedElement {
  id: string;
  type: LockableElementType;
  name: string;
  lockedBy: {
    id: number;
    username: string;
  };
  lockedAt: Date;
  expiresAt: Date;
  active: boolean; // Whether the lock is currently active
}

interface ElementLockingProps {
  sessionId: number;
  userId: number;
  username: string;
  lockedElements: LockedElement[];
  onLockElement: (elementId: string, elementType: LockableElementType, elementName: string) => void;
  onUnlockElement: (elementId: string) => void;
  onRefreshLock: (elementId: string) => void;
  onViewLockedElement: (elementId: string, elementType: LockableElementType) => void;
  readOnly?: boolean;
}

const ElementLocking: React.FC<ElementLockingProps> = ({
  sessionId,
  userId,
  username,
  lockedElements,
  onLockElement,
  onUnlockElement,
  onRefreshLock,
  onViewLockedElement,
  readOnly = false,
}) => {
  const { toast } = useToast();
  
  // Filter locked elements by current user and others
  const userLocks = lockedElements.filter(lock => lock.lockedBy.id === userId && lock.active);
  const otherLocks = lockedElements.filter(lock => lock.lockedBy.id !== userId && lock.active);
  const expiredLocks = lockedElements.filter(lock => !lock.active);
  
  // Check if a lock is about to expire (within 5 minutes)
  const isLockExpiringSoon = (expiresAt: Date) => {
    const now = new Date();
    const expirationTime = new Date(expiresAt);
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return expirationTime.getTime() - now.getTime() < fiveMinutes;
  };
  
  // Format remaining time for a lock
  const formatRemainingTime = (expiresAt: Date) => {
    const now = new Date();
    const expirationTime = new Date(expiresAt);
    const remainingMs = expirationTime.getTime() - now.getTime();
    
    if (remainingMs <= 0) return 'Expired';
    
    const minutes = Math.floor(remainingMs / (60 * 1000));
    
    if (minutes < 1) return 'Less than a minute';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  };
  
  // Get the display name for an element type
  const getElementTypeName = (type: LockableElementType) => {
    const typeNames: Record<LockableElementType, string> = {
      question: 'Question',
      section: 'Section',
      page: 'Page',
      option: 'Option',
      logic: 'Logic Rule',
      setting: 'Setting',
    };
    
    return typeNames[type] || type;
  };
  
  // Render the list of locked elements
  const renderLockedElementList = (locks: LockedElement[], isUser: boolean) => {
    if (locks.length === 0) {
      return (
        <div className="text-center p-6 text-muted-foreground">
          {isUser 
            ? 'You have no active locks.' 
            : 'No elements are currently locked by other users.'}
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {locks.map(lock => (
          <Card key={lock.id} className="border border-muted">
            <CardHeader className="p-3 pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-yellow-500" />
                  <CardTitle className="text-base">{lock.name}</CardTitle>
                  <Badge variant="outline">
                    {getElementTypeName(lock.type)}
                  </Badge>
                </div>
                
                {isLockExpiringSoon(lock.expiresAt) && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Expiring soon
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-3 pt-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-xs">
                      {lock.lockedBy.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{isUser ? 'You' : lock.lockedBy.username}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatRemainingTime(lock.expiresAt)} remaining
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="p-3 pt-0 flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewLockedElement(lock.id, lock.type)}
              >
                View
              </Button>
              
              {isUser && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onRefreshLock(lock.id)}
                    className="text-blue-500"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Extend
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onUnlockElement(lock.id)}
                    className="text-green-500"
                  >
                    <Unlock className="h-3 w-3 mr-1" />
                    Release
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Element Locking</h3>
        <Badge variant="outline" className="text-blue-500 border-blue-200">
          {userLocks.length} Active Lock{userLocks.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      <Tabs defaultValue="yours">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="yours" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Yours ({userLocks.length})
          </TabsTrigger>
          <TabsTrigger value="others" className="flex items-center gap-1">
            <Lock className="h-4 w-4" />
            Others ({otherLocks.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Expired ({expiredLocks.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="yours" className="mt-4">
          <ScrollArea className="h-[250px] pr-3">
            {renderLockedElementList(userLocks, true)}
          </ScrollArea>
          
          {!readOnly && (
            <div className="mt-4 text-sm text-center text-muted-foreground">
              <p>
                Locked elements will be automatically released after 30 minutes of inactivity.
                You can extend your locks if you need more time.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="others" className="mt-4">
          <ScrollArea className="h-[250px] pr-3">
            {renderLockedElementList(otherLocks, false)}
          </ScrollArea>
          
          {otherLocks.length > 0 && (
            <div className="mt-4 text-sm text-center text-muted-foreground">
              <p>
                These elements are currently being edited by other users.
                You can view them but you can't make changes until they're unlocked.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="expired" className="mt-4">
          <ScrollArea className="h-[250px] pr-3">
            {expiredLocks.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                No expired locks.
              </div>
            ) : (
              <div className="space-y-3">
                {expiredLocks.map(lock => (
                  <Card key={lock.id} className="border border-muted opacity-75">
                    <CardHeader className="p-3 pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Unlock className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-base">{lock.name}</CardTitle>
                          <Badge variant="outline">
                            {getElementTypeName(lock.type)}
                          </Badge>
                        </div>
                        
                        <Badge variant="outline" className="text-muted-foreground">
                          Expired
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-3 pt-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {lock.lockedBy.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{lock.lockedBy.id === userId ? 'You' : lock.lockedBy.username}</span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Locked at {new Date(lock.lockedAt).toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="p-3 pt-0 flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewLockedElement(lock.id, lock.type)}
                      >
                        View
                      </Button>
                      
                      {!readOnly && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onLockElement(lock.id, lock.type, lock.name)}
                          className="text-yellow-500"
                        >
                          <Lock className="h-3 w-3 mr-1" />
                          Lock Again
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ElementLocking;