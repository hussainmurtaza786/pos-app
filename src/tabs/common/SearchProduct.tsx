'use client';
import { Box, Flex, FormatNumber, Text } from '@chakra-ui/react'
import React from 'react'
import { chakraComponents, CreatableSelect, Select, OptionsOrGroups, GroupBase, AsyncSelect, } from "chakra-react-select";
import { authorizedApiClient } from '@/utils';
import { ProductsGetInput, ProductsGetOutput } from '@/app/api/product/route';
import { Product } from '@prisma/client';


interface Props {
    onSelect?: (product: Product)
     => void
    onRemove?: () => void
}
export default function SearchProduct({ onSelect, onRemove }: Props) {

    const search = async (searchValue: string) => {
        const { data: { data: { items } } } = await authorizedApiClient.get<ProductsGetOutput>(`/api/product`,
            {
                params: {
                    pageNumber: 1, pageSize: 5, search: searchValue.trim(), searchField: "name"
                } as ProductsGetInput
            }
        )
        console.log("items =>", items)
        return items
    }

    return (
        <AsyncSelect
            isClearable
            isSearchable
            chakraStyles={{
                downChevron: (base) => ({ display: "none" }),
                option: (base, state) => ({ ...base, color: 'black', p: 2, borderBottom: '1px solid' }),
                // inputContainer: (base) => ({ ...base, _placeholder: { color: 'white' } }),
                container: (base) => ({ ...base, "& > *": { border: '1px solid black' } }),
                // placeholder: (base) => ({ ...base, color: 'white', fontSize: 'md' }),
            }}
            placeholder="Search Product"
            // onChange={onSelect as any}
            onChange={(newValue, { action }) => {
                const prod = newValue as Product;
                action === "select-option" && onSelect?.(prod);
                action === "clear" && onRemove?.();
            }}
            loadOptions={(_inputValue, callback) => {
                search(_inputValue).then(res => {
                    const data = res.map(item => ({ label: item.name, value: item.id, ...item }))
                    callback(data);
                })
                    .catch(e => console.log("error in search", e.response?.data))
            }}
            components={{
                Option: ({ children, ...props }) => {
                    const data = props.data as Product;
                    return <Box asChild display='block'>
                        <chakraComponents.Option  {...props}>
                            <Flex align='center' gap='2'>
                                {/* <Box as='span' minW='90px' minH='90px' bgPos='center' bgSize='cover' bgColor='grey' bgImg={`url(${data.media[0].url})`} /> */}
                                <Box>
                                    <Text maxH='60px' overflowY='hidden' w='full'>{data.name}</Text>
                                    <Text maxH='60px' overflowY='hidden' w='full'><FormatNumber value={data.price} /></Text>
                                </Box>
                            </Flex>
                        </chakraComponents.Option>
                    </Box>
                },
            }}
        />
    )
}
