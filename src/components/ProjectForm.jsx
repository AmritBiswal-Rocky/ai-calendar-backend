// src/components/ProjectForm.jsx
import React from 'react';

const ProjectForm = ({ formData, setFormData }) => {
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="form-container">
      <input
        type="text"
        name="projectName"
        placeholder="Project Name"
        value={formData.projectName || ''}
        onChange={handleChange}
      />
      <textarea
        name="description"
        placeholder="Project Description"
        value={formData.description || ''}
        onChange={handleChange}
      />
      <input
        type="color"
        name="color"
        value={formData.color || '#00ff00'}
        onChange={handleChange}
      />
    </div>
  );
};

export default ProjectForm;
