
import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import CategorySelector from "./CategorySelector";
import {
  Calendar,
  CheckCircle2,
  Circle,
  SquarePen,
  Trash2,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  Image,
  File,
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { updateTaskReminders } from "@/lib/notifications";

const TaskCard = ({ task, index, handleTaskChanged, isSelected, onSelectChange }) => {
  const [isEditting, setIsEditting] = useState(false);
  const [updatedTaskTitle, setUpdateTaskTitle] = useState(task.title || "");
  const [updatedCategory, setUpdatedCategory] = useState(task.category?._id || "none");
  const [updatedPriority, setUpdatedPriority] = useState(task.priority || "medium");
  const [updatedDueDate, setUpdatedDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
  const [updatedDueTime, setUpdatedDueTime] = useState(task.dueTime || "");
  const [updatedDescription, setUpdatedDescription] = useState(task.description || "");
  const [categories, setCategories] = useState([]);

  // Calculate deadline urgency
  const getDeadlineUrgency = () => {
    if (!task.dueDate || task.status === "complete") return null;

    const now = new Date();
    let dueDateTime = new Date(task.dueDate);

    if (task.dueTime) {
      const [hours, minutes] = task.dueTime.split(':');
      dueDateTime.setHours(parseInt(hours), parseInt(minutes));
    }

    const timeDiff = dueDateTime - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (timeDiff < 0) return 'overdue';
    if (hoursDiff <= 1) return 'urgent'; // Within 1 hour
    if (hoursDiff <= 24) return 'soon'; // Within 24 hours
    return null;
  };

  const deadlineUrgency = getDeadlineUrgency();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Lỗi khi lấy categories:", error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success("Xóa task thành công");
      handleTaskChanged();
    } catch (error) {
      console.error("Lỗi xảy ra khi xóa task:", error);
      toast.error("Lỗi xảy ra khi xóa task");
    }
  };

  const updateTask = async () => {
    try {
      setIsEditting(false);
      const updatedTaskData = {
        title: updatedTaskTitle,
        category: updatedCategory || null,
        priority: updatedPriority,
        dueDate: updatedDueDate ? new Date(updatedDueDate).toISOString() : null,
        dueTime: updatedDueTime || null,
        description: updatedDescription,
      };
      await api.put(`/tasks/${task._id}`, updatedTaskData);
      toast.success("Cập nhật task thành công");

      // Update reminders for the task
      const updatedTask = { ...task, ...updatedTaskData };
      updateTaskReminders(task, updatedTask);

      handleTaskChanged();
    } catch (error) {
      console.error("Lỗi xảy ra khi cập nhật task:", error);
      toast.error("Lỗi xảy ra khi cập nhật task");
    }
  };

  const toggleTaskCompleteButton = async () => {
    try {
      if (task.status === "active") {
        await api.put(`/tasks/${task._id}`, {
          status: "complete",
          completedAt: new Date().toISOString(),
        });
        toast.success(`Đánh dấu công việc ${task.title} đã hoàn thành`);
      } else {
        await api.put(`/tasks/${task._id}`, {
          status: "active",
          completedAt: null,
        });
        toast.success(`Đánh dấu công việc ${task.title} là chưa hoàn thành`);
      }
      handleTaskChanged();
    } catch (error) {
      console.error("Lỗi xảy ra khi cập nhật task:", error);
      toast.error("Lỗi xảy ra khi cập nhật task");
    }
  };

  const handleCategoryChange = (value) => {
    setUpdatedCategory(value);
    fetchCategories(); // Refresh categories when a new one is created
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      updateTask();
    }
  };
  return (
    <Card
      className={cn(
        "p-4 bg-gradient-card border-0 shadow-custom-md hover:shadow-custom-lg transition-all duration-200 animate-fade-in group",
        task.status === "complete" && "opacity-75",
        deadlineUrgency === 'overdue' && "border-l-4 border-l-destructive bg-destructive/5",
        deadlineUrgency === 'urgent' && "border-l-4 border-l-orange-500 bg-orange-500/5",
        deadlineUrgency === 'soon' && "border-l-4 border-l-yellow-500 bg-yellow-500/5"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox for bulk selection */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelectChange}
          className="flex-shrink-0"
        />
        {/* Nút Tròn */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "flex-shrink-0 size-8 rounded-full transition-all duration-200",
            task.status === "complete"
              ? "text-success hover:text-success/80"
              : "text-muted-foreground hover:text-primary"
          )}
          onClick={toggleTaskCompleteButton}
        >
          {task.status === "complete" ? (
            <CheckCircle2 className="size-5" />
          ) : (
            <Circle className="size-5" />
          )}
        </Button>
        {/* Hiển thị */}
        <div className="flex-1 min-w-0">
          {isEditting ? (
            <div className="space-y-4">
              <Input
                placeholder="Cần phải làm gì?"
                className="flex-1 h-12 text-base border-boder/50 focus:border-primary/50 focus:ring-primary/20"
                type="text"
                value={updatedTaskTitle}
                onChange={(e) => setUpdateTaskTitle(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Danh mục</label>
                  <CategorySelector
                    value={updatedCategory}
                    onValueChange={handleCategoryChange}
                    placeholder="Chọn danh mục (tùy chọn)"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Độ ưu tiên</label>
                  <Select value={updatedPriority} onValueChange={setUpdatedPriority}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Thấp</SelectItem>
                      <SelectItem value="medium">Trung bình</SelectItem>
                      <SelectItem value="high">Cao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Ngày đến hạn</label>
                  <Input
                    type="date"
                    className="h-10"
                    value={updatedDueDate}
                    onChange={(e) => setUpdatedDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Giờ đến hạn</label>
                  <Input
                    type="time"
                    className="h-10"
                    value={updatedDueTime}
                    onChange={(e) => setUpdatedDueTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mô tả</label>
                <Textarea
                  placeholder="Thêm mô tả chi tiết (tùy chọn)"
                  className="min-h-[80px] resize-none"
                  value={updatedDescription}
                  onChange={(e) => setUpdatedDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={updateTask} size="sm" className="flex-1">
                  Lưu
                </Button>
                <Button
                  onClick={() => {
                    setIsEditting(false);
                    setUpdateTaskTitle(task.title || "");
                    setUpdatedCategory(task.category?._id || "");
                    setUpdatedPriority(task.priority || "medium");
                    setUpdatedDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
                    setUpdatedDueTime(task.dueTime || "");
                    setUpdatedDescription(task.description || "");
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Hủy
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <p
                  className={cn(
                    "text-base transition-all duration-200 flex-1",
                    task.status === "complete"
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  )}
                >
                  {task.title}
                </p>
                {task.category && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 text-xs"
                    style={{
                      backgroundColor: `${task.category.color}20`,
                      borderColor: task.category.color,
                      color: task.category.color
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: task.category.color }}
                    />
                    {task.category.name}
                  </Badge>
                )}
              </div>

              {/* Priority indicator */}
              {task.priority && task.priority !== "medium" && (
                <div className="flex items-center gap-1">
                  <AlertTriangle
                    className={cn(
                      "size-3",
                      task.priority === "high" ? "text-destructive" :
                      task.priority === "low" ? "text-success" : "text-info"
                    )}
                  />
                  <span className={cn(
                    "text-xs font-medium",
                    task.priority === "high" ? "text-destructive" :
                    task.priority === "low" ? "text-success" : "text-info"
                  )}>
                    {task.priority === "high" ? "Cao" :
                     task.priority === "low" ? "Thấp" : "Trung bình"}
                  </span>
                </div>
              )}

              {/* Due date */}
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Clock className="size-3 text-muted-foreground" />
                  <span className={cn(
                    "text-xs",
                    new Date(task.dueDate) < new Date() && task.status !== "complete"
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  )}>
                    Đến hạn: {new Date(task.dueDate).toLocaleDateString()}{task.dueTime ? ` lúc ${task.dueTime}` : ''}
                  </span>
                </div>
              )}

              {/* Description */}
              {task.description && (
                <div className="flex items-start gap-1">
                  <FileText className="size-3 text-muted-foreground mt-0.5" />
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                </div>
              )}

              {/* Attachments */}
              {task.attachments && task.attachments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <FileText className="size-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Tệp đính kèm ({task.attachments.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {task.attachments.map((attachment, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {attachment.type?.startsWith('image/') ? (
                            <Image className="size-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <File className="size-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="text-xs text-foreground truncate">
                            {attachment.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                          onClick={() => window.open(attachment.url, '_blank')}
                        >
                          <Download className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ngày tạo và ngày hoàn thành */}
              <div className="flex items-center gap-2">
                <Calendar className="size-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Tạo: {new Date(task.createdAt).toLocaleString()}
                </span>
                {task.completedAt && (
                  <>
                    <span className="text-xs text-muted-foreground">-</span>
                    <Calendar className="size-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Hoàn thành: {new Date(task.completedAt).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden gap-2 group-hover:inline-flex animate-slide-up">
          {/* Nút edit */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 transition-colors size-8 text-muted-foreground hover:text-info"
            onClick={() => {
              setIsEditting(true);
              setUpdateTaskTitle(task.title || "");
              setUpdatedCategory(task.category?._id || "");
              setUpdatedPriority(task.priority || "medium");
              setUpdatedDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
              setUpdatedDueTime(task.dueTime || "");
              setUpdatedDescription(task.description || "");
            }}
          >
            <SquarePen className="size-4" />
          </Button>
          {/* Nút delete */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 transition-colors size-8 text-muted-foreground hover:text-destructive"
            onClick={() => deleteTask(task._id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;
