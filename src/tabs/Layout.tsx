"use client";
import React from "react";
import { Box, Flex, Button, Text, VStack, HStack, Drawer, CloseButton, Portal, } from "@chakra-ui/react";
import { RxHamburgerMenu } from "react-icons/rx";
import { logout } from "@/redux/slices/auth";
import { CiLogout } from "react-icons/ci";
import { FaChartBar, FaFileInvoice, FaMoneyBillWave } from "react-icons/fa";
import { FiFileText, FiRotateCcw } from "react-icons/fi";
import { GoPackage } from "react-icons/go";
import { HiOutlineCube } from "react-icons/hi";
import { IoIosTrendingUp } from "react-icons/io";
import { useDispatch } from "react-redux";
import { AUTH_TOKEN_NAME } from "@/app-config";

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
                borderBottomWidth="1px"
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
                    <IoIosTrendingUp size={24} color="white" />
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
                    {/* Left: POS System */}
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

                    {/* Right: Hamburger inside Drawer.Trigger */}
                    <Drawer.Root >
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
