import { Product as _Product, Inventory as _Inventory, Category, ProductInOrder as _ProductInOrder, Order as _Order, ReturnOrder as _ReturnOrder, ReturnOrderProduct } from "@prisma/client";

export type Product = _Product & {
    category?: Category;
};

export type Inventory = _Inventory & {
    product?: Product
}
export type ProductInOrder = _ProductInOrder & {
    product: Product;
    inventory?: Inventory | null;
};

export type Order = _Order & {
    ProductInOrder?: ProductInOrder[];
};

export type ReturnOrder = _ReturnOrder & {
    ReturnOrderProduct?: ReturnOrderProduct[];
};
