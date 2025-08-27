import axios from "axios";
import { AUTH_TOKEN_NAME } from "@/app-config";
import { showDialog } from "@/components/Dialog";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export function getCookie(name: string) {
    const cookieArr = document.cookie.split('; ');
    for (const cookie of cookieArr) {
        const [key, value] = cookie.split('=');
        if (key === name) return value;
    }
    return null;
};



// Create an Axios instance
export const authorizedApiClient = axios.create()
// Add a request interceptor
authorizedApiClient.interceptors.request.use(
    async (config) => {

        const token = getCookie(AUTH_TOKEN_NAME)
        if (!token) {
            // alert('Session expired, login again')
            showDialog({
                title: "Request Failed", message: 'Session expired, login again', type: "error",
                responseCallback() { window.location.reload() }
            })
        }

        config.headers['Authorization'] = `Bearer ${token}`;

        return config; // Pass the modified config
    },
    (error) => {
        // Handle request errors
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);
// Add a response interceptor
authorizedApiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle response errors
        console.error('Response Error:', error);
        return Promise.reject(error);
    }
);



// utils/auth.ts

interface TokenPayload {
  id: string; // Must match what you set when signing the token
  email?: string;
  role?: string;
}

export async function verifyAuthorization(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    return decoded; // { id: "...", email: "...", role: "..." }
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
}




