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
} from '@chakra-ui/react';
import { FaDollarSign } from 'react-icons/fa';
import { BiShoppingBag, BiTrendingUp } from 'react-icons/bi';

import { useAppDispatch, useAppSelector } from '@/redux/store';
import { getOrders } from '@/redux/slices/app/orderApiThunk';
import { getReturns } from '@/redux/slices/app/returnApiThunk';
import { getInventories } from '@/redux/slices/app/inventoryApiThunks';
import { ReturnOrderProduct as AppReturnOrderProduct, } from '@prisma/client';
import type {
    Order as AppOrder,
    ProductInOrder as AppProductInOrder,
    ReturnOrder as AppReturnOrder,
    Inventory as AppInventory,
} from '@/prisma/customTypes';

/* ---------------- helpers ---------------- */

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

/* --------------- UI atom (no Stat components) --------------- */

const StatCard: React.FC<{
    title: string;
    value: number;     // gross
    returns?: number;  // subtracted from value in display
    icon: React.ElementType;
    color: string;     // e.g. "blue.600"
}> = ({ title, value, returns = 0, icon, color }) => {
    const net = (value || 0) - (returns || 0);
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
                        {formatCurrency(net)}
                    </Heading>
                    {returns > 0 && (
                        <Text fontSize="xs" color="red.600" mt={1}>
                            Returns: -{formatCurrency(returns)}
                        </Text>
                    )}
                </Box>
                <Flex
                    w="48px"
                    h="48px"
                    rounded="lg"
                    bg={color}
                    color="white"
                    align="center"
                    justify="center"
                    flexShrink={0}
                >
                    <ChakraIcon as={icon} boxSize={6} />
                </Flex>
            </Flex>
        </Box>
    );
};

/* ---------------- KPI calculation (WAC COGS, net of returns) ---------------- */

function useSalesProfit(
    orders: AppOrder[],
    returns: AppReturnOrder[],
    inventories: AppInventory[]
) {
    const today = startOfToday();
    const now = new Date();

    // Weighted Average Cost by productId from inventories
    // WAC = sum(purchasePrice * purchasedQuantity) / sum(purchasedQuantity)
    const wacByProduct = useMemo(() => {
        const totals = new Map<string, { qty: number; value: number }>();
        for (const inv of inventories || []) {
            const pid = (inv as any).productId as string;
            const qty = Number((inv as any).purchasedQuantity || 0);
            const price = Number((inv as any).purchasePrice || 0);
            if (!pid || qty <= 0) continue;
            const t = totals.get(pid) || { qty: 0, value: 0 };
            t.qty += qty;
            t.value += qty * price;
            totals.set(pid, t);
        }
        const map = new Map<string, number>();
        totals.forEach((t, pid) => {
            map.set(pid, t.qty > 0 ? t.value / t.qty : 0);
        });
        return map;
    }, [inventories]);

    const sumOrder = (o: AppOrder) => {
        const lines = (o.ProductInOrder || []) as AppProductInOrder[];
        const revenue = lines.reduce(
            (s, l) => s + Number(l.sellPrice || 0) * Number(l.quantity || 0),
            0
        );
        const cost = lines.reduce((s, l) => {
            const pid = (l as any).productId as string;
            const wac = wacByProduct.get(pid) || 0;
            return s + wac * Number(l.quantity || 0);
        }, 0);
        const discount = Number((o as any).discount || 0);
        const netSales = revenue - discount;
        const profit = netSales - cost;
        return { netSales, profit };
    };

    const sumReturn = (r: AppReturnOrder) => {
        const lines = (r.ReturnOrderProduct || []) as AppReturnOrderProduct[];
        const revenue = lines.reduce(
            (s, l) => s + Number(l.sellPrice || 0) * Number(l.quantity || 0),
            0
        );
        const cost = lines.reduce((s, l) => {
            const pid = (l as any).productId as string;
            const wac = wacByProduct.get(pid) || 0;
            return s + wac * Number(l.quantity || 0);
        }, 0);
        const profit = revenue - cost;
        return { revenue, profit };
    };

    const bucket = {
        today: { sales: 0, profit: 0 },
        month: { sales: 0, profit: 0 },
        year: { sales: 0, profit: 0 },
    };
    const ret = {
        today: { revenue: 0, profit: 0 },
        month: { revenue: 0, profit: 0 },
        year: { revenue: 0, profit: 0 },
    };

    // Orders (gross)
    for (const o of orders || []) {
        const d = toDate((o as any).createdAt);
        const { netSales, profit } = sumOrder(o);

        if (isSameDay(d, today)) { bucket.today.sales += netSales; bucket.today.profit += profit; }
        if (isSameMonth(d, now)) { bucket.month.sales += netSales; bucket.month.profit += profit; }
        if (d.getFullYear() === now.getFullYear()) { bucket.year.sales += netSales; bucket.year.profit += profit; }
    }

    // Returns (to subtract)
    for (const r of returns || []) {
        const d = toDate((r as any).createdAt);
        const { revenue, profit } = sumReturn(r);

        if (isSameDay(d, today)) { ret.today.revenue += revenue; ret.today.profit += profit; }
        if (isSameMonth(d, now)) { ret.month.revenue += revenue; ret.month.profit += profit; }
        if (d.getFullYear() === now.getFullYear()) { ret.year.revenue += revenue; ret.year.profit += profit; }
    }

    return {
        gross: bucket,
        returns: ret,
        net: {
            today: { sales: bucket.today.sales - ret.today.revenue, profit: bucket.today.profit - ret.today.profit },
            month: { sales: bucket.month.sales - ret.month.revenue, profit: bucket.month.profit - ret.month.profit },
            year: { sales: bucket.year.sales - ret.year.revenue, profit: bucket.year.profit - ret.year.profit },
        },
    };
}

/* ---------------- Component ---------------- */

const SalesAndProfit: React.FC = () => {
    const dispatch = useAppDispatch();

    const orders = useAppSelector((s) => (s.app.order?.items as AppOrder[]) ?? []);
    const returns = useAppSelector((s) => (s.app.return?.items as AppReturnOrder[]) ?? []);
    const inventories = useAppSelector((s) => (s.app.inventory?.items as AppInventory[]) ?? []);

    useEffect(() => {
        if (!orders.length) dispatch(getOrders({ pageNumber: 1, pageSize: 1000 } as any));
        if (!returns.length) dispatch(getReturns({ pageNumber: 1, pageSize: 1000 } as any));
        if (!inventories.length) dispatch(getInventories({ pageNumber: 1, pageSize: 1000 } as any));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const { net, returns: ret } = useSalesProfit(orders, returns, inventories);

    return (
        <Stack p={4}>
            {/* Six boxes */}
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={{ base: 4, lg: 6 }}>
                <StatCard
                    title="Today's Sales"
                    value={net.today.sales + ret.today.revenue} // gross
                    returns={ret.today.revenue}                 // displays net
                    icon={FaDollarSign}
                    color="blue.600"
                />
                <StatCard
                    title="Today's Profit"
                    value={net.today.profit + ret.today.profit}
                    returns={ret.today.profit}
                    icon={BiTrendingUp}
                    color="green.600"
                />
                <StatCard
                    title="Monthly Sales"
                    value={net.month.sales + ret.month.revenue}
                    returns={ret.month.revenue}
                    icon={BiShoppingBag}
                    color="purple.600"
                />
                <StatCard
                    title="Monthly Profit"
                    value={net.month.profit + ret.month.profit}
                    returns={ret.month.profit}
                    icon={BiTrendingUp}
                    color="green.600"
                />
                <StatCard
                    title="Yearly Sales"
                    value={net.year.sales + ret.year.revenue}
                    returns={ret.year.revenue}
                    icon={BiShoppingBag}
                    color="orange.600"
                />
                <StatCard
                    title="Yearly Profit"
                    value={net.year.profit + ret.year.profit}
                    returns={ret.year.profit}
                    icon={BiTrendingUp}
                    color="green.600"
                />
            </SimpleGrid>
        </Stack>
    );
};

export default SalesAndProfit;
