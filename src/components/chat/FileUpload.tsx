"use client";

import React, { type ChangeEvent, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileProcessed: (content: string, fileName: string, fileType: 'txt' | 'csv') => void;
  disabled?: boolean;
}

export function FileUpload({ onFileProcessed, disabled }: FileUploadProps) {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.txt') && !file.name.endsWith('.csv')) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a .txt or .csv file.",
        });
        setSelectedFileName(null);
        event.target.value = ''; // Reset file input
        return;
      }

      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const fileType = file.name.endsWith('.csv') ? 'csv' : 'txt';
        onFileProcessed(content, file.name, fileType);
      };
      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: "File Read Error",
          description: "Could not read the selected file.",
        });
        setSelectedFileName(null);
      }
      reader.readAsText(file);
    } else {
      setSelectedFileName(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <UploadCloud className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">
          {selectedFileName ? `Selected: ${selectedFileName}` : "No file selected"}
        </span>
      </div>
      <Input
        id="file-upload"
        type="file"
        accept=".txt,.csv"
        onChange={handleFileChange}
        className="hidden" 
        disabled={disabled}
      />
      <Button asChild variant="outline" disabled={disabled}>
        <label htmlFor="file-upload" className="cursor-pointer w-full bg-green-100">
          {selectedFileName ? "Change File" : "Choose File"}
        </label>
      </Button>
      <p className="text-xs text-muted-foreground">
        Supports .txt and .csv chat exports. For TXT, common formats like WhatsApp are supported.
      </p>
    </div>
  );
}
