package service;

import com.docsearch.model.DocumentEntity;
import com.docsearch.repository.DocumentRepository;
import com.docsearch.service.impl.DocumentServiceImpl;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link DocumentServiceImpl}.
 * <p>
 * Verifies file upload (text and PDF), text extraction, persistence via {@link DocumentRepository},
 * and document search behavior with {@link VectorStore}.
 */
class DocumentServiceImplTest {

    private DocumentRepository repo;
    private VectorStore vectorStore;
    private  ChatClient ollamaChatClient;
    private DocumentServiceImpl service;

    /**
     * Initializes mocks for {@link DocumentRepository} and {@link VectorStore},
     * and sets up a fresh {@link DocumentServiceImpl} before each test.
     */
    @BeforeEach
    void setUp() {
        repo = mock(DocumentRepository.class);
        vectorStore = mock(VectorStore.class);
        ollamaChatClient = mock(ChatClient.class);
        service = new DocumentServiceImpl(repo, vectorStore,ollamaChatClient);
    }

    /**
     * Tests uploading a plain text file.
     * <p>
     * Verifies that the text content is saved in the {@link DocumentEntity},
     * persisted via the repository, and chunks are added to the vector store.
     */
    @Test
    void upload_TextFile_SavesEntityAndChunks() throws Exception {
        String content = "Hello world, this is a test file.";
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", "text/plain", content.getBytes(StandardCharsets.UTF_8)
        );

        DocumentEntity savedEntity = DocumentEntity.builder()
                .id(1L)
                .filename("test.txt")
                .contentType("text/plain")
                .contentText(content)
                .description("desc")
                .uploadedAt(Instant.now())
                .build();

        when(repo.save(any(DocumentEntity.class))).thenReturn(savedEntity);

        DocumentEntity result = service.upload(file, "desc");

        assertThat(result.getFilename()).isEqualTo("test.txt");
        assertThat(result.getContentText()).contains("Hello world");

        verify(repo, times(1)).save(any(DocumentEntity.class));
        verify(vectorStore, atLeastOnce()).add(anyList());
    }

    /**
     * Tests uploading a PDF file.
     * <p>
     * Uses a helper to create a simple PDF with text content, then verifies that
     * the extracted text is persisted correctly and chunks are added to the vector store.
     */
    @Test
    void upload_PdfFile_ExtractsTextAndSaves() throws Exception {
        String pdfText = "This is PDF content.";
        byte[] pdfBytes = createSimplePdfBytes(pdfText);

        MockMultipartFile file = new MockMultipartFile(
                "file", "sample.pdf", "application/pdf", pdfBytes
        );

        DocumentEntity savedEntity = DocumentEntity.builder()
                .id(2L)
                .filename("sample.pdf")
                .contentType("application/pdf")
                .contentText(pdfText)
                .uploadedAt(Instant.now())
                .build();

        when(repo.save(any(DocumentEntity.class))).thenReturn(savedEntity);

        DocumentEntity result = service.upload(file, null);

        assertThat(result.getFilename()).isEqualTo("sample.pdf");
        assertThat(result.getContentText()).contains("PDF");

        verify(repo, times(1)).save(any(DocumentEntity.class));
        verify(vectorStore, atLeastOnce()).add(anyList());
    }

    /**
     * Tests the search method when vector store returns results.
     * <p>
     * Verifies that matching document IDs from the vector store are
     * fetched from the repository and returned.
     */
    @Test
    void search_WithVectorResults_ReturnsRepoEntities() {
        Document doc = new Document("chunk", java.util.Map.of("docId", 5L));
        when(vectorStore.similaritySearch(any(SearchRequest.class)))
                .thenReturn(List.of(doc));

        DocumentEntity entity = DocumentEntity.builder().id(5L).filename("a.txt").build();
        when(repo.findAllById(Set.of(5L))).thenReturn(List.of(entity));

        List<DocumentEntity> results = service.search("hello");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo(5L);

        verify(vectorStore).similaritySearch(any(SearchRequest.class));
        verify(repo).findAllById(Set.of(5L));
    }

    /**
     * Tests the search method when vector store returns no results.
     * <p>
     * Verifies that the service falls back to the repository's
     * LIKE-based search query.
     */
    @Test
    void search_NoVectorResults_FallsBackToDbSearch() {
        when(vectorStore.similaritySearch(any(SearchRequest.class)))
                .thenReturn(List.of());

        DocumentEntity entity = DocumentEntity.builder().id(10L).filename("db.txt").build();
        when(repo.searchLike("world")).thenReturn(List.of(entity));

        List<DocumentEntity> results = service.search("world");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getFilename()).isEqualTo("db.txt");

        verify(repo).searchLike("world");
    }

    /**
     * Helper method to create a simple in-memory PDF containing the given text.
     *
     * @param text the text content to embed in the PDF
     * @return a byte array representing the generated PDF
     */
    private byte[] createSimplePdfBytes(String text) throws Exception {
        try (var out = new java.io.ByteArrayOutputStream();
             var doc = new org.apache.pdfbox.pdmodel.PDDocument()) {
            var page = new org.apache.pdfbox.pdmodel.PDPage();
            doc.addPage(page);

            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            try (var contentStream = new org.apache.pdfbox.pdmodel.PDPageContentStream(doc, page)) {
                contentStream.beginText();
                contentStream.setFont(font, 12);
                contentStream.newLineAtOffset(100, 700);
                contentStream.showText(text);
                contentStream.endText();
            }
            doc.save(out);
            return out.toByteArray();
        }
    }

    /**
     * Tests the correctFile method with a PDF file containing grammar/spelling errors.
     * <p>
     * Verifies that the text is extracted from the PDF, sent to the ChatClient for correction,
     * and returned as a DocumentEntity with the corrected content, original filename, and appropriate description.
     */

    @Test
    void correctFile_PdfFile_ReturnsCorrectedEntity() throws Exception {
        String pdfText = "Thiss is PDF cntent.";
        String correctedPdfText = "This is PDF content.";
        byte[] pdfBytes = createSimplePdfBytes(pdfText);

        MockMultipartFile file = new MockMultipartFile(
                "file", "wrong.pdf", "application/pdf", pdfBytes
        );

        ChatClient.ChatClientRequest mockRequest = mock(ChatClient.ChatClientRequest.class);
        ChatClient.ChatClientRequest.CallResponseSpec mockCallSpec = mock(ChatClient.ChatClientRequest.CallResponseSpec.class);

        when(ollamaChatClient.prompt()).thenReturn(mockRequest);
        when(mockRequest.user(anyString())).thenReturn(mockRequest);
        when(mockRequest.call()).thenReturn(mockCallSpec);
        when(mockCallSpec.content()).thenReturn(correctedPdfText);

        DocumentEntity result = service.correctFile(file);

        assertThat(result.getFilename()).isEqualTo("wrong.pdf");
        assertThat(result.getContentText()).isEqualTo(correctedPdfText);
        assertThat(result.getDescription()).isEqualTo("Grammar/Spelling corrected version");

        verify(ollamaChatClient).prompt();
        verify(mockRequest).user(contains("Please correct the spelling and grammar"));
        verify(mockRequest).call();
        verify(mockCallSpec).content();
    }


}
