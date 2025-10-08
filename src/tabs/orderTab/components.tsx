'use client'
import { useEffect, useRef, useState } from "react";
import { toaster } from "@/components/ui/toaster"
import { FiPlus } from "react-icons/fi";
import { Box, Dialog, Button, Portal, Spinner, Text, SkeletonText, IconButton, Flex, Badge } from "@chakra-ui/react";
import { CloseButton } from "@/components/ui/close-button";
import Form from "@/components/Form";
import { MdDelete } from "react-icons/md";
import { LiaEdit } from "react-icons/lia";
import { Order } from "@prisma/client";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { addOrder, deleteOrderById, getOrderById, updateOrderById } from "@/redux/slices/app/orderApiThunk";

/** ---------------- Existing Order components ---------------- */

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
        await dispatch(addOrder(values)).unwrap();
        toaster.create({
          type: "success", title: "Order Added",
          description: "New order has been successfully added",
          closable: true,
        });
      } else if (type === "Update") {
        await dispatch(updateOrderById({ ...values, id: initialValues?.id })).unwrap();
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
                  { type: "select", options: ["Pending", "Completed"], name: "status", label: "Status", fieldArea: 12, notRequired: true },
                  { type: "text", name: "amountReceived", label: "Amount Received", fieldArea: 12, },
                  { type: "text", name: "discount", label: "Discount", fieldArea: 12, },

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

export function StatusBadge({ status }: { status: string }) {
  if (status === "Pending") {
    return <Badge colorPalette="yellow" variant="subtle">Pending</Badge>;
  }
  return <Badge colorPalette="green" variant="subtle">Completed</Badge>;
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
      dispatch(getOrderById(orderId));
    }
  }, [modalOpenState]); // eslint-disable-line

  return (
    <Dialog.Root
      onOpenChange={({ open }) => setModalOpenState(open)}
      scrollBehavior="inside"
      placement="center"
      size="sm"
    >
      <Dialog.Trigger asChild>
        <Button variant="subtle" colorScheme="blue" size="sm">
          View #{orderId}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="lg" boxShadow="lg" bg="white">
            <Dialog.Header p="5" borderBottom="1px solid" borderColor="gray.200">
              <Dialog.Title fontWeight="bold" fontSize="xl" color="blue.600">
                Order Details
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" position="absolute" top="4" right="4" />
            </Dialog.CloseTrigger>

            {_order ? (
              <Dialog.Body p="5">
                <Box fontSize="sm" color="gray.700">
                  <Text mb="2">
                    <strong>Description:</strong> {_order.description || "—"}
                  </Text>

                  <Box mt="4">
                    <Text fontWeight="semibold" fontSize="md" mb="2" color="blue.500">
                      Products
                    </Text>
                    {_order.ProductInOrder?.map((pro: any) => (
                      <Flex
                        key={`${pro.orderId}-${pro.productId}`}
                        justify="space-between"
                        align="center"
                        p="3"
                        mb="2"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="md"
                        _hover={{ bg: "gray.50" }}
                      >
                        <Box>
                          <Text fontWeight="medium">{pro.product?.name}</Text>
                          <Text fontSize="xs" color="gray.500">
                            Qty: {pro.quantity}
                          </Text>
                        </Box>
                        <Text fontWeight="semibold">{pro.sellPrice}</Text>
                      </Flex>
                    ))}
                  </Box>
                </Box>
              </Dialog.Body>
            ) : (
              <Dialog.Body p="5">
                <SkeletonText noOfLines={6} />
              </Dialog.Body>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

/** ---------------- New: ViewReturn modal + types for Return History ---------------- */

export type ReturnRow = {
  id: number; // Return Id
  createdAt: string; // ISO date
  description?: string;
  products: { name: string; quantity: number; sellPrice: number }[]; // returned lines
};

export function ViewReturn({ ret }: { ret: ReturnRow }) {
  const total = ret.products.reduce((acc, p) => acc + p.sellPrice * p.quantity, 0);

  return (
    <Dialog.Root scrollBehavior='inside' placement='center' size='sm'>
      <Dialog.Trigger asChild>
        <Button variant='subtle' colorScheme='blue' size='sm'>View #{ret.id}</Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius='lg' boxShadow='lg' bg='white'>
            <Dialog.Header p='5' borderBottom='1px solid' borderColor='gray.200'>
              <Dialog.Title fontWeight='bold' fontSize='xl' color='blue.600'>
                Return Details
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size='sm' position='absolute' top='4' right='4' />
            </Dialog.CloseTrigger>

            <Dialog.Body p='5'>
              <Box fontSize='sm' color='gray.700'>
                <Text mb='2'><strong>Reason:</strong> {ret.description || '—'}</Text>
                <Text mb='2'><strong>Date:</strong> {new Date(ret.createdAt).toLocaleString()}</Text>

                <Box mt='4'>
                  <Text fontWeight='semibold' fontSize='md' mb='2' color='blue.500'>Products</Text>
                  {ret.products.map((pro, idx) => (
                    <Flex
                      key={`${ret.id}-${idx}`}
                      justify='space-between'
                      align='center'
                      p='3'
                      mb='2'
                      border='1px solid'
                      borderColor='gray.200'
                      borderRadius='md'
                    >
                      <Box>
                        <Text fontWeight='medium'>{pro.name}</Text>
                        <Text fontSize='xs' color='gray.500'>Qty: {pro.quantity}</Text>
                      </Box>
                      <Text fontWeight='semibold'>Rs {pro.sellPrice}</Text>
                    </Flex>
                  ))}
                  <Box mt='2' borderTop='1px solid' borderColor='gray.200' />
                  <Flex justify='space-between' mt='2'>
                    <Text fontWeight='bold'>Total</Text>
                    <Text fontWeight='bold'>Rs {total.toFixed(2)}</Text>
                  </Flex>
                </Box>
              </Box>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
