'use client'
import { useEffect, useRef, useState } from "react";
import { toaster } from "@/components/ui/toaster"
import { FiPlus } from "react-icons/fi";
import { Box, Dialog, Button, IconButton, Portal, Spinner, Text, SkeletonText } from "@chakra-ui/react";
import { CloseButton } from "@/components/ui/close-button";
import Form from "@/components/Form";
import { MdDelete } from "react-icons/md";
import { LiaEdit } from "react-icons/lia";
import { Product } from "@/prisma/customTypes";
import { useField } from "formik";
import { IoCloseSharp } from "react-icons/io5";
import { useAppDispatch, useAppSelector } from "@/redux/store";

import SearchProduct from "../common/SearchProduct";
import { addProductInOrder, deleteProductInOrderById, getProductInOrderById, updateProductInOrderById } from "@/redux/slices/app/productInOrderApiThunk";

// ========================
// ADD / UPDATE FORM
// ========================
interface AddUpdateFormProps {
  initialValues?: any,
  type?: "Add" | "Update",
}
export function AddUpdateProductInOrderForm({ initialValues, type = 'Add' }: AddUpdateFormProps) {
  const dispatch = useAppDispatch();
  const [modalOpenState, setModalOpenState] = useState(false);
  const closeButtonRef = useRef<any>(null);

  const handleSubmit = async (values: any) => {
    console.log("values ==>", values);
    const productId = values.product?.id;
    const { product, ...restValues } = values;

    try {
      if (type === "Add") {
        const res = await dispatch(addProductInOrder({ ...restValues, productId })).unwrap();
        toaster.create({
          type: "success", title: "Product In Order Added",
          description: "New record has been successfully added",
          closable: true,
        });
      } else if (type === "Update") {
        const res = await dispatch(updateProductInOrderById({
          ...restValues,
          productId,
          orderId: initialValues?.orderId,
        })).unwrap();
        toaster.create({
          type: "success", title: "Details updated",
          description: "ProductInOrder details updated successfully",
          closable: true,
        });
      }
      closeButtonRef.current?.click();
    } catch (error: any) {
      toaster.create({
        title: type === "Add" ? "Unable To Add" : "Unable To Update",
        description: error.message,
        type: "error", closable: true,
      });
    }
  }

  return (
    <Dialog.Root onOpenChange={({ open }) => setModalOpenState(open)} scrollBehavior="inside" placement='center' size="sm">
      <Dialog.Trigger asChild>
        {type === "Add" ?
          <Button bgColor='blue' color="white" px={3} py={2} fontSize="md">
            {type === 'Add' ? <FiPlus /> : null} {type} Product In Order
          </Button>
          : type === "Update" ?
            <IconButton variant='subtle' ><LiaEdit size={20} /></IconButton>
            : null
        }
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header p='5'>
              <Dialog.Title> {type === 'Add' ? "Add New" : type} Product In Order</Dialog.Title>
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
                  { type: "text", name: "orderId", label: "Order ID", fieldArea: 12, notRequired: false },
                  {
                    type: "custom", name: "product", label: "Product", fieldArea: 12,
                    CustomField({ name, label, scope }) {
                      const [field, meta] = useField<Product | null>(name);
                      const prod = field.value;
                      const handleSelect = (product: Product) => {
                        scope.formikProps.setFieldValue(name, product, true);
                      }
                      const handleDeSelect = () => {
                        scope.formikProps.setFieldValue(name, null, true);
                      }
                      return (
                        <>
                          <Text>{label}</Text>
                          {prod ?
                            <Box pos="relative">
                              <Text>{prod.name}</Text>
                              <IconButton
                                onClick={handleDeSelect}
                                float='right'
                                size='xs'
                                variant='surface'
                              >
                                <IoCloseSharp />
                              </IconButton>
                            </Box>
                            :
                            <SearchProduct onSelect={handleSelect} />
                          }
                          {meta.touched && <Text color='fg.error'>{meta.error}</Text>}
                        </>
                      )
                    },
                  },
                  { type: "text", name: "quantity", label: "Quantity", fieldArea: 12 },
                  { type: "text", name: "sellPrice", label: "Sell Price", fieldArea: 12 },
                  { type: "text", name: "inventoryId", label: "Inventory Id", fieldArea: 12, notRequired: true },
                  { type: "text", name: "returnOrderId", label: "Return Order Id", fieldArea: 12, notRequired: true },
                  { type: "submit", name: "submit-btn", label: `${type} Product In Order`, fieldArea: 12 },
                ]}
              />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

// ========================
// DELETE HANDLER
// ========================
export function DeleteProductInOrderHandlerButton({ orderId, productId }: { orderId: number, productId: string }) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await dispatch(deleteProductInOrderById({ orderId, productId })).unwrap();
      toaster.create({
        type: "success", title: "Deleted",
        description: "Product In Order deleted successfully",
        closable: true,
      });
    } catch (error: any) {
      toaster.create({
        title: "Unable To Delete",
        description: error.message,
        type: "error", closable: true,
      });
    }
    setLoading(false);
  }

  return (
    loading ? <Spinner /> :
      <IconButton onClick={handleDelete} aria-label='delete-product-in-order-btn' variant='surface'>
        <MdDelete size="20" />
      </IconButton>
  )
}

// ========================
// VIEW HANDLER
// ========================
export function ViewProductInOrder({ orderId, productId }: { orderId: number, productId: string }) {
  const dispatch = useAppDispatch();
  const compositeId = `${orderId}-${productId}`;
  const _pio = useAppSelector(s => s.app.productInOrder.itemFullDataById[compositeId] || null);
  const [modalOpenState, setModalOpenState] = useState(false);

  useEffect(() => {
    if (modalOpenState && !_pio) {
      dispatch(getProductInOrderById({ orderId, productId }))
    }
  }, [modalOpenState])

  return (
    <Dialog.Root onOpenChange={({ open }) => setModalOpenState(open)} scrollBehavior="inside" placement='center' size="sm">
      <Dialog.Trigger asChild>
        <Button variant="plain" color='blue'>{compositeId}</Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header p='5'>
              <Dialog.Title>Product In Order Details</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            {_pio ?
              <Dialog.Body p='3'>
                <Box>
                  <Text><strong>Order ID:</strong> {_pio.orderId}</Text>
                  <Text><strong>Quantity:</strong> {_pio.quantity}</Text>
                  <Text><strong>Sell Price:</strong> {_pio.sellPrice}</Text>
                  <Text><strong>Return Order ID:</strong> {_pio.product?.name}</Text>
                  <Text><strong>Return Order ID:</strong> {_pio.product?.price}</Text>
                  {/* <Text><strong>Return Order ID:</strong> {_pio..status}</Text> */}
                  {/* <Text><strong>Return Order ID:</strong> {_pio.order.discount}</Text> */}
                </Box>
              </Dialog.Body>
              :
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
