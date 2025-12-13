
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface QuickSurveyEditorProps {
  survey: {
    id: string;
    title: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (survey: any) => void;
}

export const QuickSurveyEditor: React.FC<QuickSurveyEditorProps> = ({
  survey,
  isOpen,
  onClose,
  onSave
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Quick Edit: {survey?.title}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="edit">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="h-[calc(80vh-120px)] overflow-auto">
            <div className="space-y-4 p-4">
              {/* Survey editor content */}
            </div>
          </TabsContent>
          <TabsContent value="preview">
            <Card className="h-[calc(80vh-120px)] overflow-auto">
              <iframe 
                src={`/survey/${survey?.id}/preview`}
                className="w-full h-full border-0"
              />
            </Card>
          </TabsContent>
          <TabsContent value="share">
            <Card className="h-[calc(80vh-120px)] overflow-auto p-4">
              {/* Sharing options */}
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
