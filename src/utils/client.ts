import axios from "axios";
import { AUTH_TOKEN_NAME } from "@/app-config";
import { showDialog } from "@/components/Dialog";
import { DEMO_TOKEN } from '@/demo/account';
import { demoAdapter } from '@/demo/data';

export function getCookie(name: string) {
    const cookieArr = document.cookie.split('; ');
    for (const cookie of cookieArr) {
        const [key, value] = cookie.split('=');
        if (key === name) return value;
    }
    return null;
}

export const authorizedApiClient = axios.create();

authorizedApiClient.interceptors.request.use(
    async (config) => {
        const token = getCookie(AUTH_TOKEN_NAME);
        if (token === DEMO_TOKEN) {
            config.adapter = demoAdapter;
            return config;
        }
        if (!token) {
            showDialog({
                title: "Request Failed", message: 'Session expired, login again', type: "error",
                responseCallback() { window.location.reload() }
            });
        }

        config.headers['Authorization'] = `Bearer ${token}`;
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

authorizedApiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Response Error:', error);
        return Promise.reject(error);
    }
);
