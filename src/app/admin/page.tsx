'use client';
import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, SimpleGrid, Stat, Spinner, Flex, Icon } from '@chakra-ui/react';
import { FiUsers, FiUserCheck, FiUserX, FiTrendingUp } from 'react-icons/fi';
import { authorizedApiClient } from '@/utils';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalOrders: number;
  totalRevenue: number;
  recentUsers: Array<{
    id: string;
    email: string | null;
    userRole: string;
    isActive: boolean;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authorizedApiClient.get('/api/admin/stats')
      .then(res => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Flex align="center" justify="center" minH="400px">
        <Spinner size="xl" color="blue.600" />
      </Flex>
    );
  }

  if (!stats) {
    return <Text color="gray.500">Failed to load stats</Text>;
  }

  return (
    <Box>
      <Heading fontSize="2xl" fontWeight="bold" mb={2}>Admin Dashboard</Heading>
      <Text color="gray.600" mb={8}>Overview of your system</Text>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
        <StatCard title="Total Users" value={stats.totalUsers} icon={FiUsers} color="blue.600" bg="blue.50" />
        <StatCard title="Active Users" value={stats.activeUsers} icon={FiUserCheck} color="green.600" bg="green.50" />
        <StatCard title="Banned Users" value={stats.bannedUsers} icon={FiUserX} color="red.600" bg="red.50" />
        <StatCard title="Total Revenue" value={`Rs ${stats.totalRevenue.toLocaleString()}`} icon={FiTrendingUp} color="purple.600" bg="purple.50" />
      </SimpleGrid>

      <Box bg="white" p={6} rounded="xl" shadow="sm" borderWidth="1px">
        <Heading fontSize="lg" fontWeight="semibold" mb={4}>Recent Users</Heading>
        {stats.recentUsers.length === 0 ? (
          <Text color="gray.500">No users found</Text>
        ) : (
          <Box>
            {stats.recentUsers.map((user) => (
              <Flex
                key={user.id}
                p={3}
                borderBottomWidth="1px"
                borderColor="gray.100"
                align="center"
                justify="space-between"
              >
                <Box>
                  <Text fontWeight="medium">{user.email || 'No email'}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {user.userRole} • Joined {new Date(user.createdAt).toLocaleDateString()}
                  </Text>
                </Box>
                <Box
                  px={2}
                  py={1}
                  rounded="full"
                  bg={user.isActive ? 'green.100' : 'red.100'}
                  color={user.isActive ? 'green.700' : 'red.700'}
                  fontSize="xs"
                  fontWeight="medium"
                >
                  {user.isActive ? 'Active' : 'Banned'}
                </Box>
              </Flex>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function StatCard({ title, value, icon, color, bg }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <Box bg="white" p={6} rounded="xl" shadow="sm" borderWidth="1px">
      <Flex align="center" justify="space-between">
        <Box>
          <Text fontSize="sm" color="gray.600" fontWeight="medium">{title}</Text>
          <Text fontSize="2xl" fontWeight="bold" mt={1}>{value}</Text>
        </Box>
        <Flex w="48px" h="48px" rounded="lg" bg={bg} color={color} align="center" justify="center">
          <Icon as={icon} boxSize={6} />
        </Flex>
      </Flex>
    </Box>
  );
}
