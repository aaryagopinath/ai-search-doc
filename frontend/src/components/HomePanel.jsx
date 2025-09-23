import { useState } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min?url";

import { uploadDocument, fixGrammar } from "../services/api";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function HomePanel({ searchResults = [], searchLoading, searchDone  }) {
  const [showEditor, setShowEditor] = useState(false);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileObject, setFileObject] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePasteClick = () => setShowEditor(true);

 const handleFileUpload = async (e) => {
   const file = e.target.files[0];
   if (!file) return;

   setFileObject(file);
   setFileName(file.name);
   setShowEditor(true);

   try {
     // ✅ 1. Upload to backend immediately
     setLoading(true);
     const result = await uploadDocument(file, "Uploaded from UI");
     console.log("✅ Uploaded document:", result);

     // ✅ 2. Show content returned from backend (if any)
     if (result.contentText) {
       setText(result.contentText);
     }

     // ✅ 3. If backend doesn't return text, still try to extract locally (fallback)
     else if (file.type === "application/pdf") {
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


  const handleUploadToBackend = async () => {
    if (!fileObject) return alert("No file selected!");
    setLoading(true);
    try {
      const result = await uploadDocument(fileObject, "Uploaded from UI");
      // ✅ Update editor text with backend's saved content
      if (result.contentText) setText(result.contentText);
      alert(`✅ Document uploaded successfully: ${result.id || "OK"}`);
    } catch (error) {
      console.error("Upload failed:", error);
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

  return (
    <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3, textAlign: "center" }}>
         {searchLoading  ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress size={40} />
                </Box>
                ) : searchDone && searchResults.length === 0 ? ( // ✅ if search done & no results
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    No results found.
                  </Typography>
              ) : (
                  <>
      {/* 🔍 Show search results if present */}
      {searchResults.length > 0 && (
        <Box mb={3} textAlign="left">
          <Typography variant="h6" fontWeight="bold">
            Search Results
          </Typography>
          {searchResults.map((doc, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                mt: 1,
                backgroundColor: "#f9f9f9",
                cursor: "pointer",
                "&:hover": { backgroundColor: "#f1f1f1" },
              }}
              onClick={() => {
                setShowEditor(true);
                setText(doc.contentText);
                setFileName(doc.filename);
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                {doc.filename}
              </Typography>
              <Typography
                variant="body2"
                noWrap
                sx={{ color: "text.secondary" }}
              >
                {doc.contentText}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {!showEditor ? (
        <>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Add text or upload doc
          </Typography>
          <Box display="flex" justifyContent="center" gap={2} mt={3}>
            <Button
              variant="outlined"
              startIcon={<ContentPasteIcon />}
              onClick={handlePasteClick}
              sx={{ px: 3, py: 1.5, borderRadius: 3 }}
            >
              Paste text
            </Button>

            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ px: 3, py: 1.5, borderRadius: 3 }}
            >
              Upload document
              <input
                type="file"
                accept=".txt,.pdf,.md,.csv"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
          </Box>
        </>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
                          {fileObject && (
  <Box display="flex" alignItems="center" gap={2}>

{/* //           {fileName && ( */}
            <Typography variant="body2" color="text.secondary">
              Uploaded: {fileName}
            </Typography>
             <Button
                                variant="outlined"
                                component="label"
                                size="small"
                                startIcon={<CloudUploadIcon />}
                              >
                                Change File
                                <input type="file" hidden onChange={handleFileUpload} />
                              </Button>
                                <Button
                                                  variant="text"
                                                  color="error"
                                                  size="small"
                                                  onClick={() => {
                                                    setFileObject(null);
                                                    setFileName("");
                                                    setText("");
                                                    setShowEditor(false);
                                                  }}
                                                >
                                                  Clear
                                                </Button>
                                                </Box>
          )}

          <TextField
            multiline
            rows={10}
            placeholder="Type or paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <Box display="flex" gap={2} justifyContent="center">
{/*             <Button */}
{/*               variant="outlined" */}
{/*               onClick={handleUploadToBackend} */}
{/*               disabled={!fileObject || loading} */}
{/*             > */}
{/*               {loading ? <CircularProgress size={20} /> : "Upload to Backend"} */}
{/*             </Button> */}

            <Button
              variant="contained"
              color="secondary"
              onClick={handleGrammarFix}
              disabled={loading || (!text && !fileObject)}
            >
              {loading ? <CircularProgress size={20} /> : "Fix Grammar"}
            </Button>
          </Box>
        </Box>
      )}
     </>
        )}
    </Paper>
  );
}
