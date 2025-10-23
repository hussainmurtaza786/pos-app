import { Box, Text } from "@chakra-ui/react";


export default function MiniDashboard() {
  return (
    <Box borderWidth={1} borderRadius="md" p={4}>
      <Text fontSize="lg" fontWeight="bold">
        Mini Dashboard
      </Text>
    </Box>
  );
};