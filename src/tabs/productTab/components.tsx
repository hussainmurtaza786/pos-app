'use client'
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useEffect, useRef, useState } from "react";
import { toaster } from "@/components/ui/toaster"
import { FiPlus } from "react-icons/fi";
import { Box, Dialog, Button, IconButton, Input, Portal, Text, SkeletonText, HStack } from "@chakra-ui/react";
import { CloseButton } from "@/components/ui/close-button";
import { MdDelete } from "react-icons/md";
import { Category, } from "@prisma/client";
import { authorizedApiClient } from "@/utils";
import { Product } from "@/prisma/customTypes";
import { LiaEdit } from "react-icons/lia";
import Form from "@/components/Form";
import { addProduct, deleteProductById, getProductById, updateProductById } from "@/redux/slices/app/productApiThunks";
import { CategoriesGetInput, CategoriesGetOutput, CategoryPostInput } from "@/app/api/category/route";
import { spinner } from "../inventoryTab/components";
interface AddUpdateFormProps {
    initialValues?: Product;
    type?: "Add" | "Update";
}

export function AddUpdateProductForm({ initialValues, type = "Add" }: AddUpdateFormProps) {
    const dispatch = useAppDispatch();
    const [modalOpenState, setModalOpenState] = useState(false);

    // categories + selection
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(initialValues?.categoryId);

    // add-category dialog state
    const [addCatOpen, setAddCatOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const loadCategories = async () => {
        const { data } = await authorizedApiClient.get(`/api/category`, {
            params: { pageNumber: 1, pageSize: 100 } as CategoriesGetInput,
        });
        setCategories((data as CategoriesGetOutput).data);
    };

    useEffect(() => {
        if (modalOpenState) {
            loadCategories();
        }
    }, [modalOpenState]);

    // ensure initial category shows on edit
    useEffect(() => {
        if (initialValues?.categoryId) setSelectedCategoryId(initialValues.categoryId);
    }, [initialValues?.categoryId]);

    const closeButtonRef = useRef<any>(null);

    const handleSubmit = async (values: any) => {
        try {
            const productId = values.product?.id;
            const { product, vendor, ...restValues } = values;

            const payload = {
                ...restValues,
                productId,
                categoryId: selectedCategoryId ?? null, // inject selected category
            };

            if (type === "Add") {
                await dispatch(addProduct(payload as any)).unwrap();
                toaster.create({
                    type: "success",
                    title: "Product Added",
                    description: "New Product has been successfully added",
                    closable: true,
                });
            } else {
                await dispatch(updateProductById({ ...payload, id: initialValues?.id } as any)).unwrap();
                toaster.create({
                    type: "success",
                    title: "Details updated",
                    description: "Account details has been updated successfully",
                    closable: true,
                });
            }
            closeButtonRef.current?.click();
        } catch (error: any) {
            toaster.create({
                title: type === "Add" ? "Unable To Add New Account" : "Unable Update Account Details",
                description: error.message,
                type: "error",
                closable: true,
            });
        }
    };

    const createCategory = async () => {
        try {
            if (!newCategoryName.trim()) {
                toaster.create({ type: "error", title: "Category name required" });
                return;
            }

            // no CategoryPostOutput typing here
            const res = await authorizedApiClient.post("/api/category", {
                name: newCategoryName.trim(),
            } as CategoryPostInput);

            // refresh & select the newly created category
            await loadCategories();
            // res.data?.data is expected; fall back safely
            const created = (res as any)?.data?.data;
            if (created?.id) setSelectedCategoryId(created.id);

            setNewCategoryName("");
            setAddCatOpen(false);
            toaster.create({ type: "success", title: "Category created" });
        } catch (e: any) {
            toaster.create({
                type: "error",
                title: "Failed to create category",
                description: e?.response?.data?.message ?? e.message,
            });
        }
    };

    return (
        <Dialog.Root onOpenChange={({ open }) => setModalOpenState(open)} scrollBehavior="inside" placement="center" size="sm">
            <Dialog.Trigger asChild>
                {type === "Add" ? (
                    <Button bgColor="blue" color="white" px={3} py={2} fontSize="md">
                        {type === "Add" ? <FiPlus /> : null} {type} Products
                    </Button>
                ) : type === "Update" ? (
                    <IconButton variant="subtle">
                        <LiaEdit size={20} />
                    </IconButton>
                ) : null}
            </Dialog.Trigger>

            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header p="5">
                            <Dialog.Title>{type === "Add" ? "Add New" : type} Product </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.CloseTrigger ref={closeButtonRef} asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>

                        <Dialog.Body p="3">
                            {/* Category row: native select + Add button (no FormControl/FormLabel/Select) */}
                            <div style={{ marginBottom: "12px" }}>
                                <div style={{ fontSize: 14, marginBottom: 6 }}>Category</div>
                                <HStack gap={2} align="start">
                                    <select
                                        style={{
                                            width: "100%",
                                            padding: "8px 10px",
                                            border: "1px solid var(--chakra-colors-gray-300)",
                                            borderRadius: 6,
                                            outline: "none",
                                        }}
                                        value={selectedCategoryId ?? ""}
                                        onChange={(e) => setSelectedCategoryId(e.target.value || undefined)}
                                    >
                                        <option value="" disabled>
                                            {categories.length ? "Select category" : "No Categories available"}
                                        </option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>

                                    <IconButton aria-label="Add category" title="Add category" onClick={() => setAddCatOpen(true)}>
                                        <FiPlus />
                                    </IconButton>
                                </HStack>
                            </div>

                            {/* Your existing Form: keep it simple, no category field here */}
                            <Form
                                initialValues={initialValues ? { ...initialValues } : {}}
                                enableReinitialize
                                onSubmit={handleSubmit}
                                fields={[
                                    { type: "text", name: "name", label: "Name", fieldArea: 12, notRequired: true },
                                    { type: "text", name: "sku", label: "Sku", fieldArea: 12, notRequired: true },
                                    // category handled above
                                    { type: "number", name: "price", label: "Selling Price", fieldArea: 12, notRequired: true },
                                    { type: "text", name: "description", label: "description", fieldArea: 12, notRequired: true },
                                    { type: "submit", name: "submit-btn", label: `${type} Product`, fieldArea: 12, inputProps: { size: "sm" } },
                                ]}
                            />
                        </Dialog.Body>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>

            {/* Add Category mini dialog */}
            <Dialog.Root open={addCatOpen} onOpenChange={({ open }) => setAddCatOpen(open)} placement="center" size="xs">
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header p="4">
                                <Dialog.Title>Add Category</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body p="4">
                                <div style={{ fontSize: 14, marginBottom: 6 }}>Name</div>
                                <Input
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g., Electronics"
                                />
                            </Dialog.Body>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 16 }}>
                                <Button variant="subtle" onClick={() => setAddCatOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={createCategory}>Save</Button>
                            </div>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </Dialog.Root>
    );
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
        loading ? spinner :
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
                                    <Text>Selling Price: {_product.price}</Text>
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