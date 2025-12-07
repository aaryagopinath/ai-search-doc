
import { useState } from "react";
import { Box } from "@mui/material";
import Navbar from "./components/Navbar";
import HomePanel from "./components/HomePanel";
import DocumentsPanel from "./components/DocumentsPanel";

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [editorDoc, setEditorDoc] = useState(null);

  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [documents, setDocuments] = useState([
    {
      id: "1",
      filename: "Meeting Notes.txt",
      contentText: "Discussion points from the quarterly review meeting including action items and deliverables...",
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      fileSize: 24576,
    },
    {
      id: "2",
      filename: "Q3 Financial Report.pdf",
      contentText: "Quarterly financial report with detailed analysis and projections for the upcoming fiscal period...",
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      fileSize: 1258291,
    },
    {
      id: "3",
      filename: "Research Paper.md",
      contentText: "Comprehensive research documentation with findings, methodology, and conclusions...",
      uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      fileSize: 159744,
    },
    // Add more sample documents as needed
  ]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleViewDocument = (doc) => {
    // Switch to home tab and load the document for editing
    setCurrentTab(0);
    // You can pass the document data to HomePanel via state or context
    // For now, we'll just switch tabs
  };

  const handleDeleteDocument = async (docId) => {
    try {
      // Call your API to delete the document
      // await deleteDocument(docId);

      // Update local state
      setDocuments(docs => docs.filter(d => d.id !== docId));
      console.log("Document deleted:", docId);
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Navbar
        onSearchResults={setSearchResults}
        setLoading={setSearchLoading}
        setSearchDone={setSearchDone}
        currentTab={currentTab}
        onTabChange={handleTabChange}
      />

      <Box sx={{ p: 3 }}>
        {currentTab === 0 && (
          <HomePanel
            openDoc = {editorDoc}
            searchResults={searchResults}
            searchLoading={searchLoading}
            searchDone={searchDone}
          />
        )}

        {currentTab === 1 && (
          <DocumentsPanel
            onFix={(doc) => {
                    setEditorDoc(doc);      // send doc to HomePanel
                     setCurrentTab(0);       // switch to HomePanel tab
                             }}
            documents={documents}
            onViewDocument={handleViewDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        )}
      </Box>
    </Box>
  );
}

export default App;