import { useState } from "react";
import { searchDocuments } from "../services/api";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const response = await searchDocuments(query);
    setResults(response);
  };

  return (
    <Container>
      <Typography variant="h4" mt={4} mb={2}>
        Search Documents
      </Typography>
      <Box display="flex" gap={2}>
        <TextField
          label="Enter search query"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </Box>

      <List>
        {results.map((doc) => (
          <ListItem key={doc.id}>
            <ListItemText
              primary={doc.filename}
              secondary={doc.description || "No description"}
            />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}
