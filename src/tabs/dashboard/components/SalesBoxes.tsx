import { Box, Grid } from "@chakra-ui/react";
import { Flex, Heading, Text, SimpleGrid, Stack, Icon as ChakraIcon } from '@chakra-ui/react';
import { FaDollarSign } from 'react-icons/fa';
import { BiShoppingBag, BiTrendingUp } from 'react-icons/bi';


export default function SalesBoxes() {
    return (
        <Grid templateColumns="repeat(3, 1fr)" gap="6">
            <Box title="Today's Sales"
                      value={gross.today.sales}
                      icon={FaDollarSign}
                      color="blue.600"></Box>
           <Box bg="blue.500" h="20"></Box>
           <Box bg="blue.500" h="20"></Box>
    </Grid>
    )
}