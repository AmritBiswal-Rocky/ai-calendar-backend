// src/components/TaskForm.jsx
import React from 'react';

const TaskForm = ({ formData, setFormData }) => {
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="form-container">
      <input
        type="text"
        name="description"
        placeholder="Task description"
        value={formData.description || ''}
        onChange={handleChange}
      />
      <input type="date" name="dueDate" value={formData.dueDate || ''} onChange={handleChange} />
      <select name="priority" value={formData.priority || 'Normal'} onChange={handleChange}>
        <option value="Low">Low</option>
        <option value="Normal">Normal</option>
        <option value="High">High</option>
      </select>
    </div>
  );
};

export default TaskForm;
