'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Heading, Text, Table, Button, Input, Flex, Badge, IconButton,
  Dialog, Portal, Spinner, CloseButton, VStack, HStack,
} from '@chakra-ui/react';
import { FiSearch, FiXCircle, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import { authorizedApiClient } from '@/utils';
import { toaster } from '@/components/ui/toaster';

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  userRole: string;
  isActive: boolean;
  banType: string | null;
  banReason: string | null;
  bannedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  _count?: {
    orders: number;
    products: number;
    expenses: number;
  };
  totalRevenue?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banType, setBanType] = useState('Temporary');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('7');
  const [banning, setBanning] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await authorizedApiClient.get('/api/admin/users', { params });
      setUsers(res.data.data.items);
    } catch {
      toaster.create({ type: 'error', title: 'Failed to load users', closable: true });
    }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleBan = async () => {
    if (!selectedUser) return;
    setBanning(true);
    try {
      await authorizedApiClient.patch(`/api/admin/users/${selectedUser.id}`, {
        action: 'ban',
        banType,
        banReason,
        banDurationDays: banType === 'Temporary' ? Number(banDuration) : undefined,
      });
      toaster.create({ type: 'success', title: 'User Banned', description: `${selectedUser.email || selectedUser.id} has been banned`, closable: true });
      setBanDialogOpen(false);
      setSelectedUser(null);
      setBanReason('');
      fetchUsers();
    } catch (err: any) {
      toaster.create({ type: 'error', title: 'Failed to ban user', description: err?.response?.data?.error || 'Unknown error', closable: true });
    }
    setBanning(false);
  };

  const handleUnban = async (user: User) => {
    try {
      await authorizedApiClient.patch(`/api/admin/users/${user.id}`, { action: 'unban' });
      toaster.create({ type: 'success', title: 'User Unbanned', description: `${user.email || user.id} has been reactivated`, closable: true });
      fetchUsers();
    } catch (err: any) {
      toaster.create({ type: 'error', title: 'Failed to unban user', description: err?.response?.data?.error || 'Unknown error', closable: true });
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to permanently delete ${user.email || user.id}? This cannot be undone.`)) return;
    try {
      await authorizedApiClient.delete(`/api/admin/users/${user.id}`);
      toaster.create({ type: 'success', title: 'User Deleted', closable: true });
      fetchUsers();
    } catch (err: any) {
      toaster.create({ type: 'error', title: 'Failed to delete user', description: err?.response?.data?.error || 'Unknown error', closable: true });
    }
  };

  return (
    <Box>
      <Heading fontSize="2xl" fontWeight="bold" mb={2}>User Management</Heading>
      <Text color="gray.600" mb={6}>Manage all registered users</Text>

      <Flex gap={4} mb={6} wrap="wrap">
        <Box position="relative" flex="1" minW="250px">
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            pl={10}
          />
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0' }} />
        </Box>
        <Box>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', height: '40px' }}
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </Box>
      </Flex>

      {loading ? (
        <Flex justify="center" py={20}><Spinner size="xl" color="blue.600" /></Flex>
      ) : users.length === 0 ? (
        <Text color="gray.500" textAlign="center" py={20}>No users found</Text>
      ) : (
        <Box bg="white" rounded="xl" shadow="sm" borderWidth="1px" overflow="hidden">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>User</Table.ColumnHeader>
                <Table.ColumnHeader>Role</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Orders</Table.ColumnHeader>
                <Table.ColumnHeader>Joined</Table.ColumnHeader>
                <Table.ColumnHeader>Last Login</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell>
                    <Box>
                      <Text fontWeight="medium" fontSize="sm">{user.email || 'No email'}</Text>
                      <Text fontSize="xs" color="gray.500">{user.phone || user.id.slice(0, 12) + '...'}</Text>
                    </Box>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette={user.userRole === 'Admin' ? 'purple' : 'blue'} size="sm">
                      {user.userRole}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette={user.isActive ? 'green' : 'red'} size="sm">
                      {user.isActive ? 'Active' : `Banned (${user.banType || 'Unknown'})`}
                    </Badge>
                    {!user.isActive && user.banReason && (
                      <Text fontSize="xs" color="red.500" mt={1}>{user.banReason}</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>{user._count?.orders ?? 0}</Table.Cell>
                  <Table.Cell fontSize="sm">{new Date(user.createdAt).toLocaleDateString()}</Table.Cell>
                  <Table.Cell fontSize="sm">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={1}>
                      {user.isActive ? (
                        <IconButton
                          aria-label="Ban user"
                          size="xs"
                          colorPalette="red"
                          variant="ghost"
                          onClick={() => { setSelectedUser(user); setBanDialogOpen(true); }}
                        >
                          <FiXCircle />
                        </IconButton>
                      ) : (
                        <IconButton
                          aria-label="Unban user"
                          size="xs"
                          colorPalette="green"
                          variant="ghost"
                          onClick={() => handleUnban(user)}
                        >
                          <FiCheckCircle />
                        </IconButton>
                      )}
                      <IconButton
                        aria-label="Delete user"
                        size="xs"
                        colorPalette="red"
                        variant="ghost"
                        onClick={() => handleDelete(user)}
                      >
                        <FiTrash2 />
                      </IconButton>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Ban Dialog */}
      <Dialog.Root open={banDialogOpen} onOpenChange={({ open }) => setBanDialogOpen(open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header p="5">
                <Dialog.Title>Ban User</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
              <Dialog.Body p="5">
                <VStack gap={4} align="stretch">
                  <Text fontSize="sm" color="gray.600">
                    You are about to ban <strong>{selectedUser?.email || selectedUser?.id}</strong>
                  </Text>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>Ban Type</Text>
                    <HStack gap={2}>
                      <Button
                        size="sm"
                        variant={banType === 'Temporary' ? 'solid' : 'outline'}
                        bg={banType === 'Temporary' ? 'orange.500' : undefined}
                        onClick={() => setBanType('Temporary')}
                      >
                        Temporary
                      </Button>
                      <Button
                        size="sm"
                        variant={banType === 'Permanent' ? 'solid' : 'outline'}
                        bg={banType === 'Permanent' ? 'red.500' : undefined}
                        color={banType === 'Permanent' ? 'white' : undefined}
                        onClick={() => setBanType('Permanent')}
                      >
                        Permanent
                      </Button>
                    </HStack>
                  </Box>

                  {banType === 'Temporary' && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>Duration (days)</Text>
                      <Input
                        type="number"
                        value={banDuration}
                        onChange={(e) => setBanDuration(e.target.value)}
                        min={1}
                        max={365}
                      />
                    </Box>
                  )}

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>Reason</Text>
                    <Input
                      placeholder="e.g., Fees not paid, policy violation..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                    />
                  </Box>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer p="5">
                <HStack gap={3}>
                  <Button variant="ghost" onClick={() => setBanDialogOpen(false)}>Cancel</Button>
                  <Button
                    bg="red.500"
                    color="white"
                    onClick={handleBan}
                    loading={banning}
                    _hover={{ bg: 'red.600' }}
                  >
                    {banType === 'Permanent' ? 'Permanently Ban' : `Ban for ${banDuration} days`}
                  </Button>
                </HStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}
