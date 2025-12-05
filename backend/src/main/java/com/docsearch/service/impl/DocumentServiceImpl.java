package com.docsearch.service.impl;
import org.springframework.ai.chat.client.ChatClient;

import com.docsearch.model.DocumentEntity;
import com.docsearch.repository.DocumentRepository;
import com.docsearch.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of {@link DocumentService} that manages documents in the system.
 * <p>
 * Responsibilities:
 * <ul>
 *     <li>Extract text from uploaded documents (supports plain text and PDF).</li>
 *     <li>Persist document metadata and content in the database.</li>
 *     <li>Index document chunks into a vector store for semantic search.</li>
 *     <li>Provide search functionality using both semantic (vector-based) and fallback keyword search.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository repo;
    private final VectorStore vectorStore;
    private final ChatClient ollamaChatClient;

    /**
     * Uploads a document and prepares it for semantic search.
     * <p>
     * For PDF files, the text is extracted using Apache PDFBox.
     * For other file types (e.g., plain text), the content is read directly.
     * The document is stored in the database and chunked into smaller parts,
     * which are indexed into the vector store for semantic similarity search.
     *
     * @param file        the uploaded document (PDF or text)
     * @param description optional description provided by the user
     * @return the saved {@link DocumentEntity} containing metadata and extracted text
     * @throws IOException if reading or parsing the file fails
     */
    @Override
    @Transactional
    public DocumentEntity upload(MultipartFile file, String description) throws IOException {
        String text;

        if ("application/pdf".equalsIgnoreCase(file.getContentType())) {
            try (PDDocument pdfDoc = Loader.loadPDF(file.getInputStream().readAllBytes())) {
                PDFTextStripper stripper = new PDFTextStripper();
                text = stripper.getText(pdfDoc);
            }
        } else {
            text = new String(file.getBytes(), StandardCharsets.UTF_8);
        }

        DocumentEntity entity = DocumentEntity.builder()
                .filename(file.getOriginalFilename())
                .contentType(file.getContentType())
                .contentText(text)
                .description(description)
                .uploadedAt(Instant.now())
                .build();

        DocumentEntity saved = repo.save(entity);

        List<String> chunks = chunkText(text, 800, 120);
        int idx = 0;

        for (String chunk : chunks) {
            Document doc = new Document(
                    chunk,
                    Map.of(
                            "docId", saved.getId(),
                            "chunkIndex", idx++
                    )
            );
            vectorStore.add(List.of(doc));
        }

        return saved;
    }

    /**
     * Searches documents by query string.
     * <p>
     * The method first attempts a semantic search using the vector store.
     * If no relevant results are found, it falls back to a traditional
     * case-insensitive LIKE search in the database.
     *
     * @param q the query string
     * @return a list of matching {@link DocumentEntity} results
     */
    @Override
    public List<DocumentEntity> search(String q) {
        try {
            List<Document> results = vectorStore.similaritySearch(
                    SearchRequest.query(q).withTopK(10)
                            .withSimilarityThreshold(0.5)
            );

            Set<Long> ids = results.stream()
                    .map(doc -> {
                        Object id = doc.getMetadata().get("docId");
                        return (id instanceof Number) ? ((Number) id).longValue() : null;
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            if (!ids.isEmpty()) {
                return repo.findAllById(ids);
            }
        } catch (Exception ignored) {
        }

        return repo.searchLike(q);
    }

    /**
     * Splits a long text into smaller chunks for vector indexing.
     * <p>
     * Each chunk has a maximum length, with an overlap between consecutive chunks
     * to preserve semantic continuity across boundaries.
     *
     * @param text    the input text
     * @param maxLen  maximum length of each chunk
     * @param overlap number of overlapping characters between consecutive chunks
     * @return a list of text chunks
     */
    private List<String> chunkText(String text, int maxLen, int overlap) {
        List<String> parts = new ArrayList<>();
        if (text == null) return parts;
        int n = text.length();
        int i = 0;
        while (i < n) {
            int end = Math.min(n, i + maxLen);
            parts.add(text.substring(i, end));
            if (end == n) break;
            i = end - overlap;
            if (i < 0) i = 0;
        }
        return parts;
    }

    /**
     * Processes an uploaded file (PDF or text), corrects its grammar and spelling
     * using the AI model, and returns a new {@link DocumentEntity} containing the
     * corrected content.
     * <p>
     * Steps:
     * <ol>
     *   <li>Extract text from the uploaded file (PDF → via PDFBox, plain text → directly).</li>
     *   <li>Send the extracted text to the {@link #correctText(String)} method for correction.</li>
     *   <li>Wrap the corrected content into a {@link DocumentEntity} with metadata.</li>
     * </ol>
     * <p>
     * Note: This method does not persist the corrected document into the database.
     * If persistence is needed, explicitly call the repository.
     *
     * @param file The uploaded file (PDF or text) whose content needs correction.
     * @return A new {@link DocumentEntity} containing the corrected text and metadata.
     * @throws IOException If there is an error reading the file.
     */
    @Override
    public DocumentEntity correctFile(MultipartFile file) throws IOException {
        String text;

        if ("application/pdf".equalsIgnoreCase(file.getContentType())) {
            try (PDDocument pdfDoc = Loader.loadPDF(file.getInputStream().readAllBytes())) {
                text = new PDFTextStripper().getText(pdfDoc);
            }
        } else {
            text = new String(file.getBytes(), StandardCharsets.UTF_8);
        }

        String corrected = correctText(text);


        return DocumentEntity.builder()
                .filename(file.getOriginalFilename())
                .contentType(file.getContentType())
                .contentText(corrected)
                .description("Grammar/Spelling corrected version")
                .uploadedAt(Instant.now())
                .build();
    }

    /**
     * Sends the given text to the Ollama chat client for grammar and spelling correction.
     * <p>
     * Constructs a prompt instructing the AI model to correct errors while preserving
     * the meaning and structure of the original input.
     *
     * @param input The raw input text to be corrected.
     * @return The corrected version of the text as returned by the AI model.
     */
    private String correctText(String input) {
        String prompt = "Please correct the spelling and grammar in the following text. " +
                "Preserve meaning and structure:\n\n" + input;

        return ollamaChatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }

    public List<DocumentEntity> getAllDocuments() {
        return repo.findAll();
    }

    public boolean deleteDocument(Long id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return true;
        }
        return false;
    }

}
