import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TaskCard from '@/components/TaskCard';

const CalendarGridView = ({ tasks, categoryFilter, handleTaskChanged }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Filter tasks by category
  const filteredTasks = useMemo(() => {
    if (categoryFilter === 'all') return tasks;
    return tasks.filter(task => task.category === categoryFilter);
  }, [tasks, categoryFilter]);

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    return filteredTasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDayClick = (date) => {
    setSelectedDate(date);
  };

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate).sort((a, b) => {
    // Sort by priority first (high > medium > low)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority] || 2;
    const bPriority = priorityOrder[b.priority] || 2;

    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority first
    }

    // Then sort by due time
    if (a.dueTime && b.dueTime) {
      return a.dueTime.localeCompare(b.dueTime);
    }
    if (a.dueTime) return -1;
    if (b.dueTime) return 1;

    // Finally sort by creation date
    return new Date(a.createdAt) - new Date(b.createdAt);
  }) : [];

  return (
    <div className="space-y-4">
      {/* Header with month/year and navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <Button variant="outline" size="sm" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
          <div key={day} className="p-2 text-center font-medium text-sm">
            {day}
          </div>
        ))}

        {/* Days */}
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="p-2"></div>;
          }

          const dayTasks = getTasksForDate(date);
          const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`p-2 border rounded cursor-pointer hover:bg-accent transition-colors ${
                isSelected ? 'bg-primary text-primary-foreground' : ''
              } ${isToday ? 'border-primary' : ''}`}
              onClick={() => handleDayClick(date)}
            >
              <div className="text-sm font-medium">{date.getDate()}</div>
              {dayTasks.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Day Tasks Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Tasks cho {selectedDate?.toLocaleDateString('vi-VN')}
            </DialogTitle>
          </DialogHeader>
          {selectedTasks.length === 0 ? (
            <p className="text-muted-foreground">Không có task nào cho ngày này.</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  handleTaskChanged={handleTaskChanged}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarGridView;
