'use client';
import { Box, Flex, Text, FormatNumber } from '@chakra-ui/react';
import React from 'react';
import { chakraComponents, AsyncSelect } from "chakra-react-select";
import { authorizedApiClient } from '@/utils';
import { ProductsGetInput, ProductsGetOutput } from '@/app/api/product/route';
import { Product } from '@prisma/client';

interface Props {
  onSelect?: (product: Product) => void;
  onRemove?: () => void;
  onAddToCart?: (product: Product) => void; // optional
}

export default function SearchProduct({ onSelect, onRemove, onAddToCart }: Props) {
  const search = async (searchValue: string) => {
    const { data: { data: { items } } } =
      await authorizedApiClient.get<ProductsGetOutput>(`/api/product`, {
        params: {
          pageNumber: 1,
          pageSize: 5,
          search: searchValue.trim(),
          searchField: "name",
        } as ProductsGetInput,
        withCredentials: true,
      });
    return items;
  };

  return (
    <AsyncSelect
      isClearable
      isSearchable
      chakraStyles={{
        downChevron: (base) => ({ display: "none" }),
        option: (base) => ({ ...base, color: 'black', p: 2, borderBottom: '1px solid' }),
        container: (base) => ({ ...base, "& > *": { border: '1px solid black' } }),
      }}
      placeholder="Search Product"
      onChange={(newValue, { action }) => {
        const prod = newValue as unknown as Product | null;
        if (action === "select-option" && prod) {
          onSelect?.(prod);
          onAddToCart?.(prod); // cart integration
        }
        if (action === "clear") {
          onRemove?.();
        }
      }}
      loadOptions={(_inputValue, callback) => {
        search(_inputValue)
          .then(res => {
            const data = res.map(item => ({
              label: item.name,
              value: item.id,
              ...item,
            }));
            callback(data);
          })
          .catch(e => {
            console.log("error in search", e?.response?.data || e?.message);
            callback([]);
          });
      }}
      components={{
        Option: ({ children, ...props }) => {
          const data = props.data as Product;
          return (
            <Box asChild display="block">
              <chakraComponents.Option {...props}>
                <Flex align="center" gap="2">
                  <Box>
                    <Text maxH="60px" overflowY="hidden" w="full" fontWeight="medium">
                      {data.name}
                    </Text>
                    <Text maxH="60px" overflowY="hidden" w="full" color="green.600">
                      <FormatNumber value={data.price} />
                    </Text>
                  </Box>
                </Flex>
              </chakraComponents.Option>
            </Box>
          );
        },
      }}
    />
  );
}
