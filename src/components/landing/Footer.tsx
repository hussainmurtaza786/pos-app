'use client';
import { Box, Container, Flex, Text, Stack, Icon, Link } from '@chakra-ui/react';
import { IoIosTrendingUp } from 'react-icons/io';

export default function Footer() {
  return (
    <Box bg="gray.900" color="gray.400" py={12}>
      <Container maxW="6xl">
        <Stack
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          gap={8}
        >
          <Stack gap={3} maxW="xs">
            <Flex align="center" gap={2}>
              <Flex p={1.5} bg="blue.600" rounded="lg" align="center" justify="center">
                <Icon as={IoIosTrendingUp} boxSize={5} color="white" />
              </Flex>
              <Text fontSize="lg" fontWeight="bold" color="white">
                POS System
              </Text>
            </Flex>
            <Text fontSize="sm">
              Modern point-of-sale solution for small to medium businesses.
              Manage sales, inventory, and expenses all in one place.
            </Text>
          </Stack>

          <Stack gap={2}>
            <Text fontWeight="semibold" color="white" fontSize="sm">Product</Text>
            <Link href="#features" fontSize="sm" _hover={{ color: 'white' }}>Features</Link>
            <Link href="#pricing" fontSize="sm" _hover={{ color: 'white' }}>Pricing</Link>
            <Link href="/login" fontSize="sm" _hover={{ color: 'white' }}>Login</Link>
          </Stack>

          <Stack gap={2}>
            <Text fontWeight="semibold" color="white" fontSize="sm">Legal</Text>
            <Text fontSize="sm">Privacy Policy</Text>
            <Text fontSize="sm">Terms of Service</Text>
          </Stack>
        </Stack>

        <Box borderTopWidth="1px" borderColor="gray.700" mt={8} pt={8} textAlign="center">
          <Text fontSize="sm">
            &copy; {new Date().getFullYear()} POS System. All rights reserved.
          </Text>
        </Box>
      </Container>
    </Box>
  );
}
