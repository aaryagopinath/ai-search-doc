import { useState } from "react";
import { uploadDocument } from "../services/api";
import {
  Container,
  Typography,
  Button,
  TextField,
  Box,
  CircularProgress,
} from "@mui/material";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");
    setLoading(true);
    try {
      const response = await uploadDocument(file, description);
      setMessage(`Uploaded: ${response.filename}`);
    } catch (error) {
      setMessage("Upload failed!");
    }
    setLoading(false);
  };

  return (
    <Container>
      <Typography variant="h4" mt={4} mb={2}>
        Upload Document
      </Typography>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <TextField
        label="Description"
        fullWidth
        margin="normal"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Box mt={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Upload"}
        </Button>
      </Box>
      {message && (
        <Typography color="success.main" mt={2}>
          {message}
        </Typography>
      )}
    </Container>
  );
}
