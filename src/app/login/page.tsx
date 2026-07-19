import LoginForm from "@/app/login/LoginForm";
import { Text, Flex } from "@chakra-ui/react";
import Link from "next/link";

export default function Login() {
    return (
        <>
            <LoginForm />
            <Flex justify="center" mt={-4} pb={4}>
                <Text fontSize="sm" color="gray.600">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" style={{ color: '#3182ce', fontWeight: 600 }}>
                        Sign up
                    </Link>
                </Text>
            </Flex>
        </>
    );
}
