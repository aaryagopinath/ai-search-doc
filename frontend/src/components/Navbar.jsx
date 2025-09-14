import { useState } from "react";
import { AppBar, Toolbar, Typography, InputBase, Box } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { searchDocuments } from "../services/api"; // ✅ Import API

export default function Navbar({ onSearchResults }) {
  const [query, setQuery] = useState("");

  const handleSearch = async (e) => {
    if (e.key === "Enter") {
      try {
        const results = await searchDocuments(query);
        console.log("Search results:", results);
        if (onSearchResults) onSearchResults(results);
      } catch (err) {
        console.error("Search failed:", err);
      }
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: "bold" }}
        >
          AI Doc Search
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            padding: "0 8px",
            borderRadius: 2,
          }}
        >
          <SearchIcon />
          <InputBase
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            sx={{ ml: 1, color: "inherit", width: 200 }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
