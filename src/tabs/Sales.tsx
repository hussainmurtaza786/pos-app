import React, { useMemo, useState } from "react";
import {
  Box,
  Flex,
  Stack,
  Heading,
  Text,
  Input,
  Badge,
  IconButton,
  Button,
  HStack,
  VStack,
  Spacer,
} from "@chakra-ui/react";
import { BiMinus, BiPlus, BiX } from "react-icons/bi";
import { CgShoppingCart } from "react-icons/cg";

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock_quantity: number;
  category_id: string;
}
interface CartItem {
  product: Product;
  quantity: number;
  sellPrice: number; // editable price per line
}

const currency = (n: number) => `${n.toFixed(2)}rs`;
const PAGE_SIZE = 5;

const Order: React.FC = () => {
  // Sample data (11 products to test pagination: 10 on page 1, 1 on page 2)
  const [products] = useState<Product[]>([
    { id: "1",  name: "Sample Product 1",  price: 100, cost: 60,  stock_quantity: 10, category_id: "a" },
    { id: "2",  name: "Sample Product 2",  price: 150, cost: 80,  stock_quantity: 5,  category_id: "b" },
    { id: "3",  name: "Sample Product 3",  price: 80,  cost: 50,  stock_quantity: 12, category_id: "c" },
    { id: "4",  name: "Sample Product 4",  price: 60,  cost: 35,  stock_quantity: 8,  category_id: "d" },
    { id: "5",  name: "Sample Product 5",  price: 120, cost: 70,  stock_quantity: 6,  category_id: "e" },
    { id: "6",  name: "Sample Product 6",  price: 200, cost: 130, stock_quantity: 4,  category_id: "f" },
    { id: "7",  name: "Sample Product 7",  price: 50,  cost: 25,  stock_quantity: 20, category_id: "g" },
    { id: "8",  name: "Sample Product 8",  price: 95,  cost: 55,  stock_quantity: 15, category_id: "h" },
    { id: "9",  name: "Sample Product 9",  price: 175, cost: 110, stock_quantity: 7,  category_id: "i" },
    { id: "10", name: "Sample Product 10", price: 40,  cost: 20,  stock_quantity: 30, category_id: "j" },
    { id: "11", name: "Sample Product 11", price: 130, cost: 85,  stock_quantity: 9,  category_id: "k" },
  ]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [amountReceived, setAmountReceived] = useState<number | "">("");

  // fixed colors (no color mode)
  const cardBg = "white";
  const borderCol = "gray.200";

  const filteredProducts = useMemo(
    () => products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [products, searchTerm]
  );

  // Pagination
  const totalProducts = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalProducts);
  const pageItems = filteredProducts.slice(startIndex, endIndex);

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return;
    const existing = cart.find(i => i.product.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock_quantity) {
        setCart(cart.map(i => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)));
      }
    } else {
      setCart([...cart, { product, quantity: 1, sellPrice: product.price }]);
    }
  };

  const updateCartQuantity = (productId: string, change: number) => {
    setCart(
      cart
        .map(i => {
          if (i.product.id !== productId) return i;
          const nextQty = i.quantity + change;
          if (nextQty <= 0) return null;
          if (nextQty > i.product.stock_quantity) return i;
          return { ...i, quantity: nextQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateSellPrice = (productId: string, value: string) => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    setCart(cart.map(i => (i.product.id === productId ? { ...i, sellPrice: Math.max(0, num) } : i)));
  };

  const removeFromCart = (productId: string) =>
    setCart(cart.filter(i => i.product.id !== productId));

  const subtotal = useMemo(
    () => cart.reduce((t, i) => t + i.sellPrice * i.quantity, 0),
    [cart]
  );

  // Discount is AMOUNT only (clamped between 0 and subtotal)
  const discountNumeric =
    discountValue === "" ? 0 : Math.max(0, Math.min(subtotal, discountValue));

  const totalAfterDiscount = Math.max(0, subtotal - discountNumeric);
  const changeToReturn =
    amountReceived === "" ? 0 : Math.max(0, amountReceived - totalAfterDiscount);

  return (
    <Flex p={{ base: 4, lg: 6 }} gap={{ base: 4, lg: 6 }} direction={{ base: "column", lg: "row" }} h="full">
      {/* Left: Boxed product list with search */}
      <Box flex="1">
        <Heading size="lg" mb={1}>Order</Heading>
        <Text color="gray.500" mb={4}>Browse and add products to the cart</Text>

        <Box bg={cardBg} border="1px solid" borderColor={borderCol} rounded="xl" p={4}>
          <Stack mb={4}>
            <Text fontSize="sm" fontWeight="medium" mb={2}>Product Search</Text>
            <Input
              id="product-search"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </Stack>

          <Stack>
            {pageItems.map(product => (
              <Flex
                key={product.id}
                p={4}
                bg={cardBg}
                border="1px solid"
                borderColor={borderCol}
                rounded="md"
                align="center"
                justify="space-between"
                _notFirst={{ mt: 2 }}
              >
                <Box>
                  <Text fontWeight="semibold">{product.name}</Text>
                  <Text fontSize="sm" color="gray.500">Stock: {product.stock_quantity}</Text>
                  <Text fontWeight="semibold" color="green.600">{currency(product.price)}</Text>
                </Box>
                <IconButton
                  aria-label="Add to cart"
                  icon={<BiPlus size={18} />}
                  bg="blue.600"
                  color="white"
                  _hover={{ bg: "blue.700" }}
                  rounded="full"
                  onClick={() => addToCart(product)}
                />
              </Flex>
            ))}
          </Stack>

          {/* Pagination */}
          <HStack mt={4} pt={3} borderTop="1px solid" borderColor={borderCol} justify="space-between">
            <Text fontSize="sm" color="gray.600">
              Showing {totalProducts === 0 ? 0 : startIndex + 1}-{endIndex} of {totalProducts}
            </Text>
            <HStack>
              <Button size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} isDisabled={page <= 1}>
                Previous
              </Button>
              <Text fontSize="sm">Page {page} / {totalPages}</Text>
              <Button size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} isDisabled={page >= totalPages}>
                Next
              </Button>
            </HStack>
          </HStack>
        </Box>
      </Box>

      {/* Right: Cart */}
      <Box
        w={{ base: "full", lg: "420px" }}
        bg={cardBg}
        rounded="xl"
        shadow="sm"
        border="1px solid"
        borderColor={borderCol}
        p={{ base: 4, lg: 6 }}
      >
        <HStack mb={6}>
          <Box as={CgShoppingCart} boxSize={5} color="blue.600" />
          <Heading size="md">Cart</Heading>
          <Badge colorScheme="blue" fontSize="0.8rem" rounded="full">
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </Badge>
        </HStack>

        <Stack>
          {cart.map(item => (
            <Box
              key={item.product.id}
              p={3}
              border="1px solid"
              borderColor={borderCol}
              rounded="md"
              _notFirst={{ mt: 2 }}
            >
              <Flex align="center" justify="space-between">
                <Box>
                  <Text fontWeight="medium">{item.product.name}</Text>
                </Box>
                <HStack>
                  <IconButton
                    aria-label="Decrease"
                    size="sm"
                    variant="ghost"
                    color="gray.700"
                    _hover={{ color: "black" }}
                    icon={<BiMinus size={18} />}
                    onClick={() => updateCartQuantity(item.product.id, -1)}
                  />
                  <Text fontWeight="semibold" fontSize="lg" w="6" textAlign="center">
                    {item.quantity}
                  </Text>
                  <IconButton
                    aria-label="Increase"
                    size="sm"
                    variant="ghost"
                    color="blue.600"
                    _hover={{ color: "blue.700" }}
                    icon={<BiPlus size={18} />}
                    onClick={() => updateCartQuantity(item.product.id, 1)}
                  />
                  <IconButton
                    aria-label="Remove"
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    icon={<BiX size={18} />}
                    onClick={() => removeFromCart(item.product.id)}
                  />
                </HStack>
              </Flex>

              {/* Sell price editor */}
              <HStack mt={2}>
                <Text fontSize="sm" color="gray.600">Sell Price</Text>
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

            {/* Totals & controls */}
            <VStack align="stretch" fontSize="sm">
              <HStack>
                <Text>Sub-Total:</Text>
                <Spacer />
                <Text>{currency(subtotal)}</Text>
              </HStack>
               <HStack>
                <Text>Discount::</Text>
                <Spacer />
                <Input
                    type="number"
                    size="sm"
                    w="28"
                    textAlign="right"
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

              <HStack mt={2}>
                <Text>Amount Received:</Text>
                <Spacer />
                <Input
                  type="number"
                  size="sm"
                  w="28"
                  textAlign="right"
                  value={amountReceived === "" ? "" : amountReceived}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") return setAmountReceived("");
                    const n = Number(v);
                    setAmountReceived(Number.isNaN(n) ? "" : n);
                  }}
                  placeholder="0"
                />
              </HStack>

              <HStack mt={2}>
                <Text>Change to Return:</Text>
                <Spacer />
                <Text fontWeight="medium">
                  {amountReceived !== "" ? currency(Math.max(0, changeToReturn)) : "-"}
                </Text>
              </HStack>

              <Box mt={2} borderTop="1px solid" borderColor={borderCol} />

              <HStack fontSize="lg" fontWeight="bold" pt={1}>
                <Text>Total:</Text>
                <Spacer />
                <Text>{currency(totalAfterDiscount)}</Text>
              </HStack>
            </VStack>

            <Button
              mt={4}
              colorScheme="green"
              w="full"
              onClick={() => alert("Paid")}
            >
              Paid
            </Button>
          </>
        )}
      </Box>
    </Flex>
  );
};

export default Order;
