import { createFileRoute } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { queueQuery } from '@/lib/queryQueue';
import {
  Search,
  Filter,
  Mail,
  Edit,
  Trash2,
  X,
  Users,
  ChevronDown,
  AlertCircle,
  Loader2,
  Crown,
  Briefcase,
  Calendar,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import { TablePageSkeleton } from '@/components/admin/SkeletonLoader';
import { toast } from 'sonner';
import { DeleteConfirmation } from '@/components/admin/DeleteConfirmation';

export const Route = createFileRoute('/admin/team')({
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <TeamPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

interface AdminUserWithEmail {
  user_id: string;
  role: 'owner' | 'editor';
  added_at: string;
  added_by: string | null;
  email?: string;
  created_at?: string;
}

type FilterRole = 'all' | 'owner' | 'editor';

function TeamPage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<AdminUserWithEmail[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<AdminUserWithEmail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<FilterRole>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AdminUserWithEmail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<AdminUserWithEmail | null>(null);

  // Form state for editing
  const [editRole, setEditRole] = useState<'owner' | 'editor'>('editor');

  useEffect(() => {
    const loadData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
      try {
        await loadTeamMembers();
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let filtered = teamMembers;

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter((member) => member.role === filterRole);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.email?.toLowerCase().includes(query) ||
          member.role.toLowerCase().includes(query) ||
          member.user_id.toLowerCase().includes(query)
      );
    }

    setFilteredMembers(filtered);
  }, [teamMembers, searchQuery, filterRole]);

  const loadTeamMembers = async () => {
    try {
      setLoadError(false);
      
      const data = await queueQuery(async () => {
        // Get admin users
        const { data: adminUsers, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .order('added_at', { ascending: false });

        if (adminError) throw adminError;

        // For each admin user, try to get their email using a direct query to auth.users
        // Note: This requires the RLS policy to allow reading from auth.users
        const usersWithEmail: AdminUserWithEmail[] = [];
        
        for (const admin of adminUsers || []) {
          // Use Supabase's built-in auth.users view if available
          // Otherwise, email will show as "Not available"
          const { data: userData } = await supabase
            .from('users')
            .select('email, created_at')
            .eq('id', admin.user_id)
            .single()
            .then(res => res)
            .catch(() => ({ data: null }));
          
          usersWithEmail.push({
            ...admin,
            email: userData?.email || 'Email not available',
            created_at: userData?.created_at,
          });
        }

        return usersWithEmail;
      });

      setTeamMembers(data);
    } catch (error) {
      console.error('Error loading team members:', error);
      setLoadError(true);
      toast.error('Failed to load team members');
    }
  };

  const handleEditClick = (member: AdminUserWithEmail) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setShowEditModal(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedMember || !adminUser) return;

    // Prevent self-demotion
    if (selectedMember.user_id === adminUser.user_id && editRole !== 'owner') {
      toast.error('You cannot demote yourself from owner role');
      return;
    }

    // Prevent changing role if user is not owner
    if (adminUser.role !== 'owner') {
      toast.error('Only owners can change team member roles');
      return;
    }

    setIsSubmitting(true);

    try {
      await queueQuery(async () => {
        const { error } = await supabase
          .from('admin_users')
          .update({ role: editRole })
          .eq('user_id', selectedMember.user_id);

        if (error) throw error;
      });

      toast.success('Team member role updated successfully');
      setShowEditModal(false);
      setSelectedMember(null);
      await loadTeamMembers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (member: AdminUserWithEmail) => {
    setMemberToDelete(member);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete || !adminUser) return;

    // Prevent self-deletion
    if (memberToDelete.user_id === adminUser.user_id) {
      toast.error('You cannot remove yourself from the team');
      setShowDeleteConfirm(false);
      return;
    }

    // Only owners can delete
    if (adminUser.role !== 'owner') {
      toast.error('Only owners can remove team members');
      setShowDeleteConfirm(false);
      return;
    }

    try {
      await queueQuery(async () => {
        const { error } = await supabase
          .from('admin_users')
          .delete()
          .eq('user_id', memberToDelete.user_id);

        if (error) throw error;
      });

      toast.success('Team member removed successfully');
      setShowDeleteConfirm(false);
      setMemberToDelete(null);
      await loadTeamMembers();
    } catch (error: any) {
      console.error('Error removing team member:', error);
      toast.error(error.message || 'Failed to remove team member');
    }
  };

  const getRoleBadge = (role: 'owner' | 'editor') => {
    if (role === 'owner') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 dark:bg-purple-900/30 px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-400">
          <Crown className="h-3 w-3" />
          Owner
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
          <Briefcase className="h-3 w-3" />
          Staff
        </span>
    );
  };

  // Calculate stats
  const totalMembers = teamMembers.length;
  const ownerCount = teamMembers.filter((m) => m.role === 'owner').length;
  const staffCount = teamMembers.filter((m) => m.role === 'editor').length;

  if (initialLoading) {
    return (
      <AdminLayout adminUser={adminUser}>
        <TablePageSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage team members and their access
            </p>
          </div>

          {adminUser?.role === 'owner' && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium">Adding New Team Members</p>
                  <p className="mt-1 text-blue-700 dark:text-blue-300">
                    New team members must first be created in Supabase Dashboard (Authentication → Users).
                    After creating the user account, manually add their user_id to the admin_users table with the desired role.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Total Members */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Total Members
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{totalMembers}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Owners */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Owners
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{ownerCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Staff */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Staff
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{staffCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as FilterRole)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="owner">Owner</option>
                  <option value="editor">Staff</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {loadError && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600 dark:text-red-400" />
            <h3 className="mt-4 text-lg font-bold text-red-900 dark:text-red-100">
              Failed to Load Team Members
            </h3>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              There was an error loading the team member data. Please try again.
            </p>
            <button
              onClick={() => {
                setLoadError(false);
                loadTeamMembers();
              }}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Team Members Table */}
        {!loadError && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300">
                      Email
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300">
                      Role
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300">
                      Date Added
                    </th>
                    {adminUser?.role === 'owner' && (
                      <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 text-right">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                          No team members found
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {searchQuery || filterRole !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Team members will appear here once added'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr
                        key={member.user_id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {member.email}
                              </div>
                              {member.user_id === adminUser?.user_id && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">(You)</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getRoleBadge(member.role)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(member.added_at), 'MMM d, yyyy')}
                          </div>
                        </td>
                        {adminUser?.role === 'owner' && (
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditClick(member)}
                                disabled={member.user_id === adminUser?.user_id && member.role === 'owner'}
                                className="rounded-lg p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Edit role"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(member)}
                                disabled={member.user_id === adminUser?.user_id}
                                className="rounded-lg p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Remove from team"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Role Modal */}
        {showEditModal && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Team Member Role</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMember(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedMember.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'owner' | 'editor')}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="owner">Owner (Full Access)</option>
                    <option value="editor">Staff (Limited Access)</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Owners have full access including financial data and team management. Staff can manage clients, quotes, and enquiries.
                  </p>
                </div>

                {selectedMember.user_id === adminUser?.user_id && editRole !== 'owner' && (
                  <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      <strong>Warning:</strong> You cannot demote yourself from owner role.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 p-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMember(null);
                  }}
                  disabled={isSubmitting}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRole}
                  disabled={isSubmitting || (selectedMember.user_id === adminUser?.user_id && editRole !== 'owner')}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Role'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && memberToDelete && (
          <DeleteConfirmation
            title="Remove Team Member"
            message={`Are you sure you want to remove ${memberToDelete.email} from the team? This will revoke their admin access immediately.`}
            confirmText="Remove Member"
            onConfirm={handleDeleteConfirm}
            onCancel={() => {
              setShowDeleteConfirm(false);
              setMemberToDelete(null);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
