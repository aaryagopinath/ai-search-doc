import { Container, Typography, Box } from "@mui/material";

export default function Home() {
  return (
    <Container>
      <Box textAlign="center" mt={5}>
        <Typography variant="h3" gutterBottom>
          Welcome to AI Doc Search
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Upload, search, and auto-correct your documents with AI-powered
          semantic search and grammar enhancements.
        </Typography>
      </Box>
    </Container>
  );
}
