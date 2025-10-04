'use client';
import React, { useEffect, useMemo } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Icon as ChakraIcon,
} from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';

import type { ReturnOrder,  } from '@/prisma/customTypes';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { getReturns } from '@/redux/slices/app/returnApiThunk';
import { ReturnOrderProduct } from '@prisma/client';

// ---- helpers ----
const formatCurrency = (amount: number) =>
  `Rs ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const toDate = (d: Date | string) => (d instanceof Date ? d : new Date(d));
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/**
 * ReturnImpacts
 * - Loads returns via Redux thunk
 * - Sums sellPrice * quantity for Today / Month / Year
 * - Renders the red impact card when any value > 0
 */
export default function ReturnImpacts() {
  const dispatch = useAppDispatch();

  // Your store uses singular key: s.app.return
  const returns = useAppSelector(
    (s) => (s.app.return?.items as ReturnOrder[]) ?? []
  );

  useEffect(() => {
    if (!returns.length) {
      dispatch(getReturns({ pageNumber: 1, pageSize: 1000 } as any));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { todaysReturns, monthlyReturns, yearlyReturns } = useMemo(() => {
    const today = startOfToday();
    const now = new Date();

    let t = 0;
    let m = 0;
    let y = 0;

    for (const r of returns) {
      const d = toDate(r.createdAt as any);
      const amount = (r.ReturnOrderProduct as ReturnOrderProduct[]).reduce(
        (sum, line) =>
          sum + Number(line.sellPrice || 0) * Number(line.quantity || 0),
        0
      );

      if (isSameDay(d, today)) t += amount;
      if (isSameMonth(d, now)) m += amount;
      if (d.getFullYear() === now.getFullYear()) y += amount;
    }

    return { todaysReturns: t, monthlyReturns: m, yearlyReturns: y };
  }, [returns]);

  const show =
    todaysReturns > 0 || monthlyReturns > 0 || yearlyReturns > 0;

  if (!show) return null;

  return (
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
                {formatCurrency(todaysReturns)}
              </Heading>
              <Text color="red.700">Today&apos;s Returns</Text>
            </Box>

            <Box textAlign="center">
              <Heading as="p" fontSize={{ base: 'xl', lg: '2xl' }} color="red.600">
                {formatCurrency(monthlyReturns)}
              </Heading>
              <Text color="red.700">Monthly Returns</Text>
            </Box>

            <Box textAlign="center">
              <Heading as="p" fontSize={{ base: 'xl', lg: '2xl' }} color="red.600">
                {formatCurrency(yearlyReturns)}
              </Heading>
              <Text color="red.700">Yearly Returns</Text>
            </Box>
          </SimpleGrid>
        </Box>
      </Flex>
    </Box>
  );
}
