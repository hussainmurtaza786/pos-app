'use server';
import { cookies } from "next/headers";
import axios from "axios";
import { headers } from "next/headers";
import { AUTH_TOKEN_NAME } from "@/app-config";
import { JWT } from "@/app/api/utils";
import { LoginInput, LoginOutput } from "@/app/api/login/route";
import { toaster } from "@/components/ui/toaster";


export async function loginAction(formData: FormData) {
    const { email, password } = JSON.parse(formData.get('formValues')?.toString() || '{}');
    console.log("firstName ==>", email, password);
    let error;
    try {
        const origin = (await headers()).get('origin')
        // console.log("origin ==>", origin);
        const res = await axios.post<LoginOutput>(
            `${origin}/api/login`,
            { password, email } as LoginInput,
            { headers: { "Content-Type": "application/json" } }
        );
        // console.log("firstName ==>", res.data);
        if (res.data.data.token) {
            const decoded = JWT.decode(res.data.data.token);
            (await cookies()).set(AUTH_TOKEN_NAME, res.data.data.token, {
                secure: process.env.NODE_ENV === 'production',
                expires: new Date((decoded.exp || 1) * 1000),
                path: '/',
                httpOnly: false,
                sameSite: "lax",
            });

            console.log('login-success', res.data.data);
        }

        return { data: res.data.data }
        // if (res)
        //     redirect(PAGE.path);
        // else
        //     return { error };

    } catch (_error: any) {
        error = _error.response?.data.error || "Something went wrong";
        console.log('login-failure', _error.response?.data);
        return { error: _error.response?.data?.message }
    }

}
