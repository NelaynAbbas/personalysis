import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileJson,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";

interface BackupItem {
  id: number;
  name: string;
  description?: string;
  created_at?: string; // Snake case from database
  createdAt?: string;  // Camel case from transformed API
  date?: string;      // Formatted date for display
  rawDate?: string;   // Raw date value
  size: string;
  type: 'auto' | 'manual';
  status: 'completed' | 'in-progress' | 'failed';
  path?: string;
  user_id?: number;
  userId?: number;
  updated_at?: string;
  updatedAt?: string;
  includeResponses?: boolean;
}

// Interface for display format
interface DisplayBackupItem {
  id: number;
  name: string;
  date: string; // Formatted date for display
  size: string;
  type: 'auto' | 'manual';
  status: 'completed' | 'in-progress' | 'failed';
}

const BackupManager = () => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupName, setBackupName] = useState('');
  const [selectedBackupType, setSelectedBackupType] = useState<string>('full');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [retentionPeriod, setRetentionPeriod] = useState('90');
  const [storageLocation, setStorageLocation] = useState('local');
  const [dailyBackups, setDailyBackups] = useState(true);
  const [weeklyBackups, setWeeklyBackups] = useState(true);
  const [monthlyBackups, setMonthlyBackups] = useState(true);
  
  // Fetch backups from API
  useEffect(() => {
    const fetchBackups = async () => {
      try {
        setIsLoading(true);
        setIsError(false);
        
        const response = await fetch('/api/system/backups');
        if (!response.ok) {
          throw new Error(`Failed to fetch backups: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.status === 'success') {
          // Map API data to our component data structure
          const formattedBackups = data.data.map((backup: BackupItem) => {
            // Support both snake_case and camelCase formats from API
            const dateString = backup.date || backup.created_at || backup.createdAt || backup.rawDate;
            
            // Format date for display if not already formatted
            let formattedDate = backup.date;
            if (!formattedDate && dateString) {
              const date = new Date(dateString);
              formattedDate = date.toLocaleString('en-US', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }).replace(',', '');
            }
            
            // Return normalized backup data with proper fields
            return {
              id: backup.id,
              name: backup.name,
              description: backup.description || '',
              date: formattedDate || 'Unknown date',
              size: backup.size,
              type: backup.type,
              status: backup.status,
              path: backup.path || '',
              user_id: backup.user_id || backup.userId || 0,
              created_at: backup.created_at || backup.createdAt || '',
              updated_at: backup.updated_at || backup.updatedAt || '',
              includeResponses: backup.includeResponses || false
            };
          });
          
          setBackups(formattedBackups);
        } else {
          throw new Error(data.message || 'Failed to fetch backups');
        }
      } catch (error) {
        console.error('Error fetching backups:', error);
        setIsError(true);
        toast({
          title: "Error loading backups",
          description: error instanceof Error ? error.message : "Failed to load backups",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBackups();
  }, []);
  
  const createBackup = async () => {
    if (!backupName.trim()) {
      toast({
        title: "Backup name required",
        description: "Please enter a name for your backup",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingBackup(true);
    setBackupProgress(0);
    
    // Start progress animation
    const progressInterval = setInterval(() => {
      setBackupProgress(prev => {
        // Max progress during API call is 90%
        if (prev >= 90) {
          return 90;
        }
        return prev + (Math.random() * 10);
      });
    }, 300);
    
    try {
      // Make actual API call to create backup
      const response = await fetch('/api/system/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: backupName,
          type: selectedBackupType === 'data' ? 'data' : selectedBackupType === 'config' ? 'config' : 'full'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create backup: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Format date for display from created_at
        const backupData = data.data;
        const date = new Date(backupData.created_at);
        const formattedBackup = {
          ...backupData,
          date: date.toLocaleString('en-US', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).replace(',', '')
        };
        
        // Add new backup to the list
        setBackups([formattedBackup, ...backups]);
        setBackupName('');
        setBackupProgress(100); // Complete progress
        
        toast({
          title: "Backup created",
          description: `Manual backup "${backupName}" has been created successfully.`,
        });
      } else {
        throw new Error(data.message || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: "Backup creation failed",
        description: error instanceof Error ? error.message : "Failed to create backup",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsCreatingBackup(false);
    }
  };
  
  const restoreBackup = async (backup: BackupItem) => {
    try {
      setIsRestoring(true);
      
      // Make API call to restore the backup
      const response = await fetch(`/api/system/backups/${backup.id}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to restore backup: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Update the status of the backup in the local state
        const updatedBackups = backups.map(b => {
          if (b.id === backup.id) {
            return { ...b, status: 'completed' };
          }
          return b;
        });
        
        setBackups(updatedBackups);
        
        toast({
          title: "Backup restored",
          description: data.message || `System has been restored from backup "${backup.name}".`,
        });
      } else {
        throw new Error(data.message || 'Failed to restore backup');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast({
        title: "Restore failed",
        description: error instanceof Error ? error.message : "Failed to restore backup",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };
  
  const deleteBackup = async (id: number) => {
    try {
      // Make API call to delete the backup
      const response = await fetch(`/api/system/backups/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete backup: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Remove from local state
        setBackups(backups.filter(backup => backup.id !== id));
        
        toast({
          title: "Backup deleted",
          description: "The selected backup has been deleted successfully.",
        });
      } else {
        throw new Error(data.message || 'Failed to delete backup');
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete backup",
        variant: "destructive",
      });
    }
  };
  
  const saveBackupSettings = () => {
    // Create settings object to save
    const settings = {
      dailyBackups,
      weeklyBackups,
      monthlyBackups,
      retentionPeriod,
      storageLocation
    };
    
    // In a real app, this would make an API call to save settings
    console.log('Saving backup settings:', settings);
    
    toast({
      title: "Settings saved",
      description: "Backup settings have been updated successfully.",
    });
  };
  
  const handleUploadAndRestore = () => {
    if (!uploadFile) {
      toast({
        title: "No file selected",
        description: "Please select a backup file to restore",
        variant: "destructive",
      });
      return;
    }
    
    setIsRestoring(true);
    
    // Simulate restore process
    setTimeout(() => {
      setIsRestoring(false);
      setUploadFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      toast({
        title: "Backup restored",
        description: `System has been restored from file "${uploadFile.name}".`,
      });
    }, 3000);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Backup & Restore</CardTitle>
          <CardDescription>
            Create manual backups or restore the system from a previous state
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create Backup Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Create Manual Backup</h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backup-name">Backup Name</Label>
                <Input 
                  id="backup-name" 
                  placeholder="e.g., Pre-deployment Backup" 
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  disabled={isCreatingBackup}
                  autoComplete="off"
                  className="focus:border-primary"
                  aria-label="Backup name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backup-type">Backup Type</Label>
                <Select 
                  value={selectedBackupType} 
                  onValueChange={setSelectedBackupType}
                  disabled={isCreatingBackup}
                >
                  <SelectTrigger id="backup-type">
                    <SelectValue placeholder="Select backup type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full System Backup</SelectItem>
                    <SelectItem value="data">Database Only</SelectItem>
                    <SelectItem value="config">Configuration Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={createBackup} 
                  disabled={isCreatingBackup || !backupName.trim()}
                  className="w-full"
                >
                  {isCreatingBackup ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Backup...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Backup
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {isCreatingBackup && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Creating backup...</span>
                  <span>{Math.round(backupProgress)}%</span>
                </div>
                <Progress value={backupProgress} className="h-2" />
              </div>
            )}
          </div>
          
          {/* Backups List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Available Backups</h3>
              <div className="text-sm text-muted-foreground">
                {backups.length} backups available
              </div>
            </div>
            <Separator />
            
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="py-3 px-4 text-left font-medium">Name</th>
                    <th className="py-3 px-4 text-left font-medium">Date</th>
                    <th className="py-3 px-4 text-left font-medium">Size</th>
                    <th className="py-3 px-4 text-left font-medium">Type</th>
                    <th className="py-3 px-4 text-left font-medium">Status</th>
                    <th className="py-3 px-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {backups.map((backup) => (
                    <tr key={backup.id} className="bg-card hover:bg-muted/50">
                      <td className="py-3 px-4">{backup.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          {backup.date}
                        </div>
                      </td>
                      <td className="py-3 px-4">{backup.size}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${backup.type === 'auto' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-500' : 'bg-purple-100 text-purple-800 dark:bg-purple-800/30 dark:text-purple-500'}`}>
                          {backup.type === 'auto' ? 'Automatic' : 'Manual'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {backup.status === 'completed' ? (
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                          ) : backup.status === 'in-progress' ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 text-amber-500 animate-spin" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                          )}
                          {backup.status === 'completed' ? 'Completed' : backup.status === 'in-progress' ? 'In Progress' : 'Failed'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"  
                          onClick={() => restoreBackup(backup)}
                          disabled={isRestoring || backup.status !== 'completed'}
                        >
                          {isRestoring ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          <span className="sr-only">Restore</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isRestoring}
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span className="sr-only">Download</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteBackup(backup.id)}
                          disabled={isRestoring || backup.type === 'auto'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Restore from File */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Restore from Backup File</h3>
            <Separator />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="file-upload" className="block mb-2">Upload Backup File</Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    id="file-upload" 
                    type="file" 
                    accept=".json,.zip,.bak"
                    disabled={isRestoring}
                    onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Accepts .json, .zip, or .bak backup files</p>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={isRestoring || !uploadFile}
                  onClick={handleUploadAndRestore}
                >
                  {isRestoring ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload & Restore
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Backup Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Automatic Backup Settings</h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="daily-backup">Daily Backups</Label>
                    <p className="text-xs text-muted-foreground">Create a backup every day at midnight</p>
                  </div>
                  <Switch 
                    id="daily-backup" 
                    checked={dailyBackups}
                    onCheckedChange={setDailyBackups}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-backup">Weekly Backups</Label>
                    <p className="text-xs text-muted-foreground">Create a backup every Sunday at midnight</p>
                  </div>
                  <Switch 
                    id="weekly-backup" 
                    checked={weeklyBackups}
                    onCheckedChange={setWeeklyBackups}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="monthly-backup">Monthly Backups</Label>
                    <p className="text-xs text-muted-foreground">Create a backup on the 1st of each month</p>
                  </div>
                  <Switch 
                    id="monthly-backup" 
                    checked={monthlyBackups}
                    onCheckedChange={setMonthlyBackups}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-retention">Backup Retention Period</Label>
                  <Select 
                    value={retentionPeriod}
                    onValueChange={setRetentionPeriod}
                  >
                    <SelectTrigger id="backup-retention">
                      <SelectValue placeholder="Select retention period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Automatic backups older than this will be deleted</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backup-storage">Backup Storage Location</Label>
                  <Select 
                    value={storageLocation}
                    onValueChange={setStorageLocation}
                  >
                    <SelectTrigger id="backup-storage">
                      <SelectValue placeholder="Select storage location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local Storage</SelectItem>
                      <SelectItem value="cloud">Cloud Storage</SelectItem>
                      <SelectItem value="both">Both (Local & Cloud)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-4 bg-muted/50 border-t">
          <Button variant="outline" onClick={() => {
            setDailyBackups(true);
            setWeeklyBackups(true);
            setMonthlyBackups(true);
            setRetentionPeriod("90");
            setStorageLocation("local");
          }}>
            Cancel Changes
          </Button>
          <Button onClick={saveBackupSettings}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BackupManager;