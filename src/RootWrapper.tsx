'use client'
import store from '@/redux/store';
import { Provider } from 'react-redux';
// import Dialog from '@/components/Dialog';
import { Provider as ChakraProvider } from "@/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";


export default function RootWrapper({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <ChakraProvider enableSystem={false}>
                {/* <Dialog /> */}
                <Toaster />
                {children}
            </ChakraProvider>
        </Provider>
    )

}