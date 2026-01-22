import React, { useState } from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { toast } from 'sonner';
import { exportTasks } from '@/lib/axios';
import { downloadFile } from '@/utils/fileHelpers';

const ExportButton = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format) => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const response = await exportTasks(format);
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      });

      const filename = `tasks.${format}`;
      downloadFile(blob, filename);

      toast.success(`Tasks exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to export tasks. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    {
      format: 'csv',
      label: 'CSV',
      icon: FileText,
      description: 'Comma-separated values'
    },
    {
      format: 'json',
      label: 'JSON',
      icon: FileJson,
      description: 'JavaScript Object Notation'
    },
    {
      format: 'excel',
      label: 'Excel',
      icon: FileSpreadsheet,
      description: 'Microsoft Excel format'
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2" disabled={isExporting}>
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.format}
              onClick={() => handleExport(option.format)}
              disabled={isExporting}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Icon className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
