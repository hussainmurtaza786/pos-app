'use client';
import { Box, Flex, Container, Heading, Text, SimpleGrid, Icon, Stack } from '@chakra-ui/react';
import { FiShoppingCart, FiBarChart2, FiUsers, FiShield, FiTrendingUp, FiClock } from 'react-icons/fi';

const features = [
  {
    icon: FiShoppingCart,
    title: 'Smart Sales Tracking',
    description: 'Track every transaction in real-time. Manage orders, returns, and discounts with ease.',
    color: 'blue.600',
  },
  {
    icon: FiBarChart2,
    title: 'Powerful Reports',
    description: 'Get insights into daily, monthly, and yearly sales performance with visual dashboards.',
    color: 'green.600',
  },
  {
    icon: FiUsers,
    title: 'Multi-User Management',
    description: 'Admin can manage staff accounts, track performance, and control access levels.',
    color: 'purple.600',
  },
  {
    icon: FiShield,
    title: 'Role-Based Access',
    description: 'Admin and Staff roles with different permissions. Keep your data secure and organized.',
    color: 'red.600',
  },
  {
    icon: FiTrendingUp,
    title: 'Inventory Control',
    description: 'Monitor stock levels, track purchase prices, and get alerts when items run low.',
    color: 'orange.600',
  },
  {
    icon: FiClock,
    title: 'Expense Management',
    description: 'Log and categorize business expenses. Track where your money goes automatically.',
    color: 'teal.600',
  },
];

export default function Features() {
  return (
    <Box py={{ base: 16, md: 24 }} bg="white">
      <Container maxW="6xl">
        <Stack gap={4} textAlign="center" mb={16}>
          <Heading as="h2" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color="gray.900">
            Everything You Need to Run Your Business
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto">
            A complete point-of-sale solution designed for small to medium businesses
          </Text>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={8}>
          {features.map((feature) => (
            <Box
              key={feature.title}
              p={6}
              rounded="xl"
              borderWidth="1px"
              borderColor="gray.200"
              _hover={{ shadow: 'lg', borderColor: 'gray.300' }}
              transition="all 0.2s"
            >
              <Flex align="center" justify="center" w={12} h={12} rounded="lg" bg={`${feature.color}.100`} mb={4}>
                <Icon as={feature.icon} boxSize={6} color={feature.color} />
              </Flex>
              <Heading as="h3" fontSize="lg" fontWeight="semibold" color="gray.900" mb={2}>
                {feature.title}
              </Heading>
              <Text color="gray.600" fontSize="sm">
                {feature.description}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
