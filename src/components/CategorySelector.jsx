import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const CategorySelector = ({ value, onValueChange, placeholder = "Chọn danh mục" }) => {
  const [categories, setCategories] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1");
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }

    setIsCreating(true);
    try {
      const res = await api.post("/categories", {
        name: newCategoryName.trim(),
        color: newCategoryColor,
      });

      toast.success("Tạo danh mục thành công");
      setCategories(prev => [res.data, ...prev]);
      onValueChange(res.data._id);
      setNewCategoryName("");
      setNewCategoryColor("#6366f1");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Lỗi khi tạo category:", error);
      toast.error(error.response?.data?.message || "Lỗi khi tạo danh mục");
    } finally {
      setIsCreating(false);
    }
  };

  const handleValueChange = (selectedValue) => {
    if (selectedValue === "create-new") {
      setIsDialogOpen(true);
    } else {
      onValueChange(selectedValue);
    }
  };

  return (
    <>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả danh mục</SelectItem>
          <SelectItem value="none">Không có danh mục</SelectItem>
          <SelectItem value="create-new" className="text-primary">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Tạo danh mục mới
            </div>
          </SelectItem>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tạo danh mục mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên
              </Label>
              <Input
                id="name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="col-span-3"
                placeholder="Nhập tên danh mục"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Màu
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-12 h-10 p-1 border rounded"
                />
                <span className="text-sm text-muted-foreground">
                  Chọn màu cho danh mục
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isCreating}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateCategory} disabled={isCreating}>
              {isCreating ? "Đang tạo..." : "Tạo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CategorySelector;
