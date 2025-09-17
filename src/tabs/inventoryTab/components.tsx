'use client'
import { useEffect, useRef, useState } from "react";
import { toaster } from "@/components/ui/toaster";
import { FiPlus } from "react-icons/fi";
import { Badge, Box, Dialog, Button, IconButton, Portal, Text, SkeletonText, } from "@chakra-ui/react";
import { CloseButton } from "@/components/ui/close-button";
import Form from "@/components/Form";
import { MdDelete } from "react-icons/md";
import { LiaEdit } from "react-icons/lia";
import { Inventory } from "@prisma/client";
import SearchProduct from "../common/SearchProduct";
import { Product } from "@/prisma/customTypes";
import { useField } from "formik";
import { IoCloseSharp } from "react-icons/io5";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import {
    addInventory,
    deleteInventoryById,
    getInventoryById,
    updateInventoryById,
} from "@/redux/slices/app/inventoryApiThunks";
import { keyframes } from "@emotion/react";
import { CgSpinnerTwoAlt } from "react-icons/cg";

interface AddUpdateFormProps {
    initialValues?: Inventory;
    type?: "Add" | "Update";
}

/** Change this to tune your low-stock threshold */
export const LOW_STOCK_THRESHOLD = 5;

/** Consistent stock status badge */
export function StockStatusBadge({ availableQuantity }: { availableQuantity: number }) {
    if (availableQuantity <= 0) {
        return <Badge colorPalette="red" variant="subtle">Out of Stock</Badge>;
    }
    if (availableQuantity <= LOW_STOCK_THRESHOLD) {
        return <Badge colorPalette="yellow" variant="subtle">Low Stock</Badge>;
    }
    return <Badge colorPalette="green" variant="subtle">In Stock</Badge>;
}

export function AddUpdateInventoryForm({ initialValues, type = "Add" }: AddUpdateFormProps) {
    const dispatch = useAppDispatch();
    const [modalOpenState, setModalOpenState] = useState(false);
    const closeButtonRef = useRef<any>(null);

    const handleSubmit = async (values: any) => {
        const productId = values.product?.id;
        const { product, vendor, ...restValues } = values;

        try {
            if (type === "Add") {
                await dispatch(addInventory({ ...restValues, productId })).unwrap();
                toaster.create({
                    type: "success",
                    title: "Inventory Added",
                    description: "New inventory has been successfully added",
                    closable: true,
                });
            } else {
                await dispatch(
                    updateInventoryById({ ...restValues, productId, id: initialValues?.id })
                ).unwrap();
                toaster.create({
                    type: "success",
                    title: "Details updated",
                    description: "Account details has been updated successfully",
                    closable: true,
                });
            }
            closeButtonRef.current?.click(); // close modal on success
        } catch (error: any) {
            toaster.create({
                title: type === "Add" ? "Unable To Add New Account" : "Unable Update Account Details",
                description: error.message,
                type: "error",
                closable: true,
            });
        }
    };

    return (
        <Dialog.Root
            onOpenChange={({ open }) => setModalOpenState(open)}
            scrollBehavior="inside"
            placement="center"
            size="sm"
        >
            <Dialog.Trigger asChild>
                {type === "Add" ? (
                    <Button bgColor="blue" color="white" px={3} py={2} fontSize="md">
                        <FiPlus /> Add Inventory
                    </Button>
                ) : (
                    <IconButton variant="subtle" aria-label="edit-inventory">
                        <LiaEdit size={20} />
                    </IconButton>
                )}
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header p="5">
                            <Dialog.Title>{type === "Add" ? "Add New" : "Update"} Inventory</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.CloseTrigger ref={closeButtonRef} asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                        <Dialog.Body p="3">
                            <Form
                                initialValues={
                                    initialValues
                                        ? {
                                            ...initialValues,
                                            // keep your UX: prefill "quantity" from purchasedQuantity on edit
                                            quantity: initialValues.purchasedQuantity,
                                        }
                                        : {}
                                }
                                enableReinitialize
                                onSubmit={handleSubmit}
                                fields={[
                                    {
                                        type: "custom",
                                        name: "product",
                                        label: "Product",
                                        fieldArea: 12,
                                        CustomField({ name, label, value, scope }) {
                                            const [field, meta] = useField<Product | null>(name);
                                            const prod = field.value;
                                            const handleSelect = (product: Product) => {
                                                scope.formikProps.setFieldValue(name, product, true);
                                            };
                                            const handleDeSelect = () => {
                                                scope.formikProps.setFieldValue(name, null, true);
                                            };
                                            return (
                                                <>
                                                    <Text>{label}</Text>
                                                    {prod ? (
                                                        <Box pos="relative">
                                                            <Text>{prod.name}</Text>
                                                            <IconButton
                                                                onClick={handleDeSelect}
                                                                aria-label="remove-product"
                                                                size="xs"
                                                                p="0"
                                                                variant="surface"
                                                                colorPalette="gray"
                                                                mt={2}
                                                            >
                                                                <IoCloseSharp />
                                                            </IconButton>
                                                        </Box>
                                                    ) : (
                                                        <SearchProduct onSelect={handleSelect} />
                                                    )}
                                                    {meta.touched && <Text color="fg.error">{meta.error}</Text>}
                                                </>
                                            );
                                        },
                                    },
                                    { type: "number", name: "quantity", label: "Quantity", fieldArea: 12, notRequired: true },
                                    { type: "text", name: "purchasePrice", label: "Purchase Price", fieldArea: 12, notRequired: true },
                                    {
                                        type: "submit",
                                        name: "submit-btn",
                                        label: `${type} Inventory`,
                                        fieldArea: 12,
                                        inputProps: { size: "sm" },
                                    },
                                ]}
                            />
                        </Dialog.Body>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}

/* Custom animated spinner (used while deleting) */
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;
export const spinner = (
    <Text display="inline-block" fontSize="2xl" animation={`${spin} 1s linear infinite`}>
        <CgSpinnerTwoAlt />
    </Text>
);

export function DeleteInventoryHandlerButton({ inventoryId }: { inventoryId: string }) {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await dispatch(deleteInventoryById(inventoryId)).unwrap();
            toaster.create({
                type: "success",
                title: "Inventory Deleted",
                description: "Inventory has been deleted successfully",
                closable: true,
            });
        } catch (error: any) {
            toaster.create({
                title: "Unable To Delete Inventory",
                description: error.message,
                type: "error",
                closable: true,
            });
        }
        setLoading(false);
    };

    return loading ? (
        spinner
    ) : (
        <IconButton onClick={handleDelete} aria-label="delete-inventory-btn" variant="surface">
            <MdDelete size="20" />
        </IconButton>
    );
}

export function ViewInventory({ InventoryId }: { InventoryId: string }) {
    const dispatch = useAppDispatch();
    const _inventory = useAppSelector((s) => s.app.inventory.itemFullDataById[InventoryId] || null);
    const [modalOpenState, setModalOpenState] = useState(false);

    useEffect(() => {
        /* When modal opens and inventory not in state then fetch by ID */
        if (modalOpenState && !_inventory) {
            dispatch(getInventoryById(InventoryId));
        }
    }, [modalOpenState]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Dialog.Root
            onOpenChange={({ open }) => setModalOpenState(open)}
            scrollBehavior="inside"
            placement="center"
            size="sm"
        >
            <Dialog.Trigger asChild>
                <Button variant="plain" color="blue">
                    {InventoryId}
                </Button>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header p="5">
                            <Dialog.Title>Inventory Details</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>

                        {_inventory ? (
                            <Dialog.Body p="3">
                                <Box>
                                    <Text>
                                        <strong>Purchase Price:</strong> {_inventory.purchasePrice}
                                    </Text>
                                    <Text>
                                        <strong>Purchased Qty:</strong> {_inventory.purchasedQuantity}
                                    </Text>
                                    <Text>
                                        <strong>Available Qty:</strong> {_inventory.availableQuantity}
                                    </Text>
                                    <Text mt={2}>
                                        <StockStatusBadge availableQuantity={_inventory.availableQuantity} />
                                    </Text>
                                    <Text mt={3}>
                                        <strong>Description:</strong> {_inventory.product?.description}
                                    </Text>
                                </Box>
                            </Dialog.Body>
                        ) : (
                            <Dialog.Body p="3">
                                <SkeletonText noOfLines={5} gap="4" />
                            </Dialog.Body>
                        )}
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
