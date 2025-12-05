
import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  InputBase,
  Box,
  IconButton,
  Tabs,
  Tab
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HomeIcon from "@mui/icons-material/Home";
import DescriptionIcon from "@mui/icons-material/Description";
import { searchDocuments } from "../services/api";

export default function Navbar({
  onSearchResults,
  setLoading,
  setSearchDone,
  currentTab,
  onTabChange
}) {
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async (e) => {
    if (e.key === "Enter") {
      try {
        setLoading(true);
        setSearchDone(false);
        if (onSearchResults) onSearchResults([]);
        const results = await searchDocuments(query);
        console.log("Search results:", results);
        if (onSearchResults) onSearchResults(results);
        setSearchDone(true);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AppBar
      position="static"
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
        >
          <DescriptionIcon sx={{ fontSize: 28 }} />
          AI Doc Search
        </Typography>

        {/* Navigation Tabs */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Tabs
            value={currentTab}
            onChange={onTabChange}
            textColor="inherit"
            TabIndicatorProps={{
              sx: {
                backgroundColor: 'white',
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            <Tab
              icon={<HomeIcon />}
              label="Home"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                minHeight: 64,
                textTransform: 'none',
                fontSize: '15px',
                fontWeight: 500,
                '&.Mui-selected': {
                  color: 'white',
                },
                '&:hover': {
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            />
            <Tab
              icon={<DescriptionIcon />}
              label="Documents"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                minHeight: 64,
                textTransform: 'none',
                fontSize: '15px',
                fontWeight: 500,
                '&.Mui-selected': {
                  color: 'white',
                },
                '&:hover': {
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            />
          </Tabs>

          {/* Search Toggle Button */}
          <IconButton
            onClick={() => setShowSearch(!showSearch)}
            sx={{
              color: 'white',
              ml: 2,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              }
            }}
          >
          </IconButton>

          {/* Search Box (shown when search icon is clicked) */}
          {showSearch && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                padding: "4px 12px",
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
              }}
            >
              <SearchIcon sx={{ mr: 1 }} />
              <InputBase
                placeholder="Search documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearch}
                sx={{
                  color: "inherit",
                  width: 250,
                  '& input::placeholder': {
                    color: 'rgba(255,255,255,0.7)'
                  }
                }}
                autoFocus
              />
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}