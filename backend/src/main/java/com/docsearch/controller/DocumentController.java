package com.docsearch.controller;

import com.docsearch.model.DocumentEntity;
import com.docsearch.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * REST controller for managing document upload and semantic search operations.
 * <p>
 * Provides endpoints to:
 * - Check application health
 * - Upload text/PDF files along with optional descriptions
 * - Perform semantic search over uploaded documents
 */
@RestController
@RequestMapping
@RequiredArgsConstructor
@Validated
public class DocumentController {

    private final DocumentService service;

    /**
     * Health check endpoint to verify that the service is running.
     *
     * @return HTTP 200 OK with the string "OK".
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }

    /**
     * Uploads a new document (text or PDF) to the system.
     * <p>
     * The uploaded file is processed, split into chunks, and embedded into the vector store
     * for semantic search. Metadata like filename, content type, and optional description
     * are also persisted.
     *
     * @param file        The file to upload (text or PDF).
     * @param description Optional description for the file.
     * @return The saved {@link DocumentEntity}.
     * @throws IOException if there is an error while reading the file.
     */
    @PostMapping("/documents")
    public ResponseEntity<DocumentEntity> upload(@RequestPart("file") MultipartFile file,
                                                 @RequestParam(value = "description", required = false) String description)
            throws IOException {
        DocumentEntity saved = service.upload(file, description);
        return ResponseEntity.ok(saved);
    }

    /**
     * Performs a semantic search over all uploaded documents.
     * <p>
     * Uses the vector store to retrieve documents most relevant to the query.
     * Falls back to a database LIKE search if no semantic results are found.
     *
     * @param q The user query.
     * @return A list of {@link DocumentEntity} objects that match the query.
     */
    @GetMapping("/search")
    public ResponseEntity<List<DocumentEntity>> search(@RequestParam("q") String q) {
        return ResponseEntity.ok(service.search(q));
    }

    /**
     * Corrects grammar and spelling mistakes in an uploaded file (text or PDF).
     * <p>
     * The uploaded file’s text content is extracted, sent to the AI model for correction,
     * and returned as a {@link DocumentEntity} containing the corrected version.
     * <p>
     * Unlike the upload endpoint, this does not index the document in the vector store
     * unless explicitly persisted later.
     *
     * @param file The uploaded file (text or PDF) to correct.
     * @return A {@link DocumentEntity} containing the corrected content.
     * @throws IOException if there is an error while reading the file.
     */
    @PostMapping("/autocorrect")
    public ResponseEntity<DocumentEntity> correctFile(@RequestPart("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(service.correctFile(file));


    }
}
