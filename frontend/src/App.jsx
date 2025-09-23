import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import Navbar from "./components/Navbar";
import HomePanel from "./components/HomePanel";
import { useState } from "react";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    secondary: { main: "#9c27b0" },
  },
});

export default function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDone, setSearchDone] = useState(false); // ✅ track if search was performed


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
     <Navbar
       onSearchResults={(results) => {
         setSearchResults(results);
         setSearchDone(true);
       }}
       setLoading={setSearchLoading}
       setSearchDone={setSearchDone} // ✅ pass this down
     />

<HomePanel
        searchResults={searchResults}
        searchLoading={searchLoading}
        searchDone={searchDone} // ✅ pass it down
      />    </ThemeProvider>
  );
}
