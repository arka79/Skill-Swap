import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    pendingRequests: 0,
    acceptedRequests: 0,
    completedSwaps: 0,
    totalRating: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/swaps/my-requests', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const requests = data.swapRequests;

        const pending = requests.filter(r => r.status === 'pending').length;
        const accepted = requests.filter(r => r.status === 'accepted').length;
        const completed = requests.filter(r => r.status === 'completed').length;

        setStats({
          pendingRequests: pending,
          acceptedRequests: accepted,
          completedSwaps: completed,
          totalRating: user.rating || 0
        });

        setRecentRequests(requests.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8">
        Welcome back, {user.name} 👋
      </h1>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Pending', value: stats.pendingRequests, bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⏳' },
          { label: 'Accepted', value: stats.acceptedRequests, bg: 'bg-blue-100', text: 'text-blue-700', icon: '✅' },
          { label: 'Completed', value: stats.completedSwaps, bg: 'bg-green-100', text: 'text-green-700', icon: '🏁' },
          { label: 'Rating', value: stats.totalRating > 0 ? `${stats.totalRating}/5` : 'No ratings', bg: 'bg-purple-100', text: 'text-purple-700', icon: '⭐' }
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-xl shadow-md ${stat.bg} ${stat.text}`}>
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{stat.icon}</div>
              <div>
                <p className="text-sm font-medium">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Summary */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">👤 Profile Summary</h2>
          <div className="space-y-2 text-gray-700 text-sm">
            <p><strong>Name:</strong> {user.name}</p>
            {user.location && <p><strong>Location:</strong> {user.location}</p>}
            <p><strong>Skills Offered:</strong> {user.skillsOffered?.length || 0}</p>
            <p><strong>Skills Wanted:</strong> {user.skillsWanted?.length || 0}</p>
            <p>
              <strong>Status:</strong>{' '}
              <span className={user.isPublic ? 'text-green-600' : 'text-red-600'}>
                {user.isPublic ? 'Public' : 'Private'}
              </span>
            </p>
          </div>
          <Link
            to="/profile"
            className="mt-5 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            ✏️ Edit Profile
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📜 Recent Activity</h2>
          {recentRequests.length > 0 ? (
            <ul className="space-y-4">
              {recentRequests.map((req) => (
                <li key={req._id} className="border-b pb-3 border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        {req.fromUser._id === user._id
                          ? `To: ${req.toUser.name}`
                          : `From: ${req.fromUser.name}`}
                      </p>
                      <p className="text-xs text-gray-500">{req.message}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${getBadgeStyle(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 text-sm">No recent activity found.</p>
          )}
          <Link
            to="/requests"
            className="mt-5 inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
          >
            🔍 View All Requests
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">⚡ Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/discover" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium">
            🌐 Discover Skills
          </Link>
          <Link to="/profile" className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium">
            🔧 Update Profile
          </Link>
          <Link to="/requests" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">
            📬 View Requests
          </Link>
        </div>
      </div>
    </div>
  );
};

// Helper to style status badges
const getBadgeStyle = (status) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-red-100 text-red-700'
  };
  return map[status] || 'bg-gray-200 text-gray-600';
};

export default Dashboard;
