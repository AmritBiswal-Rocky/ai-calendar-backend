// src/components/LeadForm.jsx
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const LeadForm = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/lead', form);
      toast.success('Thanks! We’ll contact you soon.');
      setForm({ name: '', email: '', phone: '' });
    } catch (err) {
      toast.error('Something went wrong. Try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Name"
        className="w-full p-2 border rounded-lg"
        required
      />
      <input
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        type="email"
        className="w-full p-2 border rounded-lg"
        required
      />
      <input
        name="phone"
        value={form.phone}
        onChange={handleChange}
        placeholder="Phone"
        className="w-full p-2 border rounded-lg"
        required
      />
      <button type="submit" className="bg-blue-600 text-white w-full p-2 rounded-lg">
        Submit
      </button>
    </form>
  );
};

export default LeadForm;
