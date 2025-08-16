import LoginForm from "@/tabs/login/LoginForm";
import { Flex } from "@chakra-ui/react";

interface LoginFormProps {
    onLogin: () => void;
}
export default function Login({ onLogin }: LoginFormProps) {
    return (
        <>
            <LoginForm onLogin={onLogin} />
        </>

    );
}