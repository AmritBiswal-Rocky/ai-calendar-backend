// src/components/WorkingLocationForm.jsx
import React from 'react';

const WorkingLocationForm = ({ formData, setFormData }) => {
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="form-container">
      <input
        type="text"
        name="locationName"
        placeholder="Location Name"
        value={formData.locationName || ''}
        onChange={handleChange}
      />
      <input
        type="text"
        name="address"
        placeholder="Address"
        value={formData.address || ''}
        onChange={handleChange}
      />
      <input
        type="time"
        name="startTime"
        value={formData.startTime || ''}
        onChange={handleChange}
      />
      <input type="time" name="endTime" value={formData.endTime || ''} onChange={handleChange} />
    </div>
  );
};

export default WorkingLocationForm;
