'use client';
import { Box, createListCollection, Flex, Icon, Progress, ProgressRootProps, Table, TableRootProps, NativeSelect } from "@chakra-ui/react";
import { JSX, useEffect, useRef, useState } from "react";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import { FaCheck, FaMinus } from "react-icons/fa";
// import { SelectContent, SelectItem, SelectLabel, SelectRoot, SelectTrigger, SelectValueText } from "./ui/select";
import { useColorMode } from "./ui/color-mode";
// import { pages } from "next/dist/build/templates/app-page";

interface Column<RowValues = { [k: string]: any }> {
    accessKey: keyof RowValues;
    label: string;
    minWidth?: number;
    maxWidth?: number;
    width?: number;
    align?: "right" | "inherit" | "left" | "center" | "justify";
    format?: (cellValue: any, rowValues: RowValues, tableRowIndex: number) => string | number | JSX.Element | undefined;
}

interface TableProps<RowValues> {
    label?: JSX.Element;
    hideFooter?: boolean;
    columns: Column<RowValues>[];
    rows: RowValues[];
    /**
     * this will be used when there is an empty array of row
     */
    emptyRowMsg?: React.ReactNode;
    /**
     * If fetching data from an external server or API, totalRows must be specified.
     * It represent how much total data is available in order to find "number of pages" to display on table
     */
    totalRows?: number;
    // onChangeRowsPerPage?: (pageNumber: number, pageSize: number) => void,
    // onChangePageNo?: (pageNumber: number, pageSize: number) => void,
    onPaginationChange?: (pageNumber: number, pageSize: number) => void | Promise<void>;
    pageNumber?: number;
    pageSize?: number;
    loading?: boolean;
    /**
     * when data will be fetching asynchronously on pageNumber and pageSize change then it should be true
     */
    dataFetchingAsync?: boolean;
    onClickRow?: (
        RowIndex: number,
        columnIndex: number,
        cellValue: RowValues[keyof RowValues],
        rowValues: RowValues
    ) => void;
    enableCheckboxSelection?: boolean,
    onRowSelection?: (selectedRowsIndex: number[], selectedRows: RowValues[]) => void,
    tableContainerProps?: TableRootProps //TableContainerProps
}

export default function _Table<T = { [k: string | number]: any }>({
    columns, onClickRow, hideFooter, label, rows, dataFetchingAsync, emptyRowMsg,
    loading, onPaginationChange, pageNumber, pageSize, totalRows, enableCheckboxSelection,
    onRowSelection, tableContainerProps
}: TableProps<T>) {


    const [page, setPage] = useState<number>(pageNumber || 1);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState(pageSize || 50);
    const [render, setRender] = useState(false);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [_loading, setLoading] = useState(false)
    const [tableContainerWidth, setTableContainerWidth] = useState<number>(0);

    if (!totalRows) {
        totalRows = rows.length;
    }

    useEffect(() => {
        pageNumber !== undefined && setPage(pageNumber);
    }, [pageNumber]);

    useEffect(() => {
        setLoading(Boolean(loading))
    }, [loading]);

    useEffect(() => {
        setSelectedRows([])
    },
        [rows?.[0]?.[columns?.[0]?.accessKey], rows?.[rows.length - 1]?.[columns?.[0]?.accessKey]]
    );
    useEffect(() => {
        if (!dataFetchingAsync) {
            rows = rows.slice(
                (page - 1) * rowsPerPage,
                (page - 1) * rowsPerPage + rowsPerPage
            );
        }
        const selectedRowValues = rows.filter((r, idx) => selectedRows.includes(idx));
        onRowSelection?.(selectedRows, selectedRowValues);
    }, [selectedRows])

    if (!dataFetchingAsync) {
        rows = rows.slice(
            (page - 1) * rowsPerPage,
            (page - 1) * rowsPerPage + rowsPerPage
        );
    }

    const _onPaginationChange = async (pageNumber: number, pageSize: number) => {
        if (render === false) return;
        if (page === pageNumber && rowsPerPage === pageSize) {
            return;
        }
        setPage(pageNumber);
        setRowsPerPage(pageSize);
        setLoading(true);
        await onPaginationChange?.(pageNumber, pageSize);
        setLoading(false);
    };

    const handleRowSelection = (rowIndex: number, isSelected: boolean) => {
        isSelected ?
            setSelectedRows(v => v.filter(v => v !== rowIndex)) :
            setSelectedRows(v => [...v, rowIndex])
    }
    const handleRowAllSelection = (allSelected: boolean) => {
        allSelected ?
            setSelectedRows([]) :
            setSelectedRows(Array(rows.length).fill(1).map((_, i) => i))
    }

    useEffect(() => {
        setRender(true);
    }, []);

    useEffect(() => {
        tableContainerRef.current &&
            setTableContainerWidth(tableContainerRef.current.clientWidth - 2);
        const listener = () => {
            tableContainerRef.current &&
                setTableContainerWidth(tableContainerRef.current.clientWidth - 2)
        }
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener)
    }, []);

    return (
        <Box {...tableContainerProps} >
            <ProgressHandler visibility={_loading ? 'visible' : "hidden"} maxW="full" value={null} size='xs' />
            {/* <Progress visibility={_loading ? 'visible' : "hidden"} size='xs' color='maroon' bgColor='app.grey2' isIndeterminate /> */}
            <Table.ScrollArea borderWidth="1px" >
                <Table.Root stickyHeader interactive size='md' >
                    <Table.Header >
                        <Table.Row bgColor='transparent' borderBottom="2px solid" borderColor='gray.400/60' >
                            {enableCheckboxSelection &&
                                // CheckIcon, MinusIcon
                                (() => {
                                    const checked = selectedRows.length > 0 && selectedRows.length === rows.length;
                                    const indeterminate = selectedRows.length > 0 && selectedRows.length < rows.length
                                    return <Table.ColumnHeader w='10px' pl='4' pr='0' py='2'>
                                        <Box onClick={() => handleRowAllSelection(checked)} bgColor='white' w='fit-content' border='1px' px='0.5' borderColor='app.grey2' cursor='pointer' >
                                            {!checked && !indeterminate && <Icon as={FaCheck} visibility='hidden' w='4' />}
                                            {checked && <Icon as={FaCheck} w='4' color='black' />}
                                            {indeterminate && <Icon as={FaMinus} w='4' color='black' />}
                                        </Box>
                                    </Table.ColumnHeader>
                                })()
                            }
                            {columns.map((column, idx) => {
                                const { width, maxWidth, minWidth, align } = column;
                                return (
                                    <Table.ColumnHeader px='3' py='2' fontWeight='bold' fontSize='md'
                                        key={idx} textAlign={align}
                                        style={{ width, maxWidth, minWidth }}
                                    >
                                        {column.label}
                                    </Table.ColumnHeader>
                                );
                            })}
                        </Table.Row>
                    </Table.Header>
                    <Table.Body h={rows.length ? undefined : '300px'}>
                        {rows.map((row, rowIdx) => {
                            const isRowSelected = selectedRows.includes(rowIdx);
                            return (
                                <Table.Row bgColor='transparent' borderBottom="2px solid" borderColor='gray.400/60'
                                    key={rowIdx} _hover={{ bgColor: onClickRow && "#ddd" }}
                                    cursor={onClickRow && "pointer"}
                                >
                                    {enableCheckboxSelection &&
                                        <Table.Cell pl='4' pr='0' >
                                            <Box onClick={() => handleRowSelection(rowIdx, isRowSelected)} bgColor='white' w='fit-content' border='1px' px='0.5' borderColor='brand1.400' cursor='pointer' >
                                                <Icon as={FaCheck} w='4' visibility={isRowSelected ? 'visible' : 'hidden'} />
                                            </Box>
                                        </Table.Cell>
                                    }
                                    {columns.map((column, colIdx) => {
                                        const { width, maxWidth, minWidth, accessKey, align } = column;
                                        const value = (row as any)[accessKey];
                                        return (
                                            <Table.Cell key={colIdx} textAlign={align}
                                                onClick={() => onClickRow?.(rowIdx, colIdx, value, row)}
                                                style={{ width, maxWidth, minWidth }}
                                                p='3' truncate
                                            >
                                                {column.format
                                                    ? column.format(value, row, rowIdx)
                                                    : value}
                                            </Table.Cell>
                                        );
                                    })}
                                </Table.Row>
                            );
                        })}
                    </Table.Body>

                    <Table.Footer style={{ display: hideFooter ? "none" : undefined }}>
                        <Table.Row bgColor='transparent' >
                            <Table.Cell py='2' px='2' colSpan={columns.length + Number(enableCheckboxSelection || 0)}>
                                <ProgressHandler visibility={_loading ? 'visible' : "hidden"} maxW="full" value={null} size='xs' />
                                <Box pl='3' w={tableContainerWidth || "fit-content"} pos='sticky' left={0}>
                                    <Pagination
                                        count={totalRows || 10}
                                        defaultPage={pageNumber}
                                        onChange={_onPaginationChange}
                                        defaultPageSize={rowsPerPage}
                                        pageSizes={[10, 25, 50, 100]}
                                    />
                                </Box>
                            </Table.Cell>
                        </Table.Row>
                    </Table.Footer>
                </Table.Root>
            </Table.ScrollArea>
        </Box>
    )
}


interface PaginationProps {
    count: number;
    /**
     * default page sizes list [10, 25, 50, 100]
     */
    pageSizes?: number[],
    defaultPageSize?: number,
    defaultPage?: number,
    onChange?: (pageNumber: number, pageSize: number) => void,
}
function Pagination({
    count, defaultPage = 1, defaultPageSize, onChange, pageSizes = [25, 50, 75, 100]
}: PaginationProps) {
    const [pageNumber, setPageNumber] = useState(defaultPage);
    const [pageSize, setPageSize] = useState(defaultPageSize || pageSizes[0]);
    const [numberOfPages, setNumberOfPages] = useState(Math.ceil(count / pageSize));
    const [pageButtonNumbers, setPageButtonNumber] = useState<number[]>([])
    const { colorMode } = useColorMode()

    useEffect(() => {
        onChange && onChange(pageNumber, pageSize)
    }, [pageNumber, pageSize, numberOfPages])

    useEffect(() => {
        moveToFirstPage();
        setNumberOfPages(Math.ceil(count / pageSize))
    }, [pageSize, count])

    const moveToFirstPage = () => { setPageNumber(1); }
    const moveToLastPage = () => { setPageNumber(numberOfPages); }
    const increasePage = () => { (pageNumber < numberOfPages) && setPageNumber(pageNumber + 1); }
    const decreasePage = () => { (pageNumber > 1) && setPageNumber(pageNumber - 1); }

    return (
        <>
            <Flex aria-label='pagination' gap={5} align='center' justify='flex-end'>
                <Box bgColor='brand1.600' color='brand2.200' p='1' px='5' rounded='lg' >{pageNumber}</Box>
                <Box >of {numberOfPages} pages</Box>
                <Flex gap={2} >
                    <Icon as={IoChevronBackOutline} color={pageNumber === 1 ? "black" : colorMode === 'dark' ? 'white' : 'brand1.500'} cursor='pointer' onClick={decreasePage} boxSize={7} />
                    <Icon as={IoChevronForwardOutline} color={pageNumber >= numberOfPages ? "black" : colorMode === 'dark' ? 'white' : 'brand1.500'} cursor='pointer' onClick={increasePage} boxSize={7} />
                </Flex>
                <Box>Rows per pages</Box>
                {/* value={(pageSize.toString)} onValueChange={(val) => setPageSize(Number(val) || 1)} */}
                <NativeSelect.Root >
                    <NativeSelect.Field value={pageSize} bgColor='app.maroon1' color='app.yellow1' w='24'
                        onChange={(e) => { setPageSize(Number(e.target.value) || 1) }}
                    >
                        {pageSizes.map(v => <option key={v} value={v} >{v}</option>)}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
            </Flex>
        </>
    )
}
const frameworks = createListCollection({
    items: [
        { label: "React.js", value: "react" },
        { label: "Vue.js", value: "vue" },
        { label: "Angular", value: "angular" },
        { label: "Svelte", value: "svelte" },
    ],
})


function ProgressHandler(props: ProgressRootProps) {
    return (
        <Progress.Root {...props}  >
            <Progress.Track bgColor='brand1.200' >
                <Progress.Range />
            </Progress.Track>
        </Progress.Root>
    )
}
