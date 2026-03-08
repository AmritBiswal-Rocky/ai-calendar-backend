import React from 'react';

const EventForm = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="form-container">
      <input
        type="text"
        name="description"
        placeholder="Event description"
        value={formData.description || ''}
        onChange={handleChange}
      />
      <input
        type="text"
        name="location"
        placeholder="Location"
        value={formData.location || ''}
        onChange={handleChange}
      />
      <input
        type="color"
        name="color"
        value={formData.color || '#ff0000'}
        onChange={handleChange}
      />
      {/* Add more Event-specific fields here */}
    </div>
  );
};

export default EventForm;
