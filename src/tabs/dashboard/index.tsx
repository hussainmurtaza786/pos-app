import {
    Box,} from "@chakra-ui/react";
import ReturnImpacts from "./components/ReturnImpacts";
import SalesAndProfit from "./components/SalesAndProfit";
import SalesBoxes from "./components/SalesBoxes";

export default function Dashboard() {
  return ( 
  <Box m={4}>
   <>
   <SalesAndProfit />
    {/* <ReturnImpacts /> */}
    {/* <SalesBoxes /> */}
   </>
  </Box>
  );
}
