import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Plus, Calendar, FileText, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { scheduleTaskReminders } from "@/lib/notifications";
import TemplateManager from "./TemplateManager";

const AddTask = ({ handleNewTaskAdded }) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [category, setCategory] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchTemplates();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Lỗi khi lấy categories:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get("/templates");
      setTemplates(res.data);
    } catch (error) {
      console.error("Lỗi khi lấy templates:", error);
    }
  };

  const addTask = async () => {
    if (newTaskTitle.trim()) {
      try {
        // Create task first
        const taskResponse = await api.post("/tasks", {
          title: newTaskTitle,
          category: category === "none" ? null : category || null,
          dueDate: dueDate || null,
          dueTime: dueTime || null,
          priority,
          description,
        });

        const newTask = taskResponse.data;

        // Upload attachments if any
        if (attachments.length > 0) {
          for (const attachment of attachments) {
            try {
              const formData = new FormData();
              formData.append('file', attachment.file);

              await api.post(`/tasks/${newTask._id}/attachments`, formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              });
            } catch (uploadError) {
              console.error("Lỗi khi upload file:", uploadError);
              toast.error(`Lỗi khi upload file ${attachment.name}`);
            }
          }
        }

        toast.success(`Thêm công việc ${newTaskTitle} thành công`);
        handleNewTaskAdded();

        // Reset form
        setNewTaskTitle("");
        setCategory("");
        setDueDate("");
        setDueTime("");
        setPriority("medium");
        setDescription("");
        setSelectedTemplate(null);
        setAttachments([]);
        setIsExpanded(false);
      } catch (error) {
        console.error("Lỗi xảy ra khi thêm task:", error);
        toast.error("Lỗi xảy ra khi thêm task");
      }
    } else {
      toast.error("Tiêu đề công việc không được để trống");
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setNewTaskTitle(template.title);
    setCategory(template.category?._id || "");
    setDueDate(template.dueDate ? template.dueDate.split('T')[0] : "");
    setPriority(template.priority);
    setDescription(template.description);
    setIsExpanded(true);
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Tên template không được để trống");
      return;
    }
    try {
      const res = await api.post("/templates", {
        name: templateName,
        title: newTaskTitle,
        category: category === "none" ? null : category || null,
        dueDate: dueDate || null,
        priority,
        description,
      });
      toast.success("Lưu template thành công");
      setTemplates(prev => [res.data, ...prev]);
      setShowSaveTemplate(false);
      setTemplateName("");
    } catch (error) {
      console.error("Lỗi khi lưu template:", error);
      toast.error("Lỗi khi lưu template");
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      addTask();
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(`${file.name} quá lớn. Kích thước tối đa là 10MB.`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type
    }))]);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 border-0 bg-gradient-card shadow-custom-lg">
        <div className="space-y-4">
          {/* Template Selection */}
          <div className="flex items-center gap-2">
            <Select value={selectedTemplate?._id || ""} onValueChange={(value) => {
              const template = templates.find(t => t._id === value);
              if (template) handleTemplateSelect(template);
              else setSelectedTemplate(null);
            }}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Chọn template (tùy chọn)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không dùng template</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template._id} value={template._id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="text"
              placeholder="Thêm công việc mới..."
              className="h-12 text-base bg-input sm:flex-1 border-border/50 focus:border-primary/50 focus:ring-primary/50"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <div className="flex gap-2">
              <Button
                variant="gradient"
                size="xl"
                className="px-6"
                onClick={addTask}
                disabled={!newTaskTitle.trim()}
              >
                <Plus className="size-5" />
                Thêm
              </Button>
              <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="xl" className="px-4">
                    <Save className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lưu làm Template</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Tên template..."
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowSaveTemplate(false)}>
                        Hủy
                      </Button>
                      <Button onClick={saveAsTemplate}>Lưu</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-primary"
            >
              {isExpanded ? "Ẩn chi tiết" : "Thêm chi tiết"}
            </Button>
          </div>

          {isExpanded && (
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Danh mục</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Chọn danh mục (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có danh mục</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Độ ưu tiên</label>
                  <Select value={priority} onValueChange={setPriority}>
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
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Giờ đến hạn</label>
                  <Input
                    type="time"
                    className="h-10"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mô tả</label>
                <Textarea
                  placeholder="Thêm mô tả chi tiết (tùy chọn)"
                  className="min-h-[80px] resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tệp đính kèm</label>
                <Input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                  onChange={handleFileSelect}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground" />
                          <span className="text-sm">{att.name}</span>
                          <span className="text-xs text-muted-foreground">({formatFileSize(att.size)})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(att.id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Template Manager */}
      <TemplateManager
        onTemplateSelect={handleTemplateSelect}
        templates={templates}
        setTemplates={setTemplates}
      />
    </div>
  );
};

export default AddTask;
