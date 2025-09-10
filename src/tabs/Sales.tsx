'use client';
import React, { useMemo, useState } from "react";
import {
  Box, Flex, Stack, Heading, Text, Input, Badge, IconButton, Button, HStack, VStack, Spacer,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { BiMinus, BiPlus, BiX } from "react-icons/bi";
import { CgShoppingCart } from "react-icons/cg";
import { useDispatch } from "react-redux";
import { Product as PrismaProduct, Status } from "@prisma/client";
import SearchProduct from "./common/SearchProduct";
import type { OrderPutInput } from "@/app/api/order/route";
import { addOrder } from "@/redux/slices/app/orderApiThunk";
import { getInventoryForProduct } from "@/redux/slices/app/inventoryApiThunks";

type Product = PrismaProduct;

interface CartItem {
  product: Product;
  quantity: number;
  sellPrice: number; // editable price per line
  available: number; // available stock from inventory
}

const currency = (n: number) => `${n.toFixed(2)}rs`;

const Order: React.FC = () => {
  const dispatch = useDispatch<any>();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [amountReceived, setAmountReceived] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState<string>("");

  const cardBg = "white";
  const borderCol = "gray.200";

  // --- get availability via thunk ---
  const fetchAvailableForProduct = async (productId: string) => {
    try {
      const res = await dispatch(getInventoryForProduct(productId)).unwrap();
      const inv = res?.data;
      if (!inv) return null;
      return {
        availableQuantity: Number(inv.availableQuantity ?? 0),
        productPrice: typeof inv?.product?.price === "number" ? inv.product.price : undefined,
      };
    } catch {
      return null;
    }
  };

  // ---- Cart ops ----
  const addToCartAsync = async (product: Product) => {
    const info = await fetchAvailableForProduct(product.id);
    if (!info) {
      toaster.create({
        type: "warning",
        title: "No inventory",
        description: "This product has no inventory record.",
        closable: true,
      });
      return;
    }

    const available = info.availableQuantity ?? 0;
    if (available <= 0) {
      toaster.create({
        type: "warning",
        title: "Out of stock",
        description: "No units available to sell.",
        closable: true,
      });
      return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + 1, available);
        if (nextQty === existing.quantity) {
          toaster.create({
            type: "warning",
            title: "Out of stock",
            description: `Only ${available} available.`,
            closable: true,
          });
          return prev;
        }
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: nextQty, available } : i
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          sellPrice: info.productPrice ?? product.price,
          available,
        },
      ];
    });
  };

  const addToCart = (product: Product) => { void addToCartAsync(product); };

  const updateCartQuantity = (productId: string, change: number) => {
    setCart(curr =>
      curr
        .map(i => {
          if (i.product.id !== productId) return i;
          const nextQty = i.quantity + change;
          if (nextQty <= 0) return null;
          if (nextQty > i.available) {
            toaster.create({
              type: "warning",
              title: "Out of stock",
              description: `Only ${i.available} available.`,
              closable: true,
            });
            return { ...i, quantity: i.available };
          }
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

  const subtotal = useMemo(() => cart.reduce((t, i) => t + i.sellPrice * i.quantity, 0), [cart]);
  const discountNumeric = discountValue === "" ? 0 : Math.max(0, Math.min(subtotal, discountValue));
  const totalAfterDiscount = Math.max(0, subtotal - discountNumeric);
  const changeToReturn = amountReceived === "" ? 0 : Math.max(0, Number(amountReceived) - totalAfterDiscount);

  const handleSubmit = async (status: Status) => {
    if (cart.length === 0) {
      toaster.create({ type: "warning", title: "Cart is empty", closable: true });
      return;
    }
    if (amountReceived === "" || isNaN(Number(amountReceived))) {
      toaster.create({ type: "warning", title: "Enter amount received", closable: true });
      return;
    }
    if (Number(amountReceived) < totalAfterDiscount) {
      toaster.create({ type: "error", title: "Amount received must cover total", closable: true });
      return;
    }

    const payload: OrderPutInput = {
      description,
      discount: discountNumeric,
      status,
      amountReceived: Number(amountReceived),
      products: cart.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        sellPrice: i.sellPrice,
      })),
    };

    try {
      setSubmitting(true);
      await dispatch(addOrder(payload)).unwrap();
      toaster.create({ type: "success", title: "Order created", closable: true });
      setCart([]);
      setDiscountValue("");
      setAmountReceived("");
      setDescription("");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("out of stock")) {
        toaster.create({
          type: "warning",
          title: "Stock issue",
          description: msg,
          closable: true,
        });
      } else {
        toaster.create({
          description: msg || "Please try again",
          type: "error",
          title: "Failed to create order",
          closable: true,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex p={{ base: 4, lg: 6 }} gap={{ base: 4, lg: 6 }} direction={{ base: "column", lg: "row" }} h="full">
      {/* Left: Product search */}
      <Box flex="1">
        <Heading size="lg" mb={1}>Order</Heading>
        <Text color="gray.500" mb={4}>Search and add products to the cart</Text>

        <Box bg={cardBg} border="1px solid" borderColor={borderCol} rounded="xl" p={4}>
          <SearchProduct onAddToCart={addToCart} />
        </Box>
      </Box>

      {/* Right: Cart */}
      <Box w={{ base: "full", lg: "420px" }} bg={cardBg} rounded="xl" shadow="sm" border="1px solid" borderColor={borderCol} p={{ base: 4, lg: 6 }}>
        <HStack mb={6}>
          <Box as={CgShoppingCart} boxSize={5} color="blue.600" />
          <Heading size="md">Cart</Heading>
          <Badge colorScheme="blue" fontSize="0.8rem" rounded="full">
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </Badge>
        </HStack>

        <Stack>
          {cart.map(item => (
            <Box key={item.product.id} p={3} border="1px solid" borderColor={borderCol} rounded="md" _notFirst={{ mt: 2 }}>
              <Flex align="center" justify="space-between">
                <Box>
                  <Text fontWeight="medium">{item.product.name}</Text>
                  <Text fontSize="xs" color="gray.600">In stock: {item.available}</Text>
                </Box>
                <HStack>
                  <IconButton aria-label="Decrease" size="sm" variant="ghost" onClick={() => updateCartQuantity(item.product.id, -1)}>
                    <BiMinus size={18} />
                  </IconButton>
                  <Text fontWeight="semibold" fontSize="lg" w="6" textAlign="center">
                    {item.quantity}
                  </Text>
                  <IconButton aria-label="Increase" size="sm" variant="ghost" onClick={() => updateCartQuantity(item.product.id, 1)}>
                    <BiPlus size={18} />
                  </IconButton>
                  <IconButton aria-label="Remove" size="sm" variant="ghost" onClick={() => removeFromCart(item.product.id)}>
                    <BiX color="red" size={18} />
                  </IconButton>
                </HStack>
              </Flex>

              <HStack mt={2}>
                <Text fontSize="sm" color="gray.600">Sell Price</Text>
                <Spacer />
                <Input type="number" size="sm" w="28" textAlign="right" value={item.sellPrice} onChange={(e) => updateSellPrice(item.product.id, e.target.value)} />
              </HStack>
            </Box>
          ))}
        </Stack>

        {cart.length > 0 && (
          <>
            <Box my={4} borderTop="1px solid" borderColor={borderCol} />
            <VStack align="stretch" fontSize="sm">
              <HStack><Text>Sub-Total:</Text><Spacer /><Text>{currency(subtotal)}</Text></HStack>
              <HStack>
                <Text>Discount:</Text><Spacer />
                <Input
                  type="number" size="sm" w="28" textAlign="right"
                  value={discountValue === "" ? "" : discountValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") return setDiscountValue("");
                    const n = Number(v);
                    setDiscountValue(Number.isNaN(n) ? "" : n);
                  }}
                  placeholder="0"
                />
              </HStack>
              <HStack mt={2}><Text>Amount Received:</Text><Spacer /><Input type="number" size="sm" w="28" textAlign="right" value={amountReceived === "" ? "" : amountReceived} onChange={(e) => {
                const v = e.target.value; if (v === "") return setAmountReceived("");
                const n = Number(v); setAmountReceived(Number.isNaN(n) ? "" : n);
              }} placeholder="0" /></HStack>
              <HStack mt={2}><Text>Change to Return:</Text><Spacer /><Text fontWeight="medium">{amountReceived !== "" ? currency(changeToReturn) : "-"}</Text></HStack>
              <HStack align="start" mt={2}><Text>Description:</Text><Spacer /><Input placeholder="Enter description" size="sm" value={description} onChange={(e) => setDescription(e.target.value)} /></HStack>
              <Box mt={2} borderTop="1px solid" borderColor={borderCol} />
              <HStack fontSize="lg" fontWeight="bold" pt={1}><Text>Total:</Text><Spacer /><Text>{currency(totalAfterDiscount)}</Text></HStack>
            </VStack>

            <VStack mt={4}>
              <Button bgColor="gray" w="full" onClick={() => handleSubmit("Pending")} loadingText="Saving..." loading={submitting}>Save</Button>
              <Button bgColor="gray" w="full" onClick={() => handleSubmit("Completed")} loading={submitting} loadingText="Dispatching...">Dispatch</Button>
            </VStack>
          </>
        )}
      </Box>
    </Flex>
  );
};

export default Order;
