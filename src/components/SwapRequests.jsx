import React, { useState, useEffect } from 'react';

const SwapRequests = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [ratingForm, setRatingForm] = useState({ rating: 5, feedback: '' });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/swaps/my-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data.swapRequests);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/swaps/${action}/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        fetchRequests();
        alert(`Request ${action}ed successfully!`);
      } else alert(data.message || 'Action failed');
    } catch {
      alert('Network error');
    }
  };

  const handleCancel = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/swaps/cancel/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        fetchRequests();
        alert('Request cancelled successfully!');
      } else alert(data.message || 'Cancel failed');
    } catch {
      alert('Network error');
    }
  };

  const openRatingModal = (req) => {
    setSelectedRequest(req);
    setShowRatingModal(true);
  };

  const submitRating = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const otherUserId =
      selectedRequest.fromUser._id === user._id
        ? selectedRequest.toUser._id
        : selectedRequest.fromUser._id;

    try {
      const res = await fetch('http://localhost:5000/api/ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          swapRequestId: selectedRequest._id,
          toUserId: otherUserId,
          rating: ratingForm.rating,
          feedback: ratingForm.feedback
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowRatingModal(false);
        setSelectedRequest(null);
        setRatingForm({ rating: 5, feedback: '' });
        fetchRequests();
        alert('Rating submitted!');
      } else alert(data.message || 'Failed to submit rating');
    } catch {
      alert('Network error');
    }
  };

  const filteredRequests = requests.filter(
    (r) => activeTab === 'all' || r.status === activeTab
  );

  const badgeStyles = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Swap Requests</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'accepted', 'completed', 'rejected', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Loader */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No {activeTab} requests.</div>
      ) : (
        <div className="space-y-6">
          {filteredRequests.map((req) => (
            <div key={req._id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {req.fromUser._id === user._id ? `To: ${req.toUser.name}` : `From: ${req.fromUser.name}`}
                  </h3>
                  <p className="text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${badgeStyles[req.status]}`}>
                  {req.status}
                </span>
              </div>

              <p className="text-gray-700 mb-3">{req.message}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="text-gray-500 font-semibold mb-1">Skills Offered:</h4>
                  <div className="flex flex-wrap gap-1">
                    {req.skillsOffered.map((skill, i) => (
                      <span key={i} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-gray-500 font-semibold mb-1">Skills Requested:</h4>
                  <div className="flex flex-wrap gap-1">
                    {req.skillsRequested.map((skill, i) => (
                      <span key={i} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {req.status === 'pending' && req.toUser._id === user._id && (
                  <>
                    <button onClick={() => handleAction(req._id, 'accept')} className="btn btn-success">
                      ✅ Accept
                    </button>
                    <button onClick={() => handleAction(req._id, 'reject')} className="btn btn-danger">
                      ❌ Reject
                    </button>
                  </>
                )}
                {req.status === 'pending' && req.fromUser._id === user._id && (
                  <button onClick={() => handleCancel(req._id)} className="btn btn-danger">
                    ❌ Cancel
                  </button>
                )}
                {req.status === 'accepted' && (
                  <button onClick={() => handleAction(req._id, 'complete')} className="btn btn-primary">
                    ✅ Mark Completed
                  </button>
                )}
                {req.status === 'completed' && (
                  <button onClick={() => openRatingModal(req)} className="btn btn-secondary">
                    ✍️ Rate & Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Rate Your Experience</h2>
            <form onSubmit={submitRating}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Rating</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={ratingForm.rating}
                  onChange={(e) => setRatingForm({ ...ratingForm, rating: parseInt(e.target.value) })}
                >
                  {[5, 4, 3, 2, 1].map((val) => (
                    <option key={val} value={val}>
                      {val} - {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][5 - val]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Feedback (optional)</label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows="3"
                  value={ratingForm.feedback}
                  onChange={(e) => setRatingForm({ ...ratingForm, feedback: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapRequests;
