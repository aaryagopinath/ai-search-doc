package com.docsearch.service;

import com.docsearch.model.DocumentEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Service interface for managing documents.
 * <p>
 * Provides operations for uploading documents and performing
 * semantic or keyword-based searches.
 */
public interface DocumentService {

    /**
     * Uploads a document into the system.
     * <p>
     * The uploaded file is processed (text extracted for PDFs, plain text otherwise),
     * stored in the database, and indexed in the vector store for semantic search.
     *
     * @param file        the document file to upload (text or PDF)
     * @param description optional description of the document
     * @return the saved {@link DocumentEntity} containing metadata and extracted text
     * @throws IOException if there is an error reading the file
     */
    DocumentEntity upload(MultipartFile file, String description) throws IOException;

    /**
     * Searches for documents based on the given query.
     * <p>
     * The search is first attempted in the vector store (semantic search).
     * If no results are found, it falls back to a database "LIKE" search.
     *
     * @param q the search query string
     * @return a list of {@link DocumentEntity} objects matching the query
     */
    List<DocumentEntity> search(String q);

}
