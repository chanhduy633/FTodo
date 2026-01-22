import React from "react";
import { Card } from "./ui/card";
import { Circle } from "lucide-react";
const TaskEmptyState = ({ filter }) => {
  return (
    <Card className="p-8 text-center border-0 bg-gradient-card shadow-custom-md">
      <div className="space-y-3">
        <Circle className="size-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="font-medium text-foreground">
            {filter === "active"
              ? "Không có công việc đang hoạt động"
              : filter === "complete"
              ? "Không có công việc đã hoàn thành"
              : "Không có công việc nào"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {filter === "all"
              ? "Tạo công việc mới và bắt đầu hoàn thành chúng"
              : `Chuyển sang tab "Tất cả" để xem các công việc ${
                  filter === "active" ? "Đã hòn thành" : "Đang làm"
                }`}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default TaskEmptyState;
