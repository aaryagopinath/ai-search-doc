
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min?url";

import { uploadDocument, fixGrammar } from "../services/api";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function HomePanel({ searchResults = [], searchLoading, searchDone, openDoc }) {
  const [showEditor, setShowEditor] = useState(false);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileObject, setFileObject] = useState(null);
  const [loading, setLoading] = useState(false);


useEffect(() => {
  if (openDoc) {
    setShowEditor(true);
    setText(openDoc.contentText);
    setFileName(openDoc.filename);
  }
}, [openDoc]);
  const handlePasteClick = () => setShowEditor(true);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileObject(file);
    setFileName(file.name);
    setShowEditor(true);

    try {
      setLoading(true);
      const result = await uploadDocument(file, "Uploaded from UI");
      console.log("✅ Uploaded document:", result);

      if (result.contentText) {
        setText(result.contentText);
      } else if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(" ");
          fullText += pageText + "\n\n";
        }

        setText(fullText || "⚠️ No text could be extracted from this PDF.");
      } else {
        const reader = new FileReader();
        reader.onload = (event) => setText(event.target.result);
        reader.readAsText(file);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("❌ Failed to upload document to backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleGrammarFix = async () => {
    if (!fileObject && !text) return alert("Nothing to fix!");
    setLoading(true);
    try {
      let result;
      if (fileObject) {
        result = await fixGrammar(fileObject);
      } else {
        const blob = new Blob([text], { type: "text/plain" });
        result = await fixGrammar(blob);
      }
      console.log("Grammar fix response:", result);
      setText(result.contentText || "✅ Grammar fixed, but no text returned.");
    } catch (error) {
      console.error("Grammar fix failed:", error);
      alert("❌ Failed to fix grammar.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFileObject(null);
    setFileName("");
    setText("");
    setShowEditor(false);
  };

  // Helper function to get appropriate file icon
  const getFileIcon = (filename) => {
    const ext = filename?.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <PictureAsPdfIcon sx={{ color: "#d32f2f", fontSize: 32 }} />;
    if (ext === "txt") return <TextSnippetIcon sx={{ color: "#1976d2", fontSize: 32 }} />;
    if (ext === "md") return <DescriptionIcon sx={{ color: "#424242", fontSize: 32 }} />;
    return <InsertDriveFileIcon sx={{ color: "#757575", fontSize: 32 }} />;
  };

  // Calculate word and character count
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  return (
    <Paper
      sx={{
        p: 4,
        borderRadius: 3,
        boxShadow: 3,
        background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
        minHeight: "500px",
      }}
    >
      {searchLoading ? (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="300px"
          gap={2}
        >
          <CircularProgress size={50} thickness={4} />
          <Typography variant="body1" color="text.secondary">
            Searching documents...
          </Typography>
        </Box>
      ) : searchDone && searchResults.length === 0 ? (
        <Box textAlign="center" py={4}>
          <DescriptionIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No results found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search terms
          </Typography>
        </Box>
      ) : (
        <>
          {/* Search Results Section */}
          {searchResults.length > 0 && (
            <Box mb={4}>
              <Typography
                variant="h6"
                fontWeight="bold"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <DescriptionIcon /> Search Results
              </Typography>
              <Box display="flex" flexDirection="column" gap={1.5} mt={2}>
                {searchResults.map((doc, index) => (
                  <Card
                    key={index}
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => {
                      setShowEditor(true);
                      setText(doc.contentText);
                      setFileName(doc.filename);
                    }}
                  >
                    <CardContent
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2,
                        "&:last-child": { pb: 2 },
                      }}
                    >
                      {getFileIcon(doc.filename)}
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight="600">
                          {doc.filename}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {doc.contentText}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              <Box sx={{ height: 1, backgroundColor: "#e0e0e0", my: 3 }} />
            </Box>
          )}

          {/* Main Content Area */}
          {!showEditor ? (
            <Box textAlign="center" py={6}>
              {/* Animated Icon Circle */}
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  margin: "0 auto 32px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
                }}
              >
                <DescriptionIcon sx={{ fontSize: 60, color: "white" }} />
              </Box>

              <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 1 }}>
                Add Your Document
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4, maxWidth: 500, mx: "auto" }}
              >
                Paste text directly or upload a document to
                manage and enhance your documents with AI

              </Typography>

              <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ContentPasteIcon />}
                  onClick={handlePasteClick}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: "none",
                    fontSize: "1rem",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                      boxShadow: "0 6px 20px rgba(102, 126, 234, 0.5)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  Paste Text
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: "none",
                    fontSize: "1rem",
                    borderWidth: 2,
                    borderColor: "#667eea",
                    color: "#667eea",
                    "&:hover": {
                      borderWidth: 2,
                      borderColor: "#667eea",
                      background: "rgba(102, 126, 234, 0.04)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  Upload Document
                  <input
                    type="file"
                    accept=".txt,.pdf,.md,.csv"
                    hidden
                    onChange={handleFileUpload}
                  />
                </Button>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: "block" }}>
                Supported formats: TXT, PDF
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* Editor Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                  p: 2,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: 2,
                  color: "white",
                }}
              >
                <Box display="flex" alignItems="center" gap={2} flex={1}>
                  {fileObject && getFileIcon(fileName)}
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight="600">
                      {fileName || "Untitled Document"}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      {wordCount} words • {charCount} characters
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" gap={1}>
                  {fileObject && (
                    <Button
                      component="label"
                      size="small"
                      startIcon={<CloudUploadIcon />}
                      sx={{
                        color: "white",
                        borderColor: "rgba(255,255,255,0.5)",
                        textTransform: "none",
                        "&:hover": {
                          borderColor: "white",
                          background: "rgba(255,255,255,0.1)",
                        },
                      }}
                      variant="outlined"
                    >
                      Change
                      <input
                        type="file"
                        hidden
                        onChange={handleFileUpload}
                        accept=".txt,.pdf,.md,.csv"
                      />
                    </Button>
                  )}
                  <IconButton
                    size="small"
                    onClick={handleClear}
                    sx={{
                      color: "white",
                      "&:hover": { background: "rgba(255,255,255,0.2)" },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Text Editor */}
              <TextField
                multiline
                rows={12}
                fullWidth
                placeholder="Type or paste your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    fontSize: "1rem",
                    lineHeight: 1.6,
                  },
                }}
              />

              {/* Action Buttons */}
              <Box display="flex" gap={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <AutoFixHighIcon />
                    )
                  }
                  onClick={handleGrammarFix}
                  disabled={loading || (!text && !fileObject)}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: "none",
                    fontSize: "1rem",
                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    boxShadow: "0 4px 15px rgba(245, 87, 108, 0.4)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #e082ea 0%, #e4465b 100%)",
                      boxShadow: "0 6px 20px rgba(245, 87, 108, 0.5)",
                      transform: "translateY(-2px)",
                    },
                    "&:disabled": {
                      background: "#e0e0e0",
                    },
                  }}
                >
                  {loading ? "Processing..." : "Fix Grammar"}
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
}