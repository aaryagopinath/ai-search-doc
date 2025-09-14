import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import Navbar from "./components/Navbar";
import HomePanel from "./components/HomePanel"; // ✅ directly use HomePanel instead of Router

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar onSearchResults={setSearchResults} />
      <HomePanel searchResults={searchResults} />
    </ThemeProvider>
  );
}
