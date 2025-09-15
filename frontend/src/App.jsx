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
  const [loading, setLoading] = useState(false); // ✅ global loading

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar onSearchResults={setSearchResults} setLoading={setLoading} />
      <HomePanel searchResults={searchResults} loading={loading} />
    </ThemeProvider>
  );
}
