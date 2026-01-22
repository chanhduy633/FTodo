import AddTask from "@/components/AddTask";
import DateTimeFilter from "@/components/DateTimeFilter";
import Footer from "@/components/Footer";
import { Header } from "@/components/Header";
import ReminderBanner from "@/components/ReminderBanner";
import StatsAndFilters from "@/components/StatsAndFilters";
import TaskList from "@/components/TaskList";
import TaskListPagination from "@/components/TaskListPagination";
import CategorySelector from "@/components/CategorySelector";
import TemplateManager from "@/components/TemplateManager";
import ExportButton from "@/components/ExportButton";
import ImportModal from "@/components/ImportModal";
import CalendarGridView from "@/components/CalendarGridView";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { visibleTaskLimit } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { LogIn, UserPlus, List, Calendar } from "lucide-react";
import { scheduleTaskReminders, cancelTaskReminders, updateTaskReminders, requestNotificationPermission, restoreRemindersFromStorage } from "@/lib/notifications";

const HomePage = () => {
  const { user } = useAuth();
  const [taskBuffer, settaskBuffer] = useState([]);
  const [activeTaskCount, setactiveTaskCount] = useState(0);
  const [completeTaskCount, setcompleteTaskCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [dateQuery, setDateQuery] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // "list" or "calendar"

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        await fetchTasks();
        // Restore reminders from localStorage on page load
        restoreRemindersFromStorage();
        setLoading(false);
      };
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Request notification permission and schedule reminders when tasks change
  useEffect(() => {
    const setupNotifications = async () => {
      if (user && taskBuffer.length > 0) {
        // Request notification permission
        await requestNotificationPermission();

        // Cancel all existing reminders first
        taskBuffer.forEach(task => {
          cancelTaskReminders(task._id);
        });

        // Schedule reminders for all active tasks
        taskBuffer.forEach(task => {
          if (task.status === 'active' && task.dueDate) {
            scheduleTaskReminders(task);
          }
        });
      }
    };

    setupNotifications();

    // Cleanup function to cancel all reminders when component unmounts
    return () => {
      taskBuffer.forEach(task => {
        cancelTaskReminders(task._id);
      });
    };
  }, [user, taskBuffer]);

  // Additional effect to ensure reminders are scheduled after initial load
  useEffect(() => {
    if (user && taskBuffer.length > 0 && !loading) {
      // Double-check that reminders are scheduled for all active tasks
      taskBuffer.forEach(task => {
        if (task.status === 'active' && task.dueDate) {
          scheduleTaskReminders(task);
        }
      });
    }
  }, [user, taskBuffer, loading]);

  const handleTaskChanged = () => {
    fetchTasks();
    setSelectedTasks([]); // Clear selections after task change
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    try {
      await api.post('/tasks/bulk-delete', { taskIds: selectedTasks });
      toast.success(`Đã xóa ${selectedTasks.length} nhiệm vụ`);
      handleTaskChanged();
    } catch (error) {
      console.error('Lỗi khi xóa hàng loạt:', error);
      toast.error('Lỗi khi xóa hàng loạt');
    }
  };

  const handleBulkComplete = async () => {
    if (selectedTasks.length === 0) return;
    try {
      await api.post('/tasks/bulk-update', {
        taskIds: selectedTasks,
        status: 'complete',
        completedAt: new Date().toISOString()
      });
      toast.success(`Đã đánh dấu hoàn thành ${selectedTasks.length} nhiệm vụ`);
      handleTaskChanged();
    } catch (error) {
      console.error('Lỗi khi cập nhật hàng loạt:', error);
      toast.error('Lỗi khi cập nhật hàng loạt');
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  const filteredTasks = taskBuffer.filter((task) => {
    // Filter by status
    let statusMatch = true;
    switch (filter) {
      case "active":
        statusMatch = task.status === "active";
        break;
      case "completed":
        statusMatch = task.status === "complete";
        break;
      default:
        statusMatch = true;
    }

    return statusMatch;
  });

  const visibleTasks = filteredTasks.slice(
    (page - 1) * visibleTaskLimit,
    page * visibleTaskLimit
  );

  if (visibleTasks.length === 0 && page > 1) {
    handlePrev();
  }

  const totalPages = Math.ceil(filteredTasks.length / visibleTaskLimit);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams({ filter: dateQuery });
      if (categoryFilter && categoryFilter !== "all") {
        params.append('category', categoryFilter);
      }
      // Add timestamp to prevent caching
      params.append('_t', Date.now());

      const res = await api.get(`/tasks?${params.toString()}`);
      settaskBuffer(res.data.tasks);
      setactiveTaskCount(res.data.activeCount);
      setcompleteTaskCount(res.data.completeCount);
    } catch (error) {
      console.error("Lỗi xảy ra khi truy xuất tasks:", error);
      toast.error("Lỗi xảy ra khi truy xuất tasks");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      {/* Grid + Left & Right Gradient Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
       linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
       linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px),
       radial-gradient(circle 600px at 0% 200px, hsl(var(--primary) / 0.1), transparent),
       radial-gradient(circle 600px at 100% 200px, hsl(var(--primary) / 0.1), transparent)
     `,
          backgroundSize: `
       96px 64px,
       96px 64px,
       100% 100%,
       100% 100%
     `,
        }}
      />
      <div className="container mx-auto relative z-10">
        <div className="w-full max-w-2xl p-6 mx-auto space-y-6 ">
          <Header />

          {user ? (
            <>
              <ReminderBanner tasks={taskBuffer} />
              <AddTask handleNewTaskAdded={handleTaskChanged} />

              <StatsAndFilters
                filter={filter}
                setFilter={setFilter}
                activeTasksCount={activeTaskCount}
                completedTasksCount={completeTaskCount}
              />
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-foreground">Lọc theo danh mục:</label>
                <CategorySelector
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                  placeholder="Chọn danh mục"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-foreground">Chế độ xem:</label>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4 mr-2" />
                    Danh sách
                  </Button>
                  <Button
                    variant={viewMode === "calendar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("calendar")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Lịch
                  </Button>
                </div>
              </div>
              {viewMode === "list" ? (
                <TaskList
                  filteredTasks={visibleTasks}
                  filter={filter}
                  handleTaskChanged={handleTaskChanged}
                  selectedTasks={selectedTasks}
                  setSelectedTasks={setSelectedTasks}
                />
              ) : (
                <CalendarGridView
                  tasks={taskBuffer}
                  categoryFilter={categoryFilter}
                  handleTaskChanged={handleTaskChanged}
                />
              )}
              {selectedTasks.length > 0 && (
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleBulkComplete} variant="default">
                    Đánh dấu hoàn thành ({selectedTasks.length})
                  </Button>
                  <Button onClick={handleBulkDelete} variant="destructive">
                    Xóa ({selectedTasks.length})
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-center gap-4">
                <ExportButton />
                <ImportModal onImportSuccess={handleTaskChanged} />
              </div>
              <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                <TaskListPagination
                  handleNext={handleNext}
                  handlePrev={handlePrev}
                  handlePageChange={handlePageChange}
                  page={page}
                  totalPages={totalPages}
                />
                <DateTimeFilter dateQuery={dateQuery} setDateQuery={setDateQuery} />
              </div>
              <Footer
                activeTasksCount={activeTaskCount}
                completedTasksCount={completeTaskCount}
              />
            </>
          ) : (
            <div className="text-center space-y-6">
              <p className="text-muted-foreground text-lg">
                Để sử dụng TodoX, vui lòng đăng nhập hoặc đăng ký tài khoản.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
