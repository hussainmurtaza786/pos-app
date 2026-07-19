'use client';
import { Box, Flex, Heading, Text, Button, Container, Stack, Icon } from '@chakra-ui/react';
import { IoIosTrendingUp } from 'react-icons/io';
import Link from 'next/link';

export default function Hero() {
  return (
    <Box bg="gray.900" color="white" py={{ base: 20, md: 32 }}>
      <Container maxW="6xl">
        <Stack gap={8} textAlign="center" align="center">
          <Flex
            p={3}
            bg="blue.600"
            rounded="xl"
            align="center"
            justify="center"
          >
            <Icon as={IoIosTrendingUp} boxSize={10} color="white" />
          </Flex>

          <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }} fontWeight="extrabold" lineHeight="short">
            Modern POS System for{' '}
            <Text as="span" color="blue.400">Your Business</Text>
          </Heading>

          <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.300" maxW="2xl">
            Streamline your sales, manage inventory, track expenses, and generate powerful reports — all from one intuitive dashboard.
          </Text>

          <Stack direction={{ base: 'column', sm: 'row' }} gap={4}>
            <Link href="/login">
              <Button size="lg" bg="blue.600" color="white" _hover={{ bg: 'blue.700' }} px={8}>
                Get Started
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" color="white" borderColor="gray.600" _hover={{ bg: 'gray.800' }} px={8}>
                Create Account
              </Button>
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
