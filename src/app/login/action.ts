'use server';
import { cookies } from "next/headers";
import axios from "axios";
import { headers } from "next/headers";
import { AUTH_TOKEN_NAME } from "@/app-config";
import { JWT } from "@/app/api/utils";
import { LoginInput, LoginOutput } from "@/app/api/login/route";


export async function loginAction(formData: FormData) {
    const { email, password } = JSON.parse(formData.get('formValues')?.toString() || '{}');
    try {
        const origin = (await headers()).get('origin')
        const res = await axios.post<LoginOutput>(
            `${origin}/api/login`,
            { password, email } as LoginInput,
            { headers: { "Content-Type": "application/json" } }
        );
        if (res.data.data.token) {
            const decoded = JWT.decode(res.data.data.token);
            (await cookies()).set(AUTH_TOKEN_NAME, res.data.data.token, {
                secure: process.env.NODE_ENV === 'production',
                expires: new Date((decoded.exp || 1) * 1000),
                path: '/',
                sameSite: "lax",
            });
        }

        return { data: res.data.data }

    } catch (_error: any) {
        const errorData = _error.response?.data;
        if (errorData?.error === 'Account suspended') {
            return { error: errorData.details || 'Your account has been suspended. Contact admin.' };
        }
        return { error: errorData?.error || errorData?.message || "Something went wrong" }
    }

}
