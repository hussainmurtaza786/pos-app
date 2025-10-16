'use client';
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Flex, Stack, Heading, Text, Input, Badge, IconButton, Button, HStack, VStack, Spacer, Switch
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
import type { Order as AppOrder, ProductInOrder as AppProductInOrder } from "@/prisma/customTypes";

type Product = PrismaProduct;

interface CartItem {
  product: Product;
  quantity: number;
  sellPrice: number; // editable price per line
  available: number; // available stock from inventory
}

const currency = (n: number) => `${n.toFixed(2)}rs`;

/** Print or preview the given HTML using a hidden iframe (no popup). */
function printReceipt(html: string, opts: { preview?: boolean } = {}) {
  const { preview = false } = opts;

  if (preview) {
    // For testing: just open a preview tab, don't auto-call print
    const w = window.open("", "_blank", "noopener,noreferrer,width=700,height=800");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  // Same-origin content without fetching external doc
  iframe.srcdoc = html;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // ignore
    } finally {
      // cleanup
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    }
  };
}

/** Build printable receipt HTML from an order */
function buildReceiptHtml(order: AppOrder) {
  const lines: AppProductInOrder[] = (order as any).ProductInOrder || [];
  const createdAt = new Date((order as any).createdAt || Date.now());
  const shopName = "My Store";
  const shopAddress = "Main Road, City";
  const shopPhone = "0300-0000000";

  const subtotal = lines.reduce(
    (s, l) => s + Number(l.sellPrice || 0) * Number(l.quantity || 0),
    0
  );
  const discount = Number((order as any).discount || 0);
  const total = Math.max(0, subtotal - discount);
  const amountReceived = Number((order as any).amountReceived || 0);
  const change = Math.max(0, amountReceived - total);

  // Thermal-style simple CSS (fits 80mm printers too)
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt #${order.id ?? ""}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Arial, sans-serif; margin: 0; padding: 0; }
  .paper { width: 320px; margin: 0 auto; padding: 12px; }
  .center { text-align: center; }
  .title { font-size: 16px; font-weight: 700; }
  .muted { color: #555; font-size: 12px; }
  .hr { border-top: 1px dashed #999; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  th, td { font-size: 12px; padding: 2px 0; }
  th { text-align: left; color: #444; }
  .tr { text-align: right; }
  .totals td { padding: 2px 0; }
  .bold { font-weight: 700; }
  .footer { margin-top: 10px; font-size: 11px; }
</style>
</head>
<body>
  <div class="paper">
    <div class="center">
      <div class="title">${shopName}</div>
      <div class="muted">${shopAddress}</div>
      <div class="muted">Phone: ${shopPhone}</div>
    </div>

    <div class="hr"></div>
    <div style="font-size:12px;">
      <div><span class="bold">Receipt #:</span> ${order.id ?? "-"}</div>
      <div><span class="bold">Date:</span> ${createdAt.toLocaleString()}</div>
    </div>
    <div class="hr"></div>

    <table>
      <thead>
        <tr>
          <th style="width:50%;">Item</th>
          <th class="tr" style="width:15%;">Qty</th>
          <th class="tr" style="width:15%;">Rate</th>
          <th class="tr" style="width:20%;">Amt</th>
        </tr>
      </thead>
      <tbody>
        ${lines
      .map((l) => {
        const name = (l as any)?.product?.name ?? "";
        const qty = Number(l.quantity || 0);
        const rate = Number(l.sellPrice || 0);
        const amt = qty * rate;
        return `<tr>
              <td>${name}</td>
              <td class="tr">${qty}</td>
              <td class="tr">${rate.toFixed(2)}</td>
              <td class="tr">${amt.toFixed(2)}</td>
            </tr>`;
      })
      .join("")}
      </tbody>
    </table>

    <div class="hr"></div>
    <table class="totals">
      <tr><td>Subtotal</td><td class="tr">${subtotal.toFixed(2)}</td></tr>
      <tr><td>Discount</td><td class="tr">-${discount.toFixed(2)}</td></tr>
      <tr><td class="bold">Total</td><td class="tr bold">${total.toFixed(2)}</td></tr>
      <tr><td>Amount Received</td><td class="tr">${amountReceived.toFixed(2)}</td></tr>
      <tr><td>Change</td><td class="tr">${change.toFixed(2)}</td></tr>
    </table>

    <div class="hr"></div>
    <div class="center footer">
      Thanks for shopping with us!
    </div>
  </div>
</body>
</html>`;
  return html;
}

const Order: React.FC = () => {
  const dispatch = useDispatch<any>();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountValue, setDiscountValue] = useState<number>();
  const [amountReceived, setAmountReceived] = useState<number>();
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState<string>("");

  const [autoPrint, setAutoPrint] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem("pos:autoPrint");
    if (saved !== null) {
      setAutoPrint(saved === "1");
    }
  }, []);
  const handleToggleAutoPrint = (v: boolean) => {
    setAutoPrint(v);
    localStorage.setItem("pos:autoPrint", v ? "1" : "0");
  };

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

  if (discountValue === undefined) setDiscountValue(0);

  const subtotal = useMemo(() => cart.reduce((t, i) => t + i.sellPrice * i.quantity, 0), [cart]);
  const discountNumeric = discountValue === 0 ? 0 : Math.max(0, Math.min(subtotal, discountValue ? discountValue : 0));
  const totalAfterDiscount = Math.max(0, subtotal - discountNumeric);
  const changeToReturn = amountReceived === 0 ? 0 : Math.max(0, Number(amountReceived) - totalAfterDiscount);


  const handleSubmit = async (status: Status) => {
    if (cart.length === 0) {
      toaster.create({ type: "warning", title: "Cart is empty", closable: true });
      return;
    }
    if (amountReceived === 0 || isNaN(Number(amountReceived))) {
      toaster.create({ type: "warning", title: "Enter amount received", closable: true });
      return;
    }
    if (Number(amountReceived) < totalAfterDiscount) {
      toaster.create({ type: "error", title: "Amount received must cover total", closable: true });
      return;
    }
    if (discountValue ? discountValue > subtotal : false) {
      toaster.create({
        type: "warning",
        title: "Discount too high",
        description: "The discount cannot exceed the subtotal.",
        closable: true,
      });
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
      const created: { data: AppOrder } = await dispatch(addOrder(payload)).unwrap();

      toaster.create({ type: "success", title: "Order created", closable: true });

      // Toggle behavior:
      // - If autoPrint = true: print via hidden iframe
      // - If you want to preview instead of print while testing, flip PREVIEW_RECEIPT to true.
      const PREVIEW_RECEIPT = false; // set to true for testing without showing print dialog
      if (autoPrint && created?.data) {
        const html = buildReceiptHtml(created.data);
        printReceipt(html, { preview: PREVIEW_RECEIPT });
      }

      // reset form/cart
      setCart([]);
      setDiscountValue(0);
      setAmountReceived(0);
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
        <Flex align="center" justify="space-between">
          <Box>
            <Heading size="lg" mb={1}>Order</Heading>
            <Text color="gray.500" mb={4}>Search and add products to the cart</Text>
          </Box>

          {/* Top-right Auto Print toggle */}
          <HStack align="center">
            <Switch.Root
              checked={autoPrint}
              onCheckedChange={(details) => handleToggleAutoPrint(details.checked)}
              colorScheme="blue"
              size="md"
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>Auto print receipt</Switch.Label>
            </Switch.Root>
          </HStack>
        </Flex>

        <Box bg="white" border="1px solid" borderColor="gray.200" rounded="xl" p={4}>
          <SearchProduct onAddToCart={addToCart} />
        </Box>
      </Box>

      {/* Right: Cart */}
      <Box w={{ base: "full", lg: "420px" }} bg="white" rounded="xl" shadow="sm" border="1px solid" borderColor="gray.200" p={{ base: 4, lg: 6 }}>
        <HStack mb={6}>
          <Box as={CgShoppingCart} boxSize={5} color="blue.600" />
          <Heading size="md">Cart</Heading>
          <Badge color="blue" fontSize="0.8rem" rounded="full">
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </Badge>
        </HStack>

        <Stack>
          {cart.map(item => (
            <Box key={item.product.id} p={3} border="1px solid" borderColor="gray.200" rounded="md" _notFirst={{ mt: 2 }}>
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
            <Box my={4} borderTop="1px solid" borderColor="gray.200" />
            <VStack align="stretch" fontSize="sm">
              <HStack><Text>Sub-Total:</Text><Spacer /><Text>{currency(subtotal)}</Text></HStack>
              <HStack>
                <Text>Discount:</Text><Spacer />
                <Input
                  min={0}
                  type="number" size="sm" w="28" textAlign="right"
                  value={discountValue === 0 ? 0 : discountValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") return setDiscountValue(0);
                    const n = Number(v);
                    setDiscountValue(Number.isNaN(n) ? 0 : n);
                  }}
                  placeholder="0"
                />
              </HStack>
              <HStack mt={2}><Text>Amount Received:</Text><Spacer /><Input min={0} type="number" size="sm" w="28" textAlign="right" value={amountReceived === 0 ? 0 : amountReceived} onChange={(e) => {
                const v = e.target.value; if (v === "") return setAmountReceived(0);
                const n = Number(v); setAmountReceived(Number.isNaN(n) ? 0 : n);
              }} placeholder="0" /></HStack>
              <HStack mt={2}><Text>Change to Return:</Text><Spacer /><Text fontWeight="medium">{amountReceived !== 0 ? currency(changeToReturn) : "-"}</Text></HStack>
              <HStack align="start" mt={2}><Text>Description:</Text><Spacer /><Input placeholder="Enter description" size="sm" value={description} onChange={(e) => setDescription(e.target.value)} /></HStack>
              <Box mt={2} borderTop="1px solid" borderColor="gray.200" />
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
