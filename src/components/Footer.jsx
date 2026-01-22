import React from "react";

const Footer = ({ completedTasksCount = 2, activeTasksCount = 3 }) => {
  return (
    <>
      {completedTasksCount + activeTasksCount > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {completedTasksCount > 0 && (
              <>
                {completedTasksCount} công việc đã hoàn thành
                {activeTasksCount > 0 && `, còn ${activeTasksCount} việc nữa `}
              </>
            )}
            {completedTasksCount === 0 && activeTasksCount > 0 && (
              <>Hãy bắt đầu làm {activeTasksCount} nhiệm vụ nào!</>
            )}
          </p>
        </div>
      )}
    </>
  );
};

export default Footer;
