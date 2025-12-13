import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { History, Save, Undo2, Redo2, Clock, Tag, PlusCircle, CheckCircle2, XCircle } from 'lucide-react';

export interface Version {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: {
    id: number;
    username: string;
  };
  isCurrent: boolean;
}

interface VersionControlProps {
  versions: Version[];
  sessionId: number;
  userId: number;
  username: string;
  onCreateVersion: (name: string, description: string) => void;
  onSwitchVersion: (versionId: string) => void;
  onCompareVersions: (versionId1: string, versionId2: string) => void;
  onRestoreVersion: (versionId: string) => void;
  readOnly?: boolean;
}

const VersionControl: React.FC<VersionControlProps> = ({
  versions,
  sessionId,
  userId,
  username,
  onCreateVersion,
  onSwitchVersion,
  onCompareVersions,
  onRestoreVersion,
  readOnly = false,
}) => {
  const [newVersion, setNewVersion] = useState({ name: '', description: '' });
  const [openDialog, setOpenDialog] = useState(false);
  const { toast } = useToast();
  
  // Handle creating a new version
  const handleCreateVersion = () => {
    if (!newVersion.name) {
      toast({
        title: 'Error',
        description: 'Version name is required',
        variant: 'destructive',
      });
      return;
    }
    
    onCreateVersion(newVersion.name, newVersion.description);
    
    // Reset form and close dialog
    setNewVersion({ name: '', description: '' });
    setOpenDialog(false);
    
    toast({
      title: 'Version Created',
      description: `Version "${newVersion.name}" has been created successfully.`,
    });
  };
  
  // Find the current version
  const currentVersion = versions.find(v => v.isCurrent);
  
  // Sort versions by date (newest first)
  const sortedVersions = [...versions].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Version Control</h3>
        
        {!readOnly && (
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="mr-2 h-4 w-4" />
                Create Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Version</DialogTitle>
                <DialogDescription>
                  Save the current state as a new version. This will create a snapshot that can be returned to later.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Version Name</label>
                  <Input
                    value={newVersion.name}
                    onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })}
                    placeholder="e.g., v1.0, Initial Draft, etc."
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea
                    value={newVersion.description}
                    onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                    placeholder="Describe the changes in this version..."
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateVersion}>Create Version</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {/* Current Version Display */}
      {currentVersion && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Current Version: {currentVersion.name}</CardTitle>
            </div>
            {currentVersion.description && (
              <CardDescription>{currentVersion.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="pb-2 pt-0">
            <div className="text-sm text-muted-foreground">
              Created by {currentVersion.createdBy.username} on{' '}
              {new Date(currentVersion.createdAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Version History */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-muted px-4 py-2 font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          <span>Version History</span>
        </div>
        
        <div className="divide-y">
          {sortedVersions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No versions have been created yet.
            </div>
          ) : (
            sortedVersions.map((version) => (
              <div 
                key={version.id}
                className={`p-4 flex items-start justify-between hover:bg-muted/50 ${
                  version.isCurrent ? 'bg-muted/30' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {version.isCurrent && (
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    )}
                    <h4 className="font-medium">{version.name}</h4>
                  </div>
                  
                  {version.description && (
                    <p className="text-sm text-muted-foreground">{version.description}</p>
                  )}
                  
                  <div className="text-xs text-muted-foreground flex items-center space-x-2">
                    <span>Created by {version.createdBy.username}</span>
                    <span>•</span>
                    <span>
                      <Clock className="inline h-3 w-3 mr-1" />
                      {new Date(version.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {!readOnly && !version.isCurrent && (
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onSwitchVersion(version.id)}
                      title="Switch to this version"
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onRestoreVersion(version.id)}
                      title="Restore this version (creates a new version based on this one)"
                    >
                      <Redo2 className="h-4 w-4" />
                    </Button>
                    
                    {currentVersion && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onCompareVersions(currentVersion.id, version.id)}
                        title="Compare with current version"
                      >
                        Compare
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionControl;