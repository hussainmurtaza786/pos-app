'use client';
import React, { useState } from 'react';
import { Box, Flex, Heading, Text, SimpleGrid, Stack, Icon as ChakraIcon, Container, } from '@chakra-ui/react';
import { BiShoppingBag, BiTrendingUp, BiUserPlus } from 'react-icons/bi';
import { FaDollarSign } from 'react-icons/fa';
import { FiAlertTriangle } from 'react-icons/fi';

const formatCurrency = (amount: number) =>
  `Rs ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

interface DashboardStats {
  todaysSales: number;
  todaysProfit: number;
  monthlySales: number;
  monthlyProfit: number;
  yearlySales: number;
  yearlyProfit: number;
  totalTransactions: number;
  avgTransaction: number;
  todaysReturns: number;
  monthlyReturns: number;
  yearlyReturns: number;
  todaysReturnsProfit: number;
  monthlyReturnsProfit: number;
  yearlyReturnsProfit: number;
}

const StatCard: React.FC<{
  title: string;
  value: number;
  returns?: number;
  icon: React.ElementType;
  color: string; // e.g. "blue.600"
}> = ({ title, value, returns = 0, icon, color }) => {
  return (
    <Box bg="white"
      p={6}
      rounded="xl"
      shadow="sm"
      borderWidth="1px"
      borderColor="gray.100"
      _hover={{ shadow: 'md' }}
      transition="box-shadow 0.2s ease"
    >
      <Flex align="center" justify="space-between" gap={4}>
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.600">
            {title}
          </Text>
          <Heading as="p" fontSize="2xl" mt={1} color="gray.900">
            {formatCurrency(value - returns)}
          </Heading>
          {returns > 0 && (
            <Text fontSize="xs" color="red.600" mt={1}>
              Returns: -{formatCurrency(returns)}
            </Text>
          )}
        </Box>
        <Flex
          p={3}
          rounded="lg"
          bg={color}
          color="white"
          align="center"
          justify="center"
        >
          <ChakraIcon as={icon} boxSize={6} />
        </Flex>
      </Flex>
    </Box>
  );
};

export const Dashboard: React.FC = () => {
  const [stats] = useState<DashboardStats>({
    todaysSales: 3000,
    todaysProfit: 1230,
    monthlySales: 9400,
    monthlyProfit: 3810,
    yearlySales: 9400,
    yearlyProfit: 3810,
    totalTransactions: 7,
    avgTransaction: 750,
    todaysReturns: 0,
    monthlyReturns: 1000,
    yearlyReturns: 1000,
    todaysReturnsProfit: 0,
    monthlyReturnsProfit: 400,
    yearlyReturnsProfit: 400,
  });

  return (
    <Container maxW="7xl" py={{ base: 4, lg: 6 }}>
      <Stack>
        <Box>
          <Heading as="h1" fontSize={{ base: 'xl', lg: '2xl' }} color="gray.900">
            Sales Dashboard
          </Heading>
          <Text color="gray.600">
            Track your sales performance and profits (net of returns)
          </Text>
        </Box>

        {/* Stat Cards */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={{ base: 4, lg: 6 }}>
          <StatCard
            title="Today's Sales"
            value={stats.todaysSales}
            returns={stats.todaysReturns}
            icon={FaDollarSign}
            color="blue.600"
          />
          <StatCard
            title="Today's Profit"
            value={stats.todaysProfit}
            returns={stats.todaysReturnsProfit}
            icon={BiTrendingUp}
            color="green.600"
          />
          <StatCard
            title="Monthly Sales"
            value={stats.monthlySales}
            returns={stats.monthlyReturns}
            icon={BiShoppingBag}
            color="purple.600"
          />
          <StatCard
            title="Monthly Profit"
            value={stats.monthlyProfit}
            returns={stats.monthlyReturnsProfit}
            icon={BiTrendingUp}
            color="green.600"
          />
          <StatCard
            title="Yearly Sales"
            value={stats.yearlySales}
            returns={stats.yearlyReturns}
            icon={BiShoppingBag}
            color="orange.600"
          />
          <StatCard
            title="Yearly Profit"
            value={stats.yearlyProfit}
            returns={stats.yearlyReturnsProfit}
            icon={BiTrendingUp}
            color="green.600"
          />
          <StatCard
            title="Total Transactions"
            value={stats.totalTransactions}
            icon={BiUserPlus}
            color="blue.600"
          />
          <StatCard
            title="Average Transaction"
            value={stats.avgTransaction}
            icon={FaDollarSign}
            color="blue.600"
          />
        </SimpleGrid>

        {/* Quick Overview */}
        <Box
          bg="white"
          p={6}
          rounded="xl"
          shadow="sm"
          borderWidth="1px"
          borderColor="gray.100"
        >
          <Heading as="h3" fontSize={{ base: 'md', lg: 'lg' }} mb={4} color="gray.900">
            Quick Overview (Net of Returns)
          </Heading>

          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={{ base: 4, lg: 6 }}>
            <Box textAlign="center">
              <Heading as="p" fontSize={{ base: '2xl', lg: '3xl' }} color="blue.600">
                {formatCurrency(stats.todaysSales - stats.todaysReturns)}
              </Heading>
              <Text color="gray.600" mt={1}>
                Today&apos;s Net Sales
              </Text>
            </Box>

            <Box textAlign="center">
              <Heading as="p" fontSize={{ base: '2xl', lg: '3xl' }} color="green.600">
                {formatCurrency(stats.todaysProfit - stats.todaysReturnsProfit)}
              </Heading>
              <Text color="gray.600" mt={1}>
                Today&apos;s Net Profit
              </Text>
            </Box>

            <Box textAlign="center">
              <Heading as="p" fontSize={{ base: '2xl', lg: '3xl' }} color="purple.600">
                {stats.totalTransactions}
              </Heading>
              <Text color="gray.600" mt={1}>
                Total Transactions
              </Text>
            </Box>

            <Box textAlign="center">
              <Heading as="p" fontSize={{ base: '2xl', lg: '3xl' }} color="orange.600">
                {formatCurrency(stats.avgTransaction)}
              </Heading>
              <Text color="gray.600" mt={1}>
                Avg Transaction (Net)
              </Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Returns Impact */}
        {(stats.todaysReturns > 0 ||
          stats.monthlyReturns > 0 ||
          stats.yearlyReturns > 0) && (
            <Box
              bg="red.50"
              borderWidth="1px"
              borderColor="red.200"
              p={6}
              rounded="xl"
            >
              <Flex align="start" gap={3}>
                <ChakraIcon as={FiAlertTriangle} boxSize={6} color="red.600" mt="1" />
                <Box flex="1">
                  <Heading as="h3" fontSize="lg" color="red.800" mb={2}>
                    Returns Impact
                  </Heading>

                  <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4}>
                    <Box textAlign="center">
                      <Heading as="p" fontSize={{ base: 'xl', lg: '2xl' }} color="red.600">
                        {formatCurrency(stats.todaysReturns)}
                      </Heading>
                      <Text color="red.700">Today&apos;s Returns</Text>
                    </Box>
                    <Box textAlign="center">
                      <Heading as="p" fontSize={{ base: 'xl', lg: '2xl' }} color="red.600">
                        {formatCurrency(stats.monthlyReturns)}
                      </Heading>
                      <Text color="red.700">Monthly Returns</Text>
                    </Box>
                    <Box textAlign="center">
                      <Heading as="p" fontSize={{ base: 'xl', lg: '2xl' }} color="red.600">
                        {formatCurrency(stats.yearlyReturns)}
                      </Heading>
                      <Text color="red.700">Yearly Returns</Text>
                    </Box>
                  </SimpleGrid>
                </Box>
              </Flex>
            </Box>
          )}
      </Stack>
    </Container>
  );
};

export default Dashboard;