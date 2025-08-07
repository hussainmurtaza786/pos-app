import {Product as _Product,    Inventory as _Inventory, Category,} from "@prisma/client";

export type Product = _Product & {
    category?: Category;
};

export type Inventory = _Inventory & {
    product?: Product
}

