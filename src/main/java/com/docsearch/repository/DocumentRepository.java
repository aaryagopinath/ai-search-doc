package com.docsearch.repository;

import com.docsearch.model.DocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

/**
 * Repository interface for accessing and managing {@link DocumentEntity} records.
 * <p>
 * Extends {@link JpaRepository} to provide standard CRUD operations.
 * Includes a custom search method that performs a case-insensitive
 * "LIKE" search on the document's text content, description, or filename.
 */
public interface DocumentRepository extends JpaRepository<DocumentEntity, Long> {

    /**
     * Performs a case-insensitive search for documents where the query string
     * matches any part of the content text, description, or filename.
     *
     * @param q the search query string
     * @return a list of {@link DocumentEntity} objects that match the query
     */
    @Query("SELECT d FROM DocumentEntity d WHERE LOWER(d.contentText) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(d.description) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(d.filename) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<DocumentEntity> searchLike(String q);
}
