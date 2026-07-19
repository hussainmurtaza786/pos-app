'use client';
import { Box, Container, Heading, Text, SimpleGrid, Button, Stack, Badge } from '@chakra-ui/react';
import { FiCheck } from 'react-icons/fi';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    description: 'Perfect for small shops getting started',
    features: [
      'Up to 100 products',
      'Basic sales tracking',
      'Expense logging',
      'Single user access',
    ],
    color: 'gray',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$29',
    period: '/month',
    description: 'For growing businesses that need more',
    features: [
      'Unlimited products',
      'Advanced reports & analytics',
      'Multi-user access (up to 5)',
      'Inventory management',
      'Return tracking',
      'Priority support',
    ],
    color: 'blue',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$79',
    period: '/month',
    description: 'For large operations requiring full control',
    features: [
      'Everything in Professional',
      'Unlimited users',
      'Admin dashboard & user management',
      'Custom roles & permissions',
      'API access',
      'Dedicated support',
      'Custom integrations',
    ],
    color: 'purple',
    popular: false,
  },
];

export default function Pricing() {
  return (
    <Box py={{ base: 16, md: 24 }} bg="gray.50">
      <Container maxW="6xl">
        <Stack gap={4} textAlign="center" mb={16}>
          <Heading as="h2" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color="gray.900">
            Simple, Transparent Pricing
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto">
            Choose the plan that fits your business. Upgrade anytime.
          </Text>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={8} alignItems="start">
          {plans.map((plan) => (
            <Box
              key={plan.name}
              bg="white"
              rounded="xl"
              shadow={plan.popular ? 'lg' : 'sm'}
              borderWidth="2px"
              borderColor={plan.popular ? 'blue.500' : 'gray.200'}
              p={8}
              position="relative"
            >
              {plan.popular && (
                <Badge
                  position="absolute"
                  top="-12px"
                  left="50%"
                  transform="translateX(-50%)"
                  bg="blue.600"
                  color="white"
                  px={3}
                  py={1}
                  rounded="full"
                  fontSize="xs"
                  fontWeight="bold"
                >
                  Most Popular
                </Badge>
              )}

              <Heading as="h3" fontSize="xl" fontWeight="bold" color="gray.900">
                {plan.name}
              </Heading>

              <Stack direction="row" align="baseline" gap={1} mt={4}>
                <Text fontSize="4xl" fontWeight="extrabold" color="gray.900">
                  {plan.price}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {plan.period}
                </Text>
              </Stack>

              <Text color="gray.600" mt={2} mb={6} fontSize="sm">
                {plan.description}
              </Text>

              <Stack gap={3} mb={8}>
                {plan.features.map((feature) => (
                  <Stack key={feature} direction="row" align="center" gap={2}>
                    <FiCheck color="green" size={16} />
                    <Text fontSize="sm" color="gray.700">{feature}</Text>
                  </Stack>
                ))}
              </Stack>

              <Link href="/register">
                <Button
                  w="full"
                  variant={plan.popular ? 'solid' : 'outline'}
                  bg={plan.popular ? 'blue.600' : undefined}
                  color={plan.popular ? 'white' : 'gray.700'}
                  _hover={{ bg: plan.popular ? 'blue.700' : 'gray.100' }}
                >
                  Get Started
                </Button>
              </Link>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
