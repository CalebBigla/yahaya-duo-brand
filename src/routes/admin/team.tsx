import { createFileRoute, redirect } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/lib/theme';
import { ComingSoon } from '@/components/admin/ComingSoon';
import { checkAdminAccess } from '@/lib/auth';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/admin/team')({
  beforeLoad: async ({ location }) => {
    const result = await checkAdminAccess();
    if (!result.isAdmin) {
      throw redirect({ to: '/admin/login', search: { redirect: location.href } });
    }
  },
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <TeamPage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

function TeamPage() {
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const loadAdminData = async () => {
      const { user } = await checkAdminAccess();
      setAdminUser(user);
    };

    loadAdminData();
  }, []);

  return (
    <AdminLayout adminUser={adminUser}>
      <ComingSoon
        moduleName="Team & Permissions"
        description="Manage admin users, assign roles (Owner/Staff), and control access permissions for your team members."
        estimatedDate="Future Update"
      />
    </AdminLayout>
  );
}

/* ============================================================================
 * TEAM MODULE IMPLEMENTATION (COMMENTED OUT FOR FUTURE USE)
 * ============================================================================
 * The full team management module is implemented below but commented out.
 * To enable it, uncomment the code below and comment out the ComingSoon component above.
 * 
 * Features included:
 * - Team member listing with email and role
 * - Role management (Owner/Staff)
 * - Member removal with confirmation
 * - Search and filtering
 * - Permission enforcement (owner-only operations)
 * - Self-protection (cannot remove/demote yourself)
 * 
 * Note: Adding new team members requires manual setup via Supabase Dashboard:
 * 1. Create user in Authentication → Users
 * 2. Insert record into admin_users table with desired role
 * ============================================================================

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

        // For each admin user, try to get their email
        const usersWithEmail: AdminUserWithEmail[] = [];
        
        for (const admin of adminUsers || []) {
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

    if (selectedMember.user_id === adminUser.user_id && editRole !== 'owner') {
      toast.error('You cannot demote yourself from owner role');
      return;
    }

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

    if (memberToDelete.user_id === adminUser.user_id) {
      toast.error('You cannot remove yourself from the team');
      setShowDeleteConfirm(false);
      return;
    }

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
        {/* Header *\/}
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
                    New team members must first be created in Supabase Dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rest of the Team module UI would be here *\/}
      </div>
    </AdminLayout>
  );
}

*/