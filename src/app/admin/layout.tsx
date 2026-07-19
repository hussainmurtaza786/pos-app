'use client';
import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, VStack, Button, Icon, Container, Spinner } from '@chakra-ui/react';
import { FiUsers, FiShield, FiBarChart2, FiSettings } from 'react-icons/fi';
import { useRouter, usePathname } from 'next/navigation';
import { getCookie } from '@/utils';
import { AUTH_TOKEN_NAME } from '@/app-config';
import Link from 'next/link';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: FiBarChart2, href: '/admin' },
  { id: 'users', label: 'User Management', icon: FiUsers, href: '/admin/users' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = getCookie(AUTH_TOKEN_NAME);
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.type !== 'Admin' && payload.role !== 'Admin') {
        router.replace('/app');
        return;
      }
      setUserRole(payload.type || payload.role);
      setLoading(false);
    } catch {
      router.replace('/login');
    }
  }, [router]);

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="xl" color="blue.600" />
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Sidebar */}
      <Box display={{ base: 'none', lg: 'block' }} w="64" bg="white" borderRightWidth="1px" borderColor="gray.200">
        <Flex p={6} align="center" gap={3}>
          <Flex p={2} bg="blue.600" rounded="lg" align="center" justify="center">
            <Icon as={FiShield} boxSize={5} color="white" />
          </Flex>
          <Box>
            <Text fontSize="lg" fontWeight="bold" color="gray.900">Admin Panel</Text>
            <Text fontSize="xs" color="gray.500">Management Console</Text>
          </Box>
        </Flex>

        <VStack align="stretch" px={3} gap={1}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.id} href={item.href}>
                <Button
                  w="full"
                  justifyContent="flex-start"
                  fontSize="sm"
                  fontWeight="medium"
                  color={isActive ? 'blue.700' : 'gray.600'}
                  bg={isActive ? 'blue.100' : 'transparent'}
                  _hover={{ bg: isActive ? 'blue.100' : 'gray.100' }}
                  rounded="lg"
                >
                  <Icon as={item.icon} mr={2} boxSize={4} />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </VStack>

        <Box mt="auto" p={3} position="absolute" bottom={0} w="64">
          <Link href="/app">
            <Button w="full" variant="ghost" fontSize="sm" color="gray.600" justifyContent="flex-start">
              ← Back to POS
            </Button>
          </Link>
        </Box>
      </Box>

      {/* Main Content */}
      <Box flex="1" p={{ base: 4, md: 8 }} overflow="auto">
        {children}
      </Box>
    </Flex>
  );
}
