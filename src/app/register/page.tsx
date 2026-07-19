'use client';
import React, { useState } from 'react';
import { Box, Flex, VStack, Text, Container, Icon, HStack } from '@chakra-ui/react';
import { IoIosTrendingUp } from 'react-icons/io';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Form from '@/components/Form';
import { toaster } from '@/components/ui/toaster';
import axios from 'axios';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (formData: FormData) => {
    const values = JSON.parse(formData.get('formValues')?.toString() || '{}');

    if (values.password !== values.confirmPassword) {
      toaster.create({
        type: 'error',
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are identical',
        closable: true,
      });
      return;
    }

    setLoading(true);
    try {
      await axios.put('/api/login', {
        email: values.email,
        password: values.password,
      });

      toaster.create({
        type: 'success',
        title: 'Account Created',
        description: 'You can now login with your credentials',
        closable: true,
      });
      router.push('/login');
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Registration failed';
      toaster.create({
        type: 'error',
        title: 'Registration Failed',
        description: msg,
        closable: true,
      });
    }
    setLoading(false);
  };

  return (
    <Flex minH="100vh" bgColor="#e7eeff" align="center" justify="center" py={8} px={4}>
      <Container maxW="md">
        <VStack>
          <Box textAlign="center">
            <Flex justify="center">
              <Flex bg="blue.600" rounded="xl" boxShadow="lg" align="center" justify="center" w={{ base: 14, md: 16 }} h={{ base: 14, md: 16 }}>
                <IoIosTrendingUp color="white" size={32} />
              </Flex>
            </Flex>
            <Text mt={{ base: 5, md: 6 }} fontSize={{ base: '2xl', md: '3xl' }} fontWeight="extrabold" color="gray.900">
              Create Your Account
            </Text>
            <Text mt={2} color="gray.600">
              Start managing your business today
            </Text>
          </Box>

          <Box bg="white" p={{ base: 6, md: 8 }} rounded="xl" boxShadow="lg" borderWidth="1px" borderColor="gray.200" w="full" mt={6}>
            <VStack align="stretch">
              <Form
                action={handleRegister}
                fields={[
                  { type: 'email', name: 'email', label: 'Email', fieldArea: 12, inputProps: { placeholder: 'Enter your email', size: 'md' } },
                  { type: 'password', name: 'password', label: 'Password', fieldArea: 12, inputProps: { placeholder: 'Create a password', size: 'md' } },
                  { type: 'password', name: 'confirmPassword', label: 'Confirm Password', fieldArea: 12, inputProps: { placeholder: 'Confirm your password', size: 'md' } },
                  { type: 'submit', name: 'register-btn', label: loading ? 'Creating Account...' : 'Create Account', fieldArea: 12, inputProps: { w: 'full', disabled: loading } },
                ]}
              />
            </VStack>
          </Box>

          <Text mt={4} fontSize="sm" color="gray.600">
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#3182ce', fontWeight: 600 }}>
              Sign in
            </Link>
          </Text>
        </VStack>
      </Container>
    </Flex>
  );
}
