import React, { useState, useEffect } from 'react';

const AdminPanel = ({ user }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      if (activeTab === 'users') {
        const res = await fetch(`http://localhost:5000/api/admin/users?page=${currentPage}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
      }

      if (activeTab === 'swaps') {
        const res = await fetch(`http://localhost:5000/api/admin/swaps?page=${currentPage}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSwapRequests(data.swapRequests || []);
        setTotalPages(data.totalPages || 1);
      }

      if (activeTab === 'stats') {
        const res = await fetch('http://localhost:5000/api/admin/stats/swaps', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, isBanned) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/ban`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isBanned }),
    });

    if (res.ok) {
      fetchData();
      alert(`User ${isBanned ? 'banned' : 'unbanned'} successfully!`);
    } else {
      alert('Failed to update user status');
    }
  };

  const handleDeleteSwap = async (id) => {
    if (!confirm('Delete this swap request?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/admin/swaps/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      fetchData();
      alert('Swap request deleted');
    } else {
      alert('Delete failed');
    }
  };

  const exportData = async (type) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/admin/export/${type}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    let csv = '';
    if (type === 'users') {
      csv = 'Name,Email,Location,Rating,Total Ratings,Skills Offered,Skills Wanted,Is Public,Is Banned,Created At\n';
      data.data.forEach((u) => {
        csv += `"${u.name}","${u.email}","${u.location || ''}","${u.rating}","${u.totalRatings}","${u.skillsOffered?.join(';') || ''}","${u.skillsWanted?.join(';') || ''}","${u.isPublic}","${u.isBanned}","${u.createdAt}"\n`;
      });
    } else {
      csv = 'From User,To User,Message,Skills Offered,Skills Requested,Status,Created At\n';
      data.data.forEach((s) => {
        csv += `"${s.fromUser?.name}","${s.toUser?.name}","${s.message}","${s.skillsOffered?.join(';')}","${s.skillsRequested?.join(';')}","${s.status}","${s.createdAt}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">⚙️ Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['users', 'swaps', 'stats'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-md font-medium transition ${
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'users' && (
        <>
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">User Management</h2>
            <button onClick={() => exportData('users')} className="btn btn-secondary">
              📤 Export Users
            </button>
          </div>

          <div className="space-y-4">
            {users.map((u) => (
              <div key={u._id} className="bg-white shadow-sm p-4 rounded-xl border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{u.name}</h3>
                    <p className="text-sm text-gray-600">{u.email}</p>
                    <p className="text-sm text-gray-600">Rating: {u.rating}/5 ({u.totalRatings})</p>
                    <p className="text-sm text-gray-600">Location: {u.location || 'N/A'}</p>
                  </div>
                  <div>
                    <button
                      className={`px-4 py-2 text-sm rounded ${
                        u.isBanned
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                      onClick={() => handleBanUser(u._id, !u.isBanned)}
                    >
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'swaps' && (
        <>
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Swap Requests</h2>
            <button onClick={() => exportData('swaps')} className="btn btn-secondary">
              📤 Export Swaps
            </button>
          </div>

          <div className="space-y-4">
            {swapRequests.map((s) => (
              <div key={s._id} className="bg-white shadow-sm p-4 rounded-xl border">
                <div className="flex justify-between mb-2">
                  <div>
                    <p className="font-semibold">{s.fromUser?.name} → {s.toUser?.name}</p>
                    <p className="text-sm text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteSwap(s._id)}
                    className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-gray-800">{s.message}</p>
                <div className="mt-2 flex gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Skills Offered:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.skillsOffered?.map((sk, i) => (
                        <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Skills Requested:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.skillsRequested?.map((sk, i) => (
                        <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'stats' && (
        <>
          <h2 className="text-xl font-semibold mb-4">📊 Platform Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded-xl shadow border">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow border">
              <p className="text-sm text-gray-600">Total Ratings</p>
              <p className="text-2xl font-bold">{stats.totalRatings || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow border">
              <p className="text-sm text-gray-600">Total Swaps</p>
              <p className="text-2xl font-bold">
                {stats.swapStats?.reduce((sum, s) => sum + s.count, 0) || 0}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow border">
            <p className="text-sm font-medium mb-3">Swap Status Breakdown</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {stats.swapStats?.map((s) => (
                <div key={s._id} className="text-center">
                  <p className="text-lg font-semibold">{s.count}</p>
                  <p className="text-xs capitalize text-gray-500">{s._id}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
