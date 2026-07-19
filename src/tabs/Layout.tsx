"use client";
import React, { useMemo } from "react";
import { Box, Flex, Button, Text, VStack, HStack, Drawer, CloseButton, Portal, } from "@chakra-ui/react";
import { RxHamburgerMenu } from "react-icons/rx";
import { logout } from "@/redux/slices/auth";
import { CiLogout } from "react-icons/ci";
import { FaChartBar, FaFileInvoice, FaMoneyBillWave, FaShieldAlt } from "react-icons/fa";
import { FiFileText, FiRotateCcw } from "react-icons/fi";
import { GoPackage } from "react-icons/go";
import { HiOutlineCube } from "react-icons/hi";
import { IoIosTrendingUp } from "react-icons/io";
import { useDispatch } from "react-redux";
import { AUTH_TOKEN_NAME } from "@/app-config";
import { getCookie } from "@/utils";
import Link from "next/link";

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onSignOut: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    activeTab,
    onTabChange,
    onSignOut,
}) => {
    const dispatch = useDispatch();

    const isAdmin = useMemo(() => {
        try {
            const token = getCookie(AUTH_TOKEN_NAME);
            if (!token) return false;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.type === 'Admin' || payload.role === 'Admin';
        } catch {
            return false;
        }
    }, []);

    const handleSignOut = () => {
        document.cookie = `${AUTH_TOKEN_NAME}=; Max-Age=0; path=/;`;
        dispatch(logout());
        onSignOut();
    };

    const navigation = [
        { id: "dashboard", label: "Dashboard", icon: <FaChartBar size={18} /> },
        { id: "sales", label: "Orders", icon: <FaFileInvoice size={18} /> },
        { id: "returns", label: "Returns", icon: <FiRotateCcw size={18} /> },
        { id: "orders", label: "Orders & Return History", icon: <FaFileInvoice size={18} /> },
        { id: "inventory", label: "Inventory", icon: <HiOutlineCube size={18} /> },
        { id: "products", label: "Product", icon: <GoPackage size={18} /> },
        { id: "expenses", label: "Expenses", icon: <FaMoneyBillWave size={18} /> },
        { id: "reports", label: "Reports", icon: <FiFileText size={18} /> },
    ];

    const SidebarContent = () => (
        <VStack
            align="stretch"
            w="64"
            bg="white"
            borderRightWidth="1px"
            borderColor="gray.200"
            h="full"
        >
            {/* Logo/Header */}
            <Flex
                p={6}
                borderColor="gray.200"
                align="center"
                gap={3}
            >
                <Flex
                    p={2}
                    bg="blue.600"
                    rounded="lg"
                    align="center"
                    justify="center"
                >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" color="white" height="24" width="24" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><path d="M464.9 128H344.1c-8.3 0-15.1 6.6-15.1 14.8s6.8 14.8 15.1 14.8h83.7l-138 142.2-85.9-84.1c-2.9-2.8-6.6-4.3-10.7-4.3-4 0-7.8 1.5-10.7 4.3L36.2 358.8c-1.9 1.9-4.2 5.2-4.2 10.7 0 4.1 1.4 7.5 4.2 10.2 2.9 2.8 6.6 4.3 10.7 4.3 4 0 7.8-1.5 10.7-4.3L193.2 247l85.9 84.1c2.9 2.8 6.6 4.3 10.7 4.3 4 0 7.8-1.5 10.7-4.3l149.4-151.9v81.7c0 8.1 6.8 14.8 15.1 14.8s15.1-6.6 15.1-14.8V142.8c-.1-8.2-6.9-14.8-15.2-14.8z"></path></svg>
                </Flex>
                <Text fontSize="xl" fontWeight="bold" color="gray.900">
                    POS System
                </Text>
            </Flex>

            {/* Nav items */}
            <Box px={3} mt={4}>
                {navigation.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <Button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            w="full"
                            justifyContent="flex-start"
                            fontSize="sm"
                            fontWeight="medium"
                            mb={1}
                            rounded="lg"
                            color={isActive ? "blue.700" : "gray.600"}
                            bg={isActive ? "blue.100" : "transparent"}
                            _hover={{
                                bg: isActive ? "blue.100" : "gray.100",
                                color: isActive ? "blue.700" : "gray.900",
                            }}
                        >
                            {item.icon}&nbsp;{item.label}
                        </Button>
                    );
                })}

                {isAdmin && (
                    <Link href="/admin">
                        <Button
                            w="full"
                            justifyContent="flex-start"
                            fontSize="sm"
                            fontWeight="medium"
                            mb={1}
                            mt={4}
                            pt={4}
                            borderTopWidth="1px"
                            borderColor="gray.200"
                            rounded="lg"
                            color="purple.600"
                            _hover={{ bg: "purple.50", color: "purple.700" }}
                        >
                            <FaShieldAlt size={18} />&nbsp;Admin Panel
                        </Button>
                    </Link>
                )}
            </Box>

            {/* Sign out */}
            <Box mt="auto" p={3}>
                <Button
                    onClick={handleSignOut}
                    w="full"
                    justifyContent="flex-start"
                    fontSize="sm"
                    fontWeight="medium"
                    color="red.600"
                    variant="ghost"
                    _hover={{ bg: "red.50", color: "red.700" }}
                    rounded="lg"
                >
                    <CiLogout size={18} />
                    Sign Out
                </Button>
            </Box>
        </VStack>
    );

    return (
        <Flex minH="100vh" bg="gray.50" position="relative">
            {/* Desktop Sidebar */}
            <Box display={{ base: "none", lg: "block" }}>
                <SidebarContent />
            </Box>

            {/* Main Content */}
            <Flex flex="1" direction="column" overflow="hidden">
                {/* Mobile Topbar */}
                <Flex
                    display={{ base: "flex", lg: "none" }}
                    bg="white"
                    borderBottomWidth="1px"
                    borderColor="gray.200"
                    px={4}
                    py={3}
                    align="center"
                    justify="space-between"
                >
                    <HStack>
                        <Flex
                            p={1.5}
                            bg="blue.600"
                            rounded="lg"
                            align="center"
                            justify="center"
                        >
                            <IoIosTrendingUp size={20} color="white" />
                        </Flex>
                        <Text fontSize="lg" fontWeight="bold" color="gray.900">
                            POS System
                        </Text>
                    </HStack>

                    <Drawer.Root>
                        <Drawer.Trigger asChild>
                            <Button
                                variant="ghost"
                                p={2}
                                color="gray.700"
                                _hover={{ bg: "gray.100" }}
                            >
                                <RxHamburgerMenu size={24} />
                            </Button>
                        </Drawer.Trigger>

                        <Portal>
                            <Drawer.Backdrop />
                            <Drawer.Positioner>
                                <Drawer.Content maxW="64">
                                    <Drawer.Header
                                        borderBottomWidth="1px"
                                        borderColor="gray.200"
                                        position="relative"
                                    >
                                        <Drawer.CloseTrigger asChild>
                                            <CloseButton size="sm" position="absolute" top={3} right={3} />
                                        </Drawer.CloseTrigger>
                                    </Drawer.Header>
                                    <Drawer.Body p={0}>
                                        <SidebarContent />
                                    </Drawer.Body>
                                </Drawer.Content>
                            </Drawer.Positioner>
                        </Portal>
                    </Drawer.Root>
                </Flex>

                {/* Page Content */}
                {children}
            </Flex>
        </Flex>
    );
};

export default Layout;
