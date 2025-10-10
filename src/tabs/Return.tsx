'use client';
import React, { useMemo, useState } from "react";
import {
  Box, Flex, Stack, Heading, Text, Input, Badge, IconButton,
  Button, HStack, VStack, Spacer
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { BiMinus, BiPlus, BiX } from "react-icons/bi";
import { CgShoppingCart } from "react-icons/cg";
import SearchProduct from "./common/SearchProduct";
import type { Product as PrismaProduct } from "@prisma/client";
import { useAppDispatch } from "@/redux/store";
import { addReturn } from "@/redux/slices/app/returnApiThunk";

type Product = PrismaProduct;

interface CartItem {
  product: Product;
  quantity: number;
  sellPrice: number;
}

const currency = (n: number) => `${n.toFixed(2)}rs`;

export default function ReturnPage() {
  const dispatch = useAppDispatch();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState<string>("");

  // REQUIRED: user must enter this; we do not auto-fill it
  const [cashReturned, setCashReturned] = useState<string>("");
  const [cashError, setCashError] = useState<string>("");

  const borderCol = "gray.200";

  // ---- Cart ops ----
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1, sellPrice: product.price ?? 0 }];
    });
  };

  const updateCartQuantity = (productId: string, change: number) => {
    setCart(curr =>
      curr
        .map(i => {
          if (i.product.id !== productId) return i;
          const nextQty = i.quantity + change;
          if (nextQty <= 0) return null;
          return { ...i, quantity: nextQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateSellPrice = (productId: string, value: string) => {
    const num = Number(value);
    if (value === "" || Number.isNaN(num)) return;
    setCart(curr =>
      curr.map(i => (i.product.id === productId ? { ...i, sellPrice: Math.max(0, num) } : i))
    );
  };

  const removeFromCart = (productId: string) =>
    setCart(curr => curr.filter(i => i.product.id !== productId));

  const subtotal = useMemo(
    () => cart.reduce((t, i) => t + (i.sellPrice || 0) * i.quantity, 0),
    [cart]
  );

  // ---- Validation ----
  const validateCash = (): boolean => {
    if (cashReturned.trim() === "") {
      setCashError("Cash returned is required.");
      return false;
    }
    const n = Number(cashReturned);
    if (Number.isNaN(n)) {
      setCashError("Enter a valid number.");
      return false;
    }
    if (n < 0) {
      setCashError("Cash cannot be negative.");
      return false;
    }
    if (n > subtotal) {
      setCashError("Cash returned cannot exceed total refund amount.");
      return false;
    }
    setCashError("");
    return true;
  };

  // ---- Save Return (redux thunk -> API) ----
  const handleSubmit = async () => {
    if (cart.length === 0) {
      toaster.create({ type: "warning", title: "Cart is empty", closable: true });
      return;
    }

    const okCash = validateCash();
    if (!okCash) {
      toaster.create({ type: "warning", title: "Please fix the Cash Returned field.", closable: true });
      return;
    }

    try {
      setSubmitting(true);

      await dispatch(
        addReturn({
          description: reason,
          returnAmount: Number(cashReturned), // <-- REQUIRED TOP-LEVEL FIELD
          products: cart.map(i => ({
            productId: i.product.id,
            quantity: i.quantity,
            sellPrice: i.sellPrice,
          })),
        } as any)
      ).unwrap();

      toaster.create({ type: "success", title: "Return saved", closable: true });

      // Reset
      setCart([]);
      setReason("");
      setCashReturned("");
      setCashError("");
    } catch (err: any) {
      toaster.create({
        type: "error",
        title: "Failed to save return",
        description: err?.message ?? "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex p={{ base: 4, lg: 6 }} gap={{ base: 4, lg: 6 }} direction={{ base: "column", lg: "row" }} h="full">
      {/* Left: Product search */}
      <Box flex="1">
        <Heading size="lg" mb={1}>Create Return</Heading>
        <Text color="gray.500" mb={4}>
          Select products and quantities to add back into inventory
        </Text>

        <Box bg="white" border="1px solid" borderColor={borderCol} rounded="xl" p={4}>
          <SearchProduct onAddToCart={addToCart} />
        </Box>
      </Box>

      {/* Right: Cart */}
      <Box
        w={{ base: "full", lg: "520px" }}
        bg="white"
        rounded="xl"
        shadow="sm"
        border="1px solid"
        borderColor={borderCol}
        p={{ base: 4, lg: 6 }}
      >
        <HStack mb={6}>
          <Box as={CgShoppingCart} boxSize={5} color="blue.600" />
          <Heading size="md">Return Cart</Heading>
          <Badge color="blue" fontSize="0.8rem" rounded="full">
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </Badge>
        </HStack>

        <Stack>
          {cart.map(item => (
            <Box key={item.product.id} p={3} border="1px solid" borderColor={borderCol} rounded="md" _notFirst={{ mt: 2 }}>
              <Flex align="center" justify="space-between" gap={3}>
                <Text fontWeight="medium">{item.product.name}</Text>
                <HStack>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label="Decrease quantity"
                    onClick={() => updateCartQuantity(item.product.id, -1)}
                  ><BiMinus size={18} /></IconButton>
                  <Text fontWeight="semibold" fontSize="lg" w="6" textAlign="center">
                    {item.quantity}
                  </Text>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label="Increase quantity"
                    onClick={() => updateCartQuantity(item.product.id, 1)}
                  ><BiPlus size={18} /></IconButton>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label="Remove item"
                    onClick={() => removeFromCart(item.product.id)}
                  ><BiX size={18} color="red" /></IconButton>
                </HStack>
              </Flex>

              <HStack mt={2}>
                <Text fontSize="sm" color="gray.600">Refund Price</Text>
                <Spacer />
                <Input
                  type="number"
                  size="sm"
                  w="32"
                  textAlign="right"
                  value={item.sellPrice}
                  onChange={(e) => updateSellPrice(item.product.id, e.target.value)}
                  min={0}
                />
              </HStack>
            </Box>
          ))}
        </Stack>

        {cart.length > 0 && (
          <>
            <Box my={4} borderTop="1px solid" borderColor={borderCol} />
            <VStack align="stretch" fontSize="sm" gap={3}>
              <HStack>
                <Text>Refund Sub-Total</Text>
                <Spacer />
                <Text>{currency(subtotal)}</Text>
              </HStack>

              <VStack align="stretch" gap={1}>
                <Text fontSize="sm" color="gray.700">Reason / Notes</Text>
                <Input
                  placeholder="Return reason / notes"
                  size="sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </VStack>

              <VStack align="stretch" gap={1}>
                <Text fontSize="sm" color="gray.700">Cash Returned *</Text>
                <Input
                  type="number"
                  size="sm"
                  textAlign="right"
                  value={cashReturned}
                  onChange={(e) => {
                    setCashReturned(e.target.value);
                    if (cashError) setCashError("");
                  }}
                  onBlur={validateCash}
                  placeholder="Enter cash given back to customer"
                  min={0}
                />
                {cashError && <Text fontSize="xs" color="red.500">{cashError}</Text>}
              </VStack>

              <Box borderTop="1px solid" borderColor={borderCol} />
              <HStack fontSize="lg" fontWeight="bold" pt={1}>
                <Text>Total Refund (Cash)</Text>
                <Spacer />
                <Text>
                  {currency(
                    cashReturned.trim() === "" || Number.isNaN(Number(cashReturned))
                      ? 0
                      : Number(cashReturned)
                  )}
                </Text>
              </HStack>
            </VStack>

            <VStack mt={4}>
              <Button
                bgColor="gray"
                variant="solid"
                w="full"
                onClick={handleSubmit}
                loading={submitting}
                loadingText="Saving..."
              >
                Save Return
              </Button>
            </VStack>
          </>
        )}
      </Box>
    </Flex>
  );
}
