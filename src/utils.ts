import axios from "axios";
import { AUTH_TOKEN_NAME } from "./app-config";
// import { showDialog } from "@/components/Dialog";

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
            // showDialog({
            //     title: "Request Failed", message: 'Session expired, login again', type: "error",
            //     responseCallback() { window.location.reload() }
            // })
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




function showDialog({ title, message, type = "info", responseCallback }: {
  title: string;
  message: string;
  type?: "info" | "error" | "success" | "warning";
  responseCallback?: () => void;
}) {
  // Remove existing dialog if any
  const existing = document.getElementById('custom-dialog');
  if (existing) existing.remove();

  const dialog = document.createElement('div');
  dialog.id = 'custom-dialog';
  dialog.className = `
    fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50
  `;

  dialog.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 text-center">
      <h2 class="text-xl font-semibold mb-2 text-gray-800">${title}</h2>
      <p class="text-gray-600 mb-4">${message}</p>
      <button id="dialog-ok-button" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
        OK
      </button>
    </div>
  `;

  document.body.appendChild(dialog);

  const okBtn = document.getElementById('dialog-ok-button');
  okBtn?.addEventListener('click', () => {
    dialog.remove();
    responseCallback?.();
  });
}
