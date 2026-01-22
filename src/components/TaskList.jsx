import React, { useState } from "react";
import TaskEmptyState from "./TaskEmptyState";
import TaskCard from "./TaskCard";

const TaskList = ({filteredTasks, filter, handleTaskChanged, selectedTasks, setSelectedTasks}) => {

  const handleSelectTask = (taskId, isSelected) => {
    if (isSelected) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  if (!filteredTasks || filteredTasks.length === 0) {
    return <TaskEmptyState filter={filter} />;
  }
  return (
    <div className="space-y-3">
      {filteredTasks.map((task, index) => (
        <TaskCard
        key = {task._id ?? index}
        task={task}
        index={index}
        handleTaskChanged={handleTaskChanged}
        isSelected={selectedTasks.includes(task._id)}
        onSelectChange={(checked) => handleSelectTask(task._id, checked)}
        />
      ) )}
    </div>

  );
};

export default TaskList;
