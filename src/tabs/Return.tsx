'use client';
import React, { useMemo, useState } from "react";
import {
  Box, Flex, Stack, Heading, Text, Input, Badge, IconButton,
  Button, HStack, VStack, Spacer,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { BiMinus, BiPlus, BiX } from "react-icons/bi";
import { CgShoppingCart } from "react-icons/cg";
import SearchProduct from "./common/SearchProduct";

// hooks + slice actions


// If you have Prisma types:
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
    if (Number.isNaN(num)) return;
    setCart(curr =>
      curr.map(i => (i.product.id === productId ? { ...i, sellPrice: Math.max(0, num) } : i))
    );
  };

  const removeFromCart = (productId: string) =>
    setCart(curr => curr.filter(i => i.product.id !== productId));

  const subtotal = useMemo(
    () => cart.reduce((t, i) => t + i.sellPrice * i.quantity, 0),
    [cart]
  );

  // ---- Save Return (now calls redux thunk) ----
  const handleSubmit = async () => {
    if (cart.length === 0) {
      toaster.create({ type: "warning", title: "Cart is empty", closable: true });
      return;
    }

    try {
      setSubmitting(true);

      await dispatch(
        addReturn({ // or however you’re tracking the order
          description: reason, // use reason here
          products: cart.map(i => ({
            productId: i.product.id,
            quantity: i.quantity,
            sellPrice: i.sellPrice,
          })),
        })
      ).unwrap();


      toaster.create({
        type: "success",
        title: "Return saved",
        closable: true,
      });

      setCart([]);
      setReason("");
    } catch (err: any) {
      toaster.create({
        type: "error",
        title: "Failed to save return",
        description: err.message ?? "Unknown error",
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
        w={{ base: "full", lg: "420px" }}
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
              <Flex align="center" justify="space-between">
                <Text fontWeight="medium">{item.product.name}</Text>
                <HStack>
                  <IconButton size="sm" variant="ghost"
                    aria-label="Decrease"
                    onClick={() => updateCartQuantity(item.product.id, -1)}>
                    <BiMinus size={18} />
                  </IconButton>
                  <Text fontWeight="semibold" fontSize="lg" w="6" textAlign="center">
                    {item.quantity}
                  </Text>
                  <IconButton size="sm" variant="ghost"
                    aria-label="Increase"
                    onClick={() => updateCartQuantity(item.product.id, 1)}>
                    <BiPlus size={18} />
                  </IconButton>
                  <IconButton size="sm" variant="ghost"
                    aria-label="Remove"
                    onClick={() => removeFromCart(item.product.id)}>
                    <BiX color="red" size={18} />
                  </IconButton>
                </HStack>
              </Flex>

              <HStack mt={2}>
                <Text fontSize="sm" color="gray.600">Refund Price</Text>
                <Spacer />
                <Input
                  type="number"
                  size="sm"
                  w="28"
                  textAlign="right"
                  value={item.sellPrice}
                  onChange={(e) => updateSellPrice(item.product.id, e.target.value)}
                />
              </HStack>
            </Box>
          ))}
        </Stack>

        {cart.length > 0 && (
          <>
            <Box my={4} borderTop="1px solid" borderColor={borderCol} />
            <VStack align="stretch" fontSize="sm">
              <HStack>
                <Text>Refund Sub-Total:</Text>
                <Spacer />
                <Text>{currency(subtotal)}</Text>
              </HStack>
              <HStack align="start" mt={2}>
                <Text>Reason:</Text>
                <Spacer />
                <Input
                  placeholder="Return reason / notes"
                  size="sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </HStack>
              <Box mt={2} borderTop="1px solid" borderColor={borderCol} />
              <HStack fontSize="lg" fontWeight="bold" pt={1}>
                <Text>Total Refund:</Text>
                <Spacer />
                <Text>{currency(subtotal)}</Text>
              </HStack>
            </VStack>

            <VStack mt={4}>
              <Button
                bgColor="gray"
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
};


