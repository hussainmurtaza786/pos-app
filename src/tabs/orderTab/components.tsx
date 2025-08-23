'use client'
import { useEffect, useRef, useState } from "react";
import { toaster } from "@/components/ui/toaster"
import { FiPlus } from "react-icons/fi";
import { Box, Dialog, Button, Portal, Spinner, Text, SkeletonText, IconButton } from "@chakra-ui/react";
import { CloseButton } from "@/components/ui/close-button";
import Form from "@/components/Form";
import { MdDelete } from "react-icons/md";
import { LiaEdit } from "react-icons/lia";
import { Order } from "@prisma/client";
import { useField } from "formik";
import { IoCloseSharp } from "react-icons/io5";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { addOrder, deleteOrderById, getOrderById, updateOrderById } from "@/redux/slices/app/orderApiThunk";

interface AddUpdateFormProps {
    initialValues?: Order,
    type?: "Add" | "Update",
}

export function AddUpdateOrderForm({ initialValues, type = 'Add' }: AddUpdateFormProps) {
    const dispatch = useAppDispatch();
    const [modalOpenState, setModalOpenState] = useState(false);
    const closeButtonRef = useRef<any>(null);

    const handleSubmit = async (values: any) => {
        try {
            if (type === "Add") {
                const res = await dispatch(addOrder(values)).unwrap();
                toaster.create({
                    type: "success", title: "Order Added",
                    description: "New order has been successfully added",
                    closable: true,
                });
            } else if (type === "Update") {
                const res = await dispatch(updateOrderById({ ...values, id: initialValues?.id })).unwrap();
                toaster.create({
                    type: "success", title: "Order updated",
                    description: "Order has been updated successfully",
                    closable: true,
                });
            }
            closeButtonRef.current?.click();
        } catch (error: any) {
            toaster.create({
                title: type === "Add" ? "Unable To Add New Order" : "Unable Update Order Details",
                description: error.message,
                type: "error", closable: true,
            });
        }
    }

    return (
        <Dialog.Root onOpenChange={({ open }) => setModalOpenState(open)} scrollBehavior="inside" placement='center' size="sm">
            <Dialog.Trigger asChild>
                {type === "Add" ?
                    <Button bgColor='blue' color="white" px={3} py={2} fontSize="md">{type === 'Add' ? <FiPlus /> : null} {type} Order</Button>
                    : type === "Update" ?
                        <IconButton variant='subtle' ><LiaEdit size={20} /></IconButton>
                        : null
                }
            </Dialog.Trigger>
            <Portal >
                <Dialog.Backdrop />
                <Dialog.Positioner >
                    <Dialog.Content >
                        <Dialog.Header p='5' >
                            <Dialog.Title> {type === 'Add' ? "Add New" : type} Order</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.CloseTrigger ref={closeButtonRef} asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                        <Dialog.Body p='3'>
                            <Form
                                initialValues={initialValues || {}}
                                enableReinitialize
                                onSubmit={handleSubmit}
                                fields={[
                                    { type: "text", name: "description", label: "Description", fieldArea: 12, notRequired: true },
                                    { type: "text", name: "discount", label: "Discount", fieldArea: 12, notRequired: true },
                                    // { type: "text", name: "total", label: "Total", fieldArea: 12, notRequired: true },
                                    { type: "text", name: "amountReceived", label: "Amount Received", fieldArea: 12, notRequired: true },
                                    // { type: "text", name: "changeGiven", label: "Change Given", fieldArea: 12, notRequired: true },
                                    {
                                        type: 'array-field', name: 'products', label: 'Products', itemLabel: 'Item',fieldArea:12,
                                        fieldArrayGroup: [
                                            // { type: "custom", name: "product", label: "Product", fieldArea: 6, CustomField: ({}) => <></> },
                                            { type: "text", name: "quantity", label: "Quantity", fieldArea: 6 },
                                            { type: "text", name: "sellPrice", label: "Sell Price", fieldArea: 6 },
                                        ]
                                    },
                                    { type: "submit", name: "submit-btn", label: `${type} Order`, fieldArea: 12, inputProps: { size: 'sm' } },
                                ]}
                            />
                        </Dialog.Body>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}

export function DeleteOrderHandlerButton({ orderId }: { orderId: number }) {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);
    const handleDelete = async () => {
        setLoading(true);
        try {
            await dispatch(deleteOrderById(orderId)).unwrap()
            toaster.create({
                type: "success", title: "Order Deleted",
                description: "Order has been deleted successfully",
                closable: true,
            });
        } catch (error: any) {
            toaster.create({
                title: "Unable To Delete Order",
                description: error.message,
                type: "error", closable: true,
            });
        }
        setLoading(false);
    }
    return (
        loading ? <Spinner /> :
            <IconButton onClick={handleDelete} aria-label='delete-order-btn' variant='surface'>
                <MdDelete size="20" />
            </IconButton>
    )
}

export function ViewOrder({ orderId }: { orderId: number }) {
    const dispatch = useAppDispatch();
    const _order = useAppSelector(s => s.app.order.itemFullDataById[orderId] || null);
    const [modalOpenState, setModalOpenState] = useState(false);

    useEffect(() => {
        if (modalOpenState && !_order) {
            dispatch(getOrderById(orderId))
        }
    }, [modalOpenState])

    return (
        <Dialog.Root onOpenChange={({ open }) => setModalOpenState(open)} scrollBehavior="inside" placement='center' size="sm">
            <Dialog.Trigger asChild>
                <Button variant="plain" color='blue' >{orderId}</Button>
            </Dialog.Trigger>
            <Portal >
                <Dialog.Backdrop />
                <Dialog.Positioner >
                    <Dialog.Content >
                        <Dialog.Header p='5' >
                            <Dialog.Title>Order Details</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                        {_order ?
                            <Dialog.Body p='3'>
                                <Box>
                                    <Text><strong>Description:</strong> {_order.description}</Text>
                                    <Text><strong>Discount:</strong> {_order.discount}</Text>
                                    {/* <Text><strong>Total:</strong> {_order.total}</Text> */}
                                    <Text><strong>Amount Received:</strong> {_order.amountReceived}</Text>
                                    {/* <Text><strong>Change Given:</strong> {_order.changeGiven}</Text> */}
                                </Box>
                            </Dialog.Body> :
                            <Dialog.Body p='3'>
                                <SkeletonText noOfLines={5} gap="4" />
                            </Dialog.Body>
                        }
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}
