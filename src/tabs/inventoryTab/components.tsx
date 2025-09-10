'use client'
import { useEffect, useRef, useState } from "react";
import { toaster } from "@/components/ui/toaster"
import { FiPlus } from "react-icons/fi";
import { Box, Dialog, Flex, Button, FormatByte, IconButton, Input, Portal, Spinner, Text, SkeletonText, Image } from "@chakra-ui/react";
import { CloseButton } from "@/components/ui/close-button";
import Form from "@/components/Form";
import { MdDelete } from "react-icons/md";
import { LiaEdit } from "react-icons/lia";
import { showDialog } from "@/components/Dialog";
import { Inventory } from "@prisma/client";
import SearchProduct from "../common/SearchProduct";
import { Product } from "@/prisma/customTypes";
import { useField } from "formik";
import { IoCloseSharp } from "react-icons/io5";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { addInventory, deleteInventoryById, getInventoryById, updateInventoryById } from "@/redux/slices/app/inventoryApiThunks";
interface AddUpdateFormProps {
    initialValues?: Inventory,
    type?: "Add" | "Update",
}
export function AddUpdateInventoryForm({ initialValues, type = 'Add' }: AddUpdateFormProps) {
    const dispatch = useAppDispatch();
    const [modalOpenState, setModalOpenState] = useState(false);
    const closeButtonRef = useRef<any>(null);
    const handleSubmit = async (values: any,) => {
        console.log("values ==>", values);
        const productId = values.product?.id
        const vendorId = values.vendor?.id
        const { product, vendor, ...restValues } = values
        console.log("productId ==>", productId);
        try {
            if (type === "Add") {
                const res = await dispatch(addInventory({ ...restValues, productId, })).unwrap();
                console.log('res ==>', res);
                toaster.create({
                    type: "success", title: "Inventory Added",
                    description: "New inventory has been successfully added",
                    closable: true,
                });
            } else if (type === "Update") {
                const res = await dispatch(updateInventoryById({ ...restValues, productId, id: initialValues?.id })).unwrap();
                toaster.create({
                    type: "success", title: "Details updated",
                    description: "Account details has been updated successfully",
                    closable: true,
                });
            }
            closeButtonRef.current?.click(); // close modal on success
        } catch (error: any) {
            console.log(error.message)
            toaster.create({
                title: type === "Add" ? "Unable To Add New Account" : "Unable Update Account Details",
                description: error.message,
                type: "error", closable: true,
            });
        }
    }



    return (
        <Dialog.Root onOpenChange={({ open }) => setModalOpenState(open)} scrollBehavior="inside" placement='center' size="sm">
            <Dialog.Trigger asChild>
                {type === "Add" ?
                    <Button bgColor='blue' color="white" px={3} py={2} fontSize="md">{type === 'Add' ? <FiPlus /> : null} {type} Inventory</Button>
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
                            <Dialog.Title> {type === 'Add' ? "Add New" : type} Inventory</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.CloseTrigger ref={closeButtonRef} asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                        <Dialog.Body p='3'>
                            <Form
                                initialValues={initialValues ? {
                                    ...initialValues,
                                    quantity: initialValues.purchasedQuantity,
                                } : {}}
                                enableReinitialize
                                onSubmit={handleSubmit}

                                // onChange={({ values: { form: values } }: any) => {
                                //     // console.log("values == >", values)    
                                // }}
                                fields={[
                                    // { type: "text", name: "name", label: "Name", fieldArea: 12, notRequired: true },
                                    // {
                                    //     type: "custom", name: "vendor", label: "Vendor", fieldArea: 12,
                                    //     CustomField({ name, label, value, scope }) {
                                    //         const [field, meta, helper] = useField<Vendor | null>(name);
                                    //         const handleSelect = (vendor: Vendor) => {

                                    //             scope.formikProps.setFieldValue(name, vendor, true);
                                    //         }
                                    //         const handleDeSelect = () => {
                                    //             scope.formikProps.setFieldValue(name, null, true);
                                    //         }
                                    //         return (
                                    //             <>
                                    //                 <Text >{label}</Text>
                                    //                 {/* <SearchVendor onSelect={handleSelect} value={field.value} onRemove={handleDeSelect} /> */}
                                    //                 {meta.touched && <Text color='fg.error'>{meta.error}</Text>}
                                    //             </>
                                    //         )
                                    //     },
                                    // },

                                    // { type: "text", name: "productId", label: "Product ", fieldArea: 12, notRequired: true },
                                    {
                                        type: "custom", name: "product", label: "Product", fieldArea: 12,
                                        CustomField({ name, label, value, scope }) {
                                            const [field, meta, helper] = useField<Product | null>(name);
                                            const prod = field.value;
                                            // const [prod, setProd] = useState<Product | null>(null);
                                            const handleSelect = (product: Product) => {
                                                // setProd(product);
                                                scope.formikProps.setFieldValue(name, product, true);
                                            }
                                            const handleDeSelect = () => {
                                                scope.formikProps.setFieldValue(name, null, true);
                                            }
                                            return (
                                                <>
                                                    <Text >{label}</Text>
                                                    {prod ?
                                                        <Box pos="relative" >
                                                            {/* <Box onClick={handleDeSelect} aria-label="Product-image"
                                                                boxSize='100px'  bgSize='cover' bgPos='center' borderRadius='md' mb='2'
                                                            /> */}
                                                            {/* <Box ml='auto' mr='5' boxSize='100px' boxShadow='lg' bgImg={`url(${prod.media[0]?.url})`} bgRepeat='no-repeat' bgPos='center' bgSize='cover' >
                                                                <IconButton onClick={handleDeSelect} float='right' transform='auto' translateX='3' translateY='-3' size='xs' p='0' variant='surface' colorPalette='gray'><IoCloseSharp /></IconButton>
                                                            </Box> */}
                                                            <Text>{prod.name}</Text>
                                                        </Box> :
                                                        <SearchProduct onSelect={handleSelect} />
                                                    }
                                                    {meta.touched && <Text color='fg.error'>{meta.error}</Text>}
                                                </>
                                            )
                                        },
                                    },
                                    { type: "text", name: "quantity", label: "Quantity", fieldArea: 12, notRequired: true },
                                    { type: "text", name: "purchasePrice", label: "Purchase Price", fieldArea: 12, notRequired: true },
                                    { type: "submit", name: "submit-btn", label: `${type} Inventory`, fieldArea: 12, inputProps: { size: 'sm' } },

                                ]}
                            />
                            {/* <MediaUploadField /> */}
                        </Dialog.Body>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )

}

export function DeleteInventoryHandlerButton({ inventoryId }: { inventoryId: string }) {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);
    const handleDelete = async () => {
        setLoading(true);
        console.log("Delete clicked for ID:", inventoryId);
        try {

            await dispatch(deleteInventoryById(inventoryId)).unwrap()
            toaster.create({
                type: "success", title: "Inventory Deleted",
                description: "Inventory has been deleted successfully",
                closable: true,
            });

        } catch (error: any) {
            console.log(error)
            toaster.create({
                title: "Unable To Delete Inventory",
                description: error.message,
                type: "error", closable: true,
            });
        }
        setLoading(false);
    }
    return (
        loading ? <Spinner /> :
            <IconButton onClick={handleDelete} aria-label='delete-inventory-btn' variant='surface'>
                <MdDelete size="20" />
            </IconButton>
    )
}

export function ViewInventory({ InventoryId }: { InventoryId: string }) {
    const dispatch = useAppDispatch();
    const _inventory = useAppSelector(s => s.app.inventory.itemFullDataById[InventoryId] || null);
    const [modalOpenState, setModalOpenState] = useState(false);

    useEffect(() => {
        /* When modal is open and no _vendor found in state then fetch vendor by ID */
        if (modalOpenState && !_inventory) {
            dispatch(getInventoryById(InventoryId))
        }
    }, [modalOpenState])

    return (
        <Dialog.Root onOpenChange={({ open }) => setModalOpenState(open)} scrollBehavior="inside" placement='center' size="sm">
            <Dialog.Trigger asChild>
                <Button variant="plain" color='blue' >{InventoryId}</Button>
            </Dialog.Trigger>
            <Portal >
                <Dialog.Backdrop />
                <Dialog.Positioner >
                    <Dialog.Content >
                        <Dialog.Header p='5' >
                            <Dialog.Title>Inventory Details</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                        {_inventory ?
                            <Dialog.Body p='3'>
                                <Box>
                                    {/* <img src={_inventory.product?.media[0]?.url} alt="Product Image" style={{ width: '100px', height: '100px', objectFit: 'cover' }} /> */}
                                    {/* <Text><strong>Product Name:</strong> {_inventory.product?.name}</Text> */}
                                    <Text><strong>Purchase Price:</strong> {_inventory.purchasePrice}</Text>
                                    <Text><strong>Purchased Qty:</strong> {_inventory.purchasedQuantity}</Text>
                                    <Text><strong>Available Qty:</strong> {_inventory.availableQuantity}</Text>
                                    <Text><strong>Description:</strong> {_inventory.product?.description}</Text>
                                    {/* <Text><strong>Vendor:</strong> {_inventory.?.name}</Text> */}

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