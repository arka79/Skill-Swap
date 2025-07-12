import React, { useState, useEffect } from 'react';

const Discover = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [swapForm, setSwapForm] = useState({
    message: '',
    skillsOffered: [],
    skillsRequested: []
  });

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, selectedSkill]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/users/discover';
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedSkill) params.append('skill', selectedSkill);
      if (params.toString()) url += `?${params.toString()}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapRequest = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/swaps/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toUserId: selectedUser._id,
          message: swapForm.message,
          skillsOffered: swapForm.skillsOffered,
          skillsRequested: swapForm.skillsRequested
        })
      });

      const data = await response.json();
      if (response.ok) {
        setShowSwapModal(false);
        setSelectedUser(null);
        setSwapForm({ message: '', skillsOffered: [], skillsRequested: [] });
        alert('Swap request sent successfully!');
      } else {
        alert(data.message || 'Failed to send swap request');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const openSwapModal = (user) => {
    setSelectedUser(user);
    setShowSwapModal(true);
  };

  const addSkillToForm = (skill, type) => {
    setSwapForm(prev => ({
      ...prev,
      [type]: [...new Set([...prev[type], skill])]
    }));
  };

  const removeSkillFromForm = (skill, type) => {
    setSwapForm(prev => ({
      ...prev,
      [type]: prev[type].filter(s => s !== skill)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500 border-solid"></div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-10 py-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">🔍 Discover Talents</h1>

      {/* Filters */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔎 Search by name or skill..."
          className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          placeholder="🎯 Filter by specific skill..."
          className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Users */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <div
            key={u._id}
            className="bg-white rounded-xl shadow-md p-5 transition transform hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{u.name}</h2>
                <p className="text-sm text-gray-500">{u.location || '🌐 Remote'}</p>
              </div>
              <div className="text-right text-sm text-gray-700">
                ⭐ {u.rating > 0 ? `${u.rating}/5` : 'No ratings'}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-1"><strong>Availability:</strong> {u.availability || 'Not specified'}</p>

            <div className="mb-2">
              <h4 className="text-sm font-medium text-gray-700 mb-1">✅ Skills Offered</h4>
              <div className="flex flex-wrap gap-1">
                {u.skillsOffered?.slice(0, 3).map((skill, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{skill}</span>
                ))}
                {u.skillsOffered?.length > 3 && (
                  <span className="text-xs text-gray-500">+{u.skillsOffered.length - 3} more</span>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-1">🎯 Skills Wanted</h4>
              <div className="flex flex-wrap gap-1">
                {u.skillsWanted?.slice(0, 3).map((skill, idx) => (
                  <span key={idx} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">{skill}</span>
                ))}
                {u.skillsWanted?.length > 3 && (
                  <span className="text-xs text-gray-500">+{u.skillsWanted.length - 3} more</span>
                )}
              </div>
            </div>

            <button
              onClick={() => openSwapModal(u)}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              🤝 Send Swap Request
            </button>
          </div>
        ))}
      </div>

      {/* No Users */}
      {users.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          😕 No users found matching your criteria.
        </div>
      )}

      {/* Swap Modal */}
      {showSwapModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Swap with {selectedUser.name}</h2>
            <form onSubmit={handleSwapRequest}>
              <textarea
                value={swapForm.message}
                onChange={(e) => setSwapForm({ ...swapForm, message: e.target.value })}
                className="w-full p-3 border rounded mb-4 resize-none"
                placeholder="Write a message..."
                rows={4}
                required
              />

              <div className="mb-4">
                <label className="font-medium text-sm mb-2 block">Your Offered Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {user.skillsOffered?.map((skill) => (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => addSkillToForm(skill, 'skillsOffered')}
                      className={`px-2 py-1 text-xs rounded ${swapForm.skillsOffered.includes(skill)
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {swapForm.skillsOffered.map(skill => (
                    <span key={skill} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                      {skill}
                      <button type="button" onClick={() => removeSkillFromForm(skill, 'skillsOffered')} className="ml-1 text-blue-500 hover:text-blue-700">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="font-medium text-sm mb-2 block">Skills You Want</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedUser.skillsOffered?.map((skill) => (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => addSkillToForm(skill, 'skillsRequested')}
                      className={`px-2 py-1 text-xs rounded ${swapForm.skillsRequested.includes(skill)
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {swapForm.skillsRequested.map(skill => (
                    <span key={skill} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                      {skill}
                      <button type="button" onClick={() => removeSkillFromForm(skill, 'skillsRequested')} className="ml-1 text-green-500 hover:text-green-700">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Send</button>
                <button type="button" onClick={() => setShowSwapModal(false)} className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Discover;
