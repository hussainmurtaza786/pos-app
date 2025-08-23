import { Product as _Product, Inventory as _Inventory, Category, ProductInOrder as _ProductInOrder, Order } from "@prisma/client";

export type Product = _Product & {
    category?: Category;
};

export type Inventory = _Inventory & {
    product?: Product
}

export type ProductInOrder = _ProductInOrder & {
    product?: Partial<Product>
    order: Order
}

