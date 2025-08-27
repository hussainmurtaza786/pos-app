'use client'
import { RootState, useAppDispatch, useAppSelector } from "@/redux/store";
import { useEffect, useRef, useState } from "react";
import { toaster } from "@/components/ui/toaster"
import { FiPlus } from "react-icons/fi";
import { Box, Dialog, Flex, Button, FormatByte, IconButton, Input, Portal, Spinner, Text, SkeletonText } from "@chakra-ui/react";
import { CloseButton } from "@/components/ui/close-button";
import { MdDelete } from "react-icons/md";
import { Category, } from "@prisma/client";
import { authorizedApiClient } from "@/utils";
import { IoCloseSharp } from "react-icons/io5";
import { useField } from "formik";
import { FaImage } from "react-icons/fa";
import { Product } from "@/prisma/customTypes";
import { LiaEdit } from "react-icons/lia";
import { showDialog } from "@/components/Dialog";
import Form from "@/components/Form";
import { addProduct, deleteProductById, getProductById, updateProductById } from "@/redux/slices/app/productApiThunks";
import { CategoriesGetInput, CategoriesGetOutput } from "@/app/api/category/route";
import { useSelector } from "react-redux";

interface AddUpdateFormProps {
    initialValues?: Product,
    type?: "Add" | "Update",
}
export function AddUpdateProductForm({ initialValues, type = 'Add' }: AddUpdateFormProps) {
    const dispatch = useAppDispatch();
    const [modalOpenState, setModalOpenState] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const loadCategories = async () => {
        const { data } =
            await authorizedApiClient.get<CategoriesGetOutput>(`/api/category`, {
                params: { pageNumber: 1, pageSize: 100 } as CategoriesGetInput,
            });

        setCategories(data.data);
    };

    useEffect(() => {
        if (modalOpenState) {
            loadCategories();
        }
    }, [modalOpenState]);

    const closeButtonRef = useRef<any>(null);
    const handleSubmit = async (values: any,) => {
        console.log("values ==>", values);
        const productId = values.product?.id
        const vendorId = values.vendor?.id
        const { product, vendor, ...restValues } = values
        console.log("productId ==>", productId);
        try {
            if (type === "Add") {
                const res = await dispatch(addProduct({ ...restValues, productId, })).unwrap();
                console.log('res ==>', res);
                toaster.create({
                    type: "success", title: "Inventory Added",
                    description: "New inventory has been successfully added",
                    closable: true,
                });
            } else if (type === "Update") {
                const res = await dispatch(updateProductById({ ...restValues, productId, id: initialValues?.id })).unwrap();
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

                                } : {}}
                                enableReinitialize
                                onSubmit={handleSubmit}

                                // onChange={({ values: { form: values } }: any) => {
                                //     // console.log("values == >", values)
                                // }}
                                fields={[
                                    { type: "text", name: "name", label: "Name", fieldArea: 12, notRequired: true },
                                    { type: "text", name: "sku", label: "Sku", fieldArea: 12, notRequired: true },
                                    { type: "select", name: "categoryId", label: "Category", fieldArea: 12, options: categories.map(c => ({ label: c.name, value: c.id })) },
                                    { type: "text", name: "description", label: "description", fieldArea: 12, notRequired: true },
                                    { type: "text", name: "price", label: "Price", fieldArea: 12, notRequired: true },
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

export function DeleteProductHandlerButton({ productId }: { productId: string }) {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);
    const handleDelete = async () => {
        setLoading(true);
        try {


            await dispatch(deleteProductById(productId)).unwrap()
            toaster.create({
                type: "success", title: "Product Deleted",
                description: "Product has been deleted successfully",
                closable: true,
            });

        } catch (error: any) {
            console.log(error)
            toaster.create({
                title: "Unable To Delete Product",
                description: error.message,
                type: "error", closable: true,
            });
        }
        setLoading(false);
    }
    return (
        loading ? <Spinner /> :
            <IconButton onClick={handleDelete} aria-label='delete-product-btn' variant='surface'>
                <MdDelete size="20" />
            </IconButton>
    )
}

export function ViewProduct({ productId }: { productId: string }) {
    const dispatch = useAppDispatch();
    const _product = useAppSelector(s => s.app.products.itemFullDataById[productId] || null);
    const [modalOpenState, setModalOpenState] = useState(false);

    useEffect(() => {
        /* When modal is open and no _product found in state then fetch product by ID */
        if (modalOpenState && !_product) {
            dispatch(getProductById(productId))
        }
    }, [modalOpenState])

    return (
        <Dialog.Root onOpenChange={({ open }) => setModalOpenState(open)} scrollBehavior="inside" placement='center' size="sm">
            <Dialog.Trigger asChild>
                <Button variant="plain" color='blue' >{productId}</Button>
            </Dialog.Trigger>
            <Portal >
                <Dialog.Backdrop />
                <Dialog.Positioner >
                    <Dialog.Content >
                        <Dialog.Header p='5' >
                            <Dialog.Title>Product Details</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                        {_product ?

                            <Dialog.Body p='3'>
                                {/* {_product.media?.map(media => (
                                    <Box key={media.id} boxSize='100px' bgImg={`url(${media.url})`} bgSize='cover' bgPos='center' />
                                ))} */}
                                <Box>
                                    <Text>Name: {_product.name}</Text>
                                    <Text>SKU: {_product.sku}</Text>
                                    <Text>Price: {_product.price}</Text>
                                    <Text>Description: {_product.description}</Text>

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