'use client';
import React, { useEffect, useMemo } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Stack,
  Icon as ChakraIcon,
  Container,
} from '@chakra-ui/react';
import { BiShoppingBag, BiTrendingUp, BiUserPlus } from 'react-icons/bi';
import { FaDollarSign } from 'react-icons/fa';
import { FiAlertTriangle } from 'react-icons/fi';

// ---- Redux + types ----
import { useAppDispatch, useAppSelector } from '@/redux/store';
// Your shared thunks file (matches your ReturnPage import style)
import { getReturns } from '@/redux/slices/app/returnApiThunk';
import type { ReturnOrder, } from '@/prisma/customTypes';
import { ReturnOrderProduct } from '@prisma/client';

const formatCurrency = (amount: number) =>
  `Rs ${Number(amount || 0).toLocaleString(undefined, {
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
    <Box
      bg="white"
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
            {formatCurrency(value - (returns || 0))}
          </Heading>
          {returns > 0 && (
            <Text fontSize="xs" color="red.600" mt={1}>
              Returns: -{formatCurrency(returns)}
            </Text>
          )}
        </Box>
        <Flex p={3} rounded="lg" bg={color} color="white" align="center" justify="center">
          <ChakraIcon as={icon} boxSize={6} />
        </Flex>
      </Flex>
    </Box>
  );
};

// ---- date helpers ----
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const toDate = (d: Date | string) => (d instanceof Date ? d : new Date(d));
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();

  // Your store uses singular keys (s.app.return)
  const returns = useAppSelector((s) => (s.app.return?.items as ReturnOrder[]) ?? []);

  // Load returns if empty
  useEffect(() => {
    if (!returns.length) {
      dispatch(getReturns({ pageNumber: 1, pageSize: 1000 } as any));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute live return totals
  const { todaysReturns, monthlyReturns, yearlyReturns } = useMemo(() => {
    const today = startOfToday();
    const now = new Date();

    let t = 0,
      m = 0,
      y = 0;

    for (const r of returns) {
      const d = toDate(r.createdAt as any);
      const amount = (r.ReturnOrderProduct as ReturnOrderProduct[]).reduce(
        (sum, line) => sum + Number(line.sellPrice || 0) * Number(line.quantity || 0),
        0
      );
      if (isSameDay(d, today)) t += amount;
      if (isSameMonth(d, now)) m += amount;
      if (d.getFullYear() === now.getFullYear()) y += amount;
    }

    return { todaysReturns: t, monthlyReturns: m, yearlyReturns: y };
  }, [returns]);

  // Keep your existing numbers for everything else (for now),
  // and override ONLY the returns fields with live values.
  const stats: DashboardStats = {
    todaysSales: 3000,
    todaysProfit: 1230,
    monthlySales: 9400,
    monthlyProfit: 3810,
    yearlySales: 9400,
    yearlyProfit: 3810,
    totalTransactions: 7,
    avgTransaction: 750,

    // Live values from store:
    todaysReturns,
    monthlyReturns,
    yearlyReturns,

    // Profit impact of returns — set to 0 for now.
    // Once you share your profit/COGS logic for returns, we’ll compute these.
    todaysReturnsProfit: 0,
    monthlyReturnsProfit: 0,
    yearlyReturnsProfit: 0,
  };

  return (
    <Container maxW="7xl" py={{ base: 4, lg: 6 }}>
      <Stack>
        <Box>
          <Heading as="h1" fontSize={{ base: 'xl', lg: '2xl' }} color="gray.900">
            Sales Dashboard
          </Heading>
          <Text color="gray.600">Track your sales performance and profits (net of returns)</Text>
        </Box>

        {/* Stat Cards */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={{ base: 4, lg: 6 }}>
          <StatCard title="Today's Sales" value={stats.todaysSales} returns={stats.todaysReturns} icon={FaDollarSign} color="blue.600" />
          <StatCard title="Today's Profit" value={stats.todaysProfit} returns={stats.todaysReturnsProfit} icon={BiTrendingUp} color="green.600" />
          <StatCard title="Monthly Sales" value={stats.monthlySales} returns={stats.monthlyReturns} icon={BiShoppingBag} color="purple.600" />
          <StatCard title="Monthly Profit" value={stats.monthlyProfit} returns={stats.monthlyReturnsProfit} icon={BiTrendingUp} color="green.600" />
          <StatCard title="Yearly Sales" value={stats.yearlySales} returns={stats.yearlyReturns} icon={BiShoppingBag} color="orange.600" />
          <StatCard title="Yearly Profit" value={stats.yearlyProfit} returns={stats.yearlyReturnsProfit} icon={BiTrendingUp} color="green.600" />
          <StatCard title="Total Transactions" value={stats.totalTransactions} icon={BiUserPlus} color="blue.600" />
          <StatCard title="Average Transaction" value={stats.avgTransaction} icon={FaDollarSign} color="blue.600" />
        </SimpleGrid>

        {/* Quick Overview */}
        <Box bg="white" p={6} rounded="xl" shadow="sm" borderWidth="1px" borderColor="gray.100">
          <Heading as="h3" fontSize={{ base: 'md', lg: 'lg' }} mb={4} color="gray.900">
            Quick Overview (Net of Returns)
          </Heading>

          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={{ base: 4, lg: 6 }}>
            <Box textAlign="center">
              <Heading as="p" fontSize={{ base: '2xl', lg: '3xl' }} color="blue.600">
                {formatCurrency(stats.todaysSales - stats.todaysReturns)}
              </Heading>
              <Text color="gray.600" mt={1}>Today&apos;s Net Sales</Text>
            </Box>

            <Box textAlign="center">
              <Heading as="p" fontSize={{ base: '2xl', lg: '3xl' }} color="green.600">
                {formatCurrency(stats.todaysProfit - stats.todaysReturnsProfit)}
              </Heading>
              <Text color="gray.600" mt={1}>Today&apos;s Net Profit</Text>
            </Box>

            <Box textAlign="center">
              <Heading as="p" fontSize={{ base: '2xl', lg: '3xl' }} color="purple.600">
                {stats.totalTransactions}
              </Heading>
              <Text color="gray.600" mt={1}>Total Transactions</Text>
            </Box>

            <Box textAlign="center">
              <Heading as="p" fontSize={{ base: '2xl', lg: '3xl' }} color="orange.600">
                {formatCurrency(stats.avgTransaction)}
              </Heading>
              <Text color="gray.600" mt={1}>Avg Transaction (Net)</Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Returns Impact — shows only if any > 0 (kept your condition) */}
        {(stats.todaysReturns > 0 || stats.monthlyReturns > 0 || stats.yearlyReturns > 0) && (
          <Box bg="red.50" borderWidth="1px" borderColor="red.200" p={6} rounded="xl">
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
