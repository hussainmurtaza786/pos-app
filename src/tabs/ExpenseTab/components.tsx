import { toaster } from "@/components/ui/toaster";
import { addExpense, deleteExpenseById, getExpenseById, updateExpenseById } from "@/redux/slices/app/expenseApiThunk";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { Box, Button, Dialog, IconButton, Portal, SkeletonText, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { MdDelete } from "react-icons/md";
import { spinner } from "../inventoryTab/components";
import { CloseButton } from "@/components/ui/close-button";
import { Expense } from "@prisma/client";
import Form from "@/components/Form";
import { FiPlus } from "react-icons/fi";
import { LiaEdit } from "react-icons/lia";

interface AddUpdateFormProps {
    initialValues?: Expense;
    type?: "Add" | "Update";
}


export function AddUpdateExpenseForm({ initialValues, type = "Add" }: AddUpdateFormProps) {
    const dispatch = useAppDispatch();
    const [modalOpenState, setModalOpenState] = useState(false);
    const closeButtonRef = useRef<any>(null);

    const handleSubmit = async (values: any) => {
        try {
            const ExpenseId = values.expense?.id;
            const { expense, vendor, ...restValues } = values;

            const payload = {
                ...restValues,
                ExpenseId,
            };

            if (type === "Add") {
                await dispatch(addExpense(payload as any)).unwrap();
                toaster.create({
                    type: "success",
                    title: "Expense Added",
                    description: "New Expense has been successfully added",
                    closable: true,
                });
            } else {
                await dispatch(updateExpenseById({ ...payload, id: initialValues?.id } as any)).unwrap();
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


    return (
        <Dialog.Root onOpenChange={({ open }) => setModalOpenState(open)} scrollBehavior="inside" placement="center" size="sm">
            <Dialog.Trigger asChild>
                {type === "Add" ? (
                    <Button bgColor="blue" color="white" px={3} py={2} fontSize="md">
                        {type === "Add" ? <FiPlus /> : null} {type} Expense
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
                            <Dialog.Title>{type === "Add" ? "Add New" : type} Expense </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.CloseTrigger ref={closeButtonRef} asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>

                        <Dialog.Body p="3">

                            {/* Your existing Form: keep it simple, no category field here */}
                            <Form
                                initialValues={initialValues ? { ...initialValues } : {}}
                                enableReinitialize
                                onSubmit={handleSubmit}
                                fields={[
                                    { type: "text", name: "amount", label: "Amount", fieldArea: 12, notRequired: true },
                                    { type: "text", name: "reason", label: "Reason", fieldArea: 12, notRequired: true },
                                    // category handled above
                                    // { type: "number", name: "price", label: "Price", fieldArea: 12, notRequired: true },
                                    // { type: "text", name: "description", label: "description", fieldArea: 12, notRequired: true },
                                    { type: "submit", name: "submit-btn", label: `${type} Expense`, fieldArea: 12, inputProps: { size: "sm" } },
                                ]}
                            />
                        </Dialog.Body>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>

        </Dialog.Root>
    );
}










export function DeleteExpenseHandlerButton({ expenseId }: { expenseId: string }) {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);
    const handleDelete = async () => {
        setLoading(true);
        try {


            await dispatch(deleteExpenseById(expenseId)).unwrap()
            toaster.create({
                type: "success", title: "Expense Deleted",
                description: "Expense has been deleted successfully",
                closable: true,
            });

        } catch (error: any) {
            console.log(error)
            toaster.create({
                title: "Unable To Delete Expense",
                description: error.message,
                type: "error", closable: true,
            });
        }
        setLoading(false);
    }
    return (
        loading ? spinner :
            <IconButton onClick={handleDelete} aria-label='delete-expense-btn' variant='surface'>
                <MdDelete size="20" />
            </IconButton>
    )
}

export function ViewExpense({ expenseId }: { expenseId: string }) {
    const dispatch = useAppDispatch();
    const _expense = useAppSelector(s => s.app.expenses.itemFullDataById[expenseId] || null);
    const [modalOpenState, setModalOpenState] = useState(false);

    useEffect(() => {


        if (modalOpenState && !_expense) {
            dispatch(getExpenseById(expenseId))
        }
    }, [modalOpenState])

    return (
        <Dialog.Root onOpenChange={({ open }) => setModalOpenState(open)} scrollBehavior="inside" placement='center' size="sm">
            <Dialog.Trigger asChild>
                <Button variant="plain" color='blue' >{expenseId}</Button>
            </Dialog.Trigger>
            <Portal >
                <Dialog.Backdrop />
                <Dialog.Positioner >
                    <Dialog.Content >
                        <Dialog.Header p='5' >
                            <Dialog.Title>Expense Details</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                        {_expense ?

                            <Dialog.Content p='3'>
                                {/* {_expense.media?.map(media => (
                                    <Box key={media.id} boxSize='100px' bgImg={`url(${media.url})`} bgSize='cover' bgPos='center' />
                                ))} */}
                                <Box>
                                    <Text>Amount: {_expense.amount}</Text>
                                    <Text>Reason: {_expense.reason}</Text>
                                    <Text>
                                        Created:{' '}
                                        {_expense.createdAt
                                            ? new Date(_expense.createdAt).toLocaleString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })
                                            : 'N/A'}
                                    </Text>

                                    <Text>
                                        Updated:{' '}
                                        {_expense.updatedAt
                                            ? new Date(_expense.updatedAt).toLocaleString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })
                                            : 'N/A'}
                                    </Text>

                                </Box>
                            </Dialog.Content> :

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