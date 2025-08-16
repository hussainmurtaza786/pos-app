'use client'
import { Dialog, Portal, Button, useDisclosure, CloseButton } from '@chakra-ui/react';
import React, { useState } from 'react';

export const color = {
    error: "#ef4444",
    success: "#22c55e",
    warning: "#f97316",
    confirmation: "#3b82f6",
    info: "#3b82f6",
}
export let showDialog = ({ }: ShowDialogProps) => {

}
let _responseCallback = (response?: "ok" | "yes" | "no") => { }
export default function _Dialog() {
    const [state, setState] = useState<ShowDialogProps>({ type: "" as ShowDialogProps['type'], message: '', title: "" })
    // const { isOpen, onOpen, onClose } = useDisclosure()
    const [isOpen, setOpen] = useState(false)
    const cancelRef = React.useRef<HTMLButtonElement>(null)
    showDialog = ({ message, type, title, responseCallback }: ShowDialogProps) => {
        setState({ message, type, title: title || '' });
        setOpen(true)
        if (responseCallback) {
            _responseCallback = responseCallback
        }
    };

    const handleClose = (response?: "ok" | "yes" | "no") => {
        setState({ type: "" as any, message: '', title: '' });
        _responseCallback(response)
        setOpen(false)
    }

    const onDialogStateChange = (e: { open: boolean }) => {
        setOpen(e.open)
        if (!e.open) {
            handleClose()
        }
    }


    return (
        <Dialog.Root lazyMount open={isOpen} onOpenChange={onDialogStateChange} placement='center' size={'sm'}>
            {/* <Dialog.Trigger asChild>
                <Button variant="outline" size={size}>
                    Open
                </Button>
            </Dialog.Trigger> */}
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner  >
                    <Dialog.Content p='3' bgColor='white'>
                        <Dialog.Header>
                            <Dialog.Title  >{state.title}</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body my='2' >
                            <p>{state.message}</p>
                        </Dialog.Body>
                        <Dialog.Footer>
                            {((["error", "warning", "success", "info"] as (ShowDialogProps['type'])[]).includes(state.type)) && <Button px={5} size='sm' colorScheme='maroon' onClick={() => handleClose('ok')} >OK</Button>}
                            {((["confirmation"] as (ShowDialogProps['type'])[]).includes(state.type)) && <Button size='sm' px='5' variant='outline' onClick={() => handleClose('yes')} >Yes</Button>}
                            {((["confirmation"] as (ShowDialogProps['type'])[]).includes(state.type)) && <Button size='sm' px='5' color='white' onClick={() => handleClose('no')} >No</Button>}
                            {/* <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                            </Dialog.ActionTrigger>
                            <Button>Save</Button>*/}
                        </Dialog.Footer>
                        {/* <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>*/}
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}

interface ShowDialogProps {
    type: keyof typeof color;
    title?: React.ReactNode;
    message: React.ReactNode;
    responseCallback?: (response?: "ok" | "yes" | "no") => void
}

