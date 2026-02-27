import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MoreHorizontal, Shield, UserX, UserCheck } from 'lucide-react';
import { api } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      toast.success('User role updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleSuspend = async (userId, suspend) => {
    try {
      await api.suspendUser(userId, suspend, 'Violation of terms');
      toast.success(suspend ? 'User suspended' : 'User unsuspended');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || user.role === filter;
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage user accounts and permissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="reviewer">Reviewer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500 dark:text-slate-400">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Role</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-medium">
                        {user.firstName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 border-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="user">User</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      user.isSuspended
                        ? 'bg-red-100 text-red-700'
                        : user.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.isSuspended ? (
                        <><UserX className="w-3 h-3" /> Suspended</>
                      ) : user.isActive ? (
                        <><UserCheck className="w-3 h-3" /> Active</>
                      ) : (
                        'Inactive'
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleSuspend(user._id, !user.isSuspended)}
                      className={`p-2 rounded-lg transition-colors ${
                        user.isSuspended
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      {user.isSuspended ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
