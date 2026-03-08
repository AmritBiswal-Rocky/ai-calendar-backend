// src/components/OutOfOfficeForm.jsx
import React from 'react';

const OutOfOfficeForm = ({ formData, setFormData }) => {
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="form-container">
      <input
        type="text"
        name="reason"
        placeholder="Reason for OOO"
        value={formData.reason || ''}
        onChange={handleChange}
      />
      <input
        type="date"
        name="startDate"
        value={formData.startDate || ''}
        onChange={handleChange}
      />
      <input type="date" name="endDate" value={formData.endDate || ''} onChange={handleChange} />
      <label>
        <input
          type="checkbox"
          name="autoReply"
          checked={formData.autoReply || false}
          onChange={(e) => setFormData({ ...formData, autoReply: e.target.checked })}
        />
        Enable auto-reply
      </label>
    </div>
  );
};

export default OutOfOfficeForm;
