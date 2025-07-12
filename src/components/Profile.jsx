import React, { useState } from 'react';

const Profile = ({ user, setUser }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    location: user.location || '',
    availability: user.availability || '',
    isPublic: user.isPublic !== undefined ? user.isPublic : true
  });

  const [newSkillOffered, setNewSkillOffered] = useState('');
  const [newSkillWanted, setNewSkillWanted] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setMessage('✅ Profile updated successfully!');
      } else {
        setMessage(data.message || '❌ Failed to update profile');
      }
    } catch (error) {
      setMessage('⚠️ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async (type) => {
    const skill = (type === 'offered' ? newSkillOffered : newSkillWanted).trim();
    if (!skill) return;

    const endpoint = `http://localhost:5000/api/users/skills/${type}`;
    const setSkill = type === 'offered' ? setNewSkillOffered : setNewSkillWanted;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skill })
      });

      const data = await response.json();

      if (response.ok) {
        setUser({ ...user, [`skills${type === 'offered' ? 'Offered' : 'Wanted'}`]: data[`skills${type === 'offered' ? 'Offered' : 'Wanted'}`] });
        setSkill('');
        setMessage('✅ Skill added successfully!');
      } else {
        setMessage(data.message || '❌ Failed to add skill');
      }
    } catch (error) {
      setMessage('⚠️ Network error. Please try again.');
    }
  };

  const removeSkill = async (skill, type) => {
    const endpoint = `http://localhost:5000/api/users/skills/${type}/${encodeURIComponent(skill)}`;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setUser({ ...user, [`skills${type === 'offered' ? 'Offered' : 'Wanted'}`]: data[`skills${type === 'offered' ? 'Offered' : 'Wanted'}`] });
        setMessage('✅ Skill removed successfully!');
      } else {
        setMessage(data.message || '❌ Failed to remove skill');
      }
    } catch (error) {
      setMessage('⚠️ Network error. Please try again.');
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">👤 Profile Settings</h1>

      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
            message.includes('✅')
              ? 'bg-green-100 border border-green-300 text-green-800'
              : 'bg-red-100 border border-red-300 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left - Basic Info */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">📋 Basic Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location (optional)</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Bengaluru, India"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Availability (optional)</label>
              <input
                type="text"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                placeholder="e.g., Weekends, Evenings"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Make profile public</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Right - Skills */}
        <div className="space-y-6">
          {/* Skills Offered */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">🎁 Skills You Offer</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSkillOffered}
                onChange={(e) => setNewSkillOffered(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('offered'))}
                placeholder="Add a skill to teach"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={() => addSkill('offered')}
                className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.skillsOffered?.map((skill, index) => (
                <div key={index} className="flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                  <span>{skill}</span>
                  <button
                    onClick={() => removeSkill(skill, 'offered')}
                    className="ml-2 text-indigo-600 hover:text-red-600 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Wanted */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">🎯 Skills You Want</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSkillWanted}
                onChange={(e) => setNewSkillWanted(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('wanted'))}
                placeholder="Add a skill to learn"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={() => addSkill('wanted')}
                className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.skillsWanted?.map((skill, index) => (
                <div key={index} className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  <span>{skill}</span>
                  <button
                    onClick={() => removeSkill(skill, 'wanted')}
                    className="ml-2 text-green-600 hover:text-red-600 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
