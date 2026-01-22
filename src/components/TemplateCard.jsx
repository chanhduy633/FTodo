import React from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { FileText, Edit, Trash2, Play } from "lucide-react";

const TemplateCard = ({ template, onSelect, onEdit, onDelete }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h3 className="font-medium text-foreground truncate">{template.name}</h3>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {template.title}
          </p>

          {template.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {template.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={getPriorityColor(template.priority)}>
              {template.priority === "high" ? "Cao" :
               template.priority === "medium" ? "Trung bình" : "Thấp"}
            </Badge>

            {template.dueDate && (
              <span className="text-xs text-muted-foreground">
                {formatDate(template.dueDate)}
              </span>
            )}
          </div>

          <Button
            variant="gradient"
            size="sm"
            onClick={onSelect}
            className="h-8 px-3"
          >
            <Play className="size-3 mr-1" />
            Sử dụng
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TemplateCard;
