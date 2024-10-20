import React, { useState, useEffect } from 'react';
import './TodoList.css';

const getStartOfWeek = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day;
  return new Date(start.setDate(diff));
};

const getEndOfWeek = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() + (6 - day);
  return new Date(start.setDate(diff));
};

const TodoList = ({ token }) => {
  const [tasks, setTasks] = useState({});
  const [newTask, setNewTask] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [taskDeadline, setTaskDeadline] = useState(new Date(new Date().setHours(0,0,0,0)).toISOString().split('T')[0]);
  const [selectedTask, setSelectedTask] = useState({ deadline: null, index: null });
  const [editTask, setEditTask] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [descriptionContent, setDescriptionContent] = useState('');
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(getStartOfWeek(new Date(new Date().setHours(0,0,0,0))));
  const [currentDate, setCurrentDate] = useState(new Date(new Date().setHours(0,0,0,0)));
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().setHours(0,0,0,0)));

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      const formattedTasks = data.reduce((acc, task) => {
        if (!acc[task.deadline_date]) acc[task.deadline_date] = [];
        acc[task.deadline_date].push({
          text: task.task_name,
          completed: task.status === 'completed',
          task_id: task.task_id,
          user_id: task.user_id,
          description: task.description
        });
        return acc;
      }, {});
      setTasks(formattedTasks);
    } catch (error) {
      console.error(error);
      alert('Failed to load tasks.');
    }
  };

  const addTask = async () => {
    if (newTask.trim()) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: newTask,
            deadline_date: taskDeadline,
            description: newDescription,
            status: 'pending',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create task');
        }

        await fetchTasks();
        closeAddDialog();
      } catch (error) {
        console.error(error);
        alert('Failed to add task.');
      }
    }
  };

  const updateTask = async () => {
    if (selectedTask.deadline !== null && selectedTask.index !== null) {
      const originalDeadline = selectedTask.deadline;
      const taskId = tasks[originalDeadline][selectedTask.index].task_id;

      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: editTask,
            deadline_date: editDeadline,
            description: editDescription,
            status: tasks[originalDeadline][selectedTask.index].completed ? 'completed' : 'pending',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update task');
        }

        await fetchTasks();
        closeEditDialog();
      } catch (error) {
        console.error(error);
        alert('Failed to update task.');
      }
    }
  };

  const deleteTask = async () => {
    if (selectedTask.deadline !== null && selectedTask.index !== null) {
      const taskId = tasks[selectedTask.deadline][selectedTask.index].task_id;

      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete task');
        }

        await fetchTasks();
        setSelectedTask({ deadline: null, index: null });
      } catch (error) {
        console.error(error);
        alert(`Failed to delete task: ${error.message}`);
      }
    }
  };

  const toggleCompletion = (deadline, index) => {
    const updatedTasks = { ...tasks };
    updatedTasks[deadline][index].completed = !updatedTasks[deadline][index].completed;
    setTasks(updatedTasks);
  };

  const selectTask = (deadline, index) => {
    setSelectedTask({ deadline, index });
  };

  const getFormattedDate = (date) => date.toISOString().split('T')[0];

  const checkActiveWeek = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return getEndOfWeek(currentWeek) >= date && currentWeek <= date;
  };

  const changeWeek = (offset) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + offset * 7);
    setCurrentWeek(getStartOfWeek(newDate));
    setCurrentMonth(getStartOfWeek(newDate));
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  const handleDateClick = (date) => {
    setCurrentDate(date);
    setCurrentWeek(getStartOfWeek(new Date(date)));
  };
  const toggleDescriptionDialog = (description) => {
    setDescriptionContent(description);
    setIsDescriptionOpen(true);
  };

  const renderCalendar = () => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      calendarDays.push(
        <div
          key={day}
          className={`calendar-day ${checkActiveWeek(day) ? "active" : ""}`}
          onClick={() => handleDateClick(date)}
        >
          {day}
        </div>
      );
    }

    return (
      <div className="calendar-month">
        <div className="calendar-header">
          <button className="button" onClick={() => changeMonth(-1)}>&lt;</button>
          <span>{currentMonth.toLocaleString('default', { month: 'long' })} {year}</span>
          <button className="button" onClick={() => changeMonth(1)}>&gt;</button>
        </div>
        <div className="calendar-grid">
          {calendarDays}
        </div>
      </div>
    );
  };
  const renderWeekTasks = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(currentWeek);
      currentDate.setDate(currentDate.getDate() + i);
      const formattedDate = currentDate.toISOString().split('T')[0];
      days.push(
        <div key={formattedDate} className="task-card">
          <h3>{formattedDate}</h3>
          <ul>
            {(tasks[formattedDate] || []).map((task, index) => (
              <li
                key={index}
                className={`task-item ${task.completed ? 'completed' : ''} ${selectedTask.deadline === formattedDate && selectedTask.index === index ? 'selected' : ''}`}
                onClick={() => selectTask(formattedDate, index)}
              >
                <div className="task-header">
                  <span onClick={() => toggleCompletion(formattedDate, index)}>{task.text}</span>
                  <button className="description-icon" onClick={() => toggleDescriptionDialog(task.description)}>
                    <i className="fas fa-eye"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return days;
  };
   

  const openAddDialog = () => setIsDialogOpen(true);

  const closeAddDialog = () => {
    setIsDialogOpen(false);
    setNewTask('');
    setNewDescription('');
    setTaskDeadline(new Date().toISOString().split('T')[0]);
  };

  const openEditDialog = () => {
    if (selectedTask.deadline !==     null && selectedTask.index !== null) {
      const task = tasks[selectedTask.deadline][selectedTask.index];
      setEditTask(task.text);
      setEditDescription(task.description);
      setEditDeadline(selectedTask.deadline);
      setIsEditDialogOpen(true);
    }
  };

  const closeEditDialog = () => {
    setEditTask('');
    setEditDescription('');
    setIsEditDialogOpen(false);
  };

  return (
    <div className="todo-container">
      <div className="calendar">
        {renderCalendar()}
      </div>
      <div className="todo-list">
        <div className="header">
          <div className="week-navigation">
            <button className="button" onClick={() => changeWeek(-1)}>Previous</button>
            <button className="button" onClick={() => changeWeek(1)}>Next</button>
          </div>
          <h2 style={{ textAlign: 'center', flex: 1 }}>To-Do List</h2>
          <div className="button-group">
            <button className="button" onClick={openAddDialog}>Add Task</button>
            <button className="button" onClick={openEditDialog} disabled={selectedTask.deadline === null}>Edit Task</button>
            <button className="button" onClick={deleteTask} disabled={selectedTask.deadline === null}>Delete Task</button>
          </div>
        </div>
        <div className="task-sections">
          {renderWeekTasks()}
        </div>

        {isDialogOpen && (
          <div className="dialog">
            <div className="dialog-content">
              <h3>Add Task</h3>
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Task name"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Task description"
              />
              <input
                type="date"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
              />
              <button className="button add-task-button" onClick={addTask}>Add</button>
              <button className="button add-task-button" onClick={closeAddDialog}>Cancel</button>
            </div>
          </div>
        )}

        {isEditDialogOpen && (
          <div className="dialog">
            <div className="dialog-content">
              <h3>Edit Task</h3>
              <input
                type="text"
                value={editTask}
                onChange={(e) => setEditTask(e.target.value)}
                placeholder="Task name"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Task description"
              />
              <input
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
              />
              <button className="button edit-task-button" onClick={updateTask}>Update</button>
              <button className="button edit-task-button" onClick={closeEditDialog}>Cancel</button>
            </div>
          </div>
        )}

        {isDescriptionOpen && (
          <div className="dialog">
            <div className="dialog-content">
              <h3>Task Description</h3>
              <p>{descriptionContent}</p>
              <button className="button" onClick={() => setIsDescriptionOpen(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;