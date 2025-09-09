import { useState } from "react";
import { fixGrammar } from "../services/api";
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";

export default function GrammarFix() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [correctedText, setCorrectedText] = useState("");

  const handleFix = async () => {
    if (!file) return alert("Please select a file");
    setLoading(true);
    try {
      const response = await fixGrammar(file);
      setCorrectedText(response.correctedText || "Correction done.");
    } catch (error) {
      setCorrectedText("Failed to correct grammar!");
    }
    setLoading(false);
  };

  return (
    <Container>
      <Typography variant="h4" mt={4} mb={2}>
        Grammar & Spell Correction
      </Typography>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <Box mt={2}>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleFix}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Correct Grammar"}
        </Button>
      </Box>
      {correctedText && (
        <Box mt={3}>
          <Typography variant="h6">Corrected Text:</Typography>
          <Typography variant="body1" color="text.secondary">
            {correctedText}
          </Typography>
        </Box>
      )}
    </Container>
  );
}
