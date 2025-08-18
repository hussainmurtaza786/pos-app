'use client';
import React, { useState } from 'react';
import { Box, Flex, VStack, Text, Button, Icon as ChakraIcon, Container, } from '@chakra-ui/react';
import { IoIosTrendingUp } from 'react-icons/io';
import { useDispatch } from 'react-redux';
import { updateAuthData } from '@/redux/slices/auth';
import Form from '@/components/Form';
import { PAGES } from '@/app-config';
import { useRouter } from 'next/navigation';
import { loginAction } from './action';

interface LoginFormProps {
  onLogin: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const dispatch = useDispatch();

  const handleAction = async (values: any) => {
    console.log("Formik values:", values);
    setError('');

    const { error, data } = await loginAction(values);

    if (error) {
      setError(error);
      return;
    }

    if (data?.token) {
      dispatch(updateAuthData({ authToken: data.token, userDetails: data.userDetails }));
      router.push(PAGES.Home.path);
    }
  };

  return (
    <Flex minH="100vh" bgColor='#e7eeff' align="center" justify="center" py={8} px={4}>
      <Container maxW="lg">
        <VStack>
          <Box textAlign="center">
            <Flex justify="center">
              <Flex bg="blue.600" rounded="xl" boxShadow="lg" align="center" justify="center" w={{ base: 14, md: 16 }} h={{ base: 14, md: 16 }}>
                <ChakraIcon as={IoIosTrendingUp} color="white" boxSize={{ base: 8, md: 9 }} />
              </Flex>
            </Flex>
            <Text mt={{ base: 5, md: 6 }} fontSize={{ base: '2xl', md: '3xl' }} fontWeight="extrabold" color="gray.900">
              Sign in to POS System
            </Text>
            <Text mt={2} color="gray.600">
              Access your sales and inventory management
            </Text>
          </Box>
          {error && (
            <Text color="red.500" fontSize="sm" textAlign="center">
              {error}
            </Text>
          )}

          {/* Card */}
          <Box bg="white" p={{ base: 6, md: 8 }} rounded="xl" boxShadow="lg" borderWidth="1px" borderColor="gray.200" w="full" mt={6}>
            <VStack align="stretch">
              <Form
                action={handleAction}
                fields={[
                  { type: 'email', name: 'email', label: 'Email', fieldArea: 12, inputProps: { placeholder: 'Enter your email', size: 'md' }, },
                  { type: 'password', name: 'password', label: 'Password', fieldArea: 12, inputProps: { placeholder: 'Enter your Password', size: 'md' }, },
                  { type: 'submit', name: 'login-btn', label: 'Login', fieldArea: 12, inputProps: { w: "full" } },
                ]}
              />

            </VStack>
          </Box>
        </VStack>
      </Container>
    </Flex>
  );
};

export default LoginForm;