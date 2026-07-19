'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/utils';
import { AUTH_TOKEN_NAME } from '@/app-config';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import Footer from '@/components/landing/Footer';
import { Box, Flex, Container, Text, Button, Icon, Stack, Heading, Input, HStack, Badge, Avatar, Stat } from '@chakra-ui/react';
import { IoIosTrendingUp } from 'react-icons/io';
import Link from 'next/link';

function NavBar() {
  return (
    <Box bg="white" borderBottomWidth="1px" borderColor="gray.200" position="sticky" top={0} zIndex={50}>
      <Container maxW="6xl">
        <Flex py={4} align="center" justify="space-between">
          <Link href="/">
            <Flex align="center" gap={2} cursor="pointer">
              <Flex p={1.5} bg="blue.600" rounded="lg" align="center" justify="center">
                <Icon as={IoIosTrendingUp} boxSize={5} color="white" />
              </Flex>
              <Text fontSize="xl" fontWeight="bold" color="gray.900">
                POS System
              </Text>
            </Flex>
          </Link>

          <HStack gap={3}>
            <Link href="/login">
              <Button variant="ghost" size="sm" fontWeight="medium">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button bg="blue.600" px={4} py={2} color="white" size="sm" fontWeight="medium" _hover={{ bg: 'blue.700' }}>
                Sign Up
              </Button>
            </Link>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getCookie(AUTH_TOKEN_NAME);
    if (token) {
      router.replace('/app');
    }
  }, [router]);

  return (
    <Box minH="100vh">
      <NavBar />
      <Hero />
      <div id="features">
        <Features />
      </div>
      <div id="pricing">
        <Pricing />
      </div>
      <Footer />
    </Box>
  );
}
