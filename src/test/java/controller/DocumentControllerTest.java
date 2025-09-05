package controller;

import com.docsearch.DocSearchApplication;
import com.docsearch.controller.DocumentController;
import com.docsearch.model.DocumentEntity;
import com.docsearch.service.DocumentService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for {@link DocumentController}.
 * <p>
 * Uses {@link WebMvcTest} to test controller endpoints in isolation,
 * mocking the {@link DocumentService} layer.
 */
@WebMvcTest(controllers = DocumentController.class)
@ContextConfiguration(classes = DocSearchApplication.class)
class DocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DocumentService service;

    /**
     * Tests the /health endpoint.
     * <p>
     * Verifies that the application health check returns a 200 OK
     * with the string "OK".
     */
    @Test
    void healthEndpoint_ReturnsOk() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));
    }

    /**
     * Tests the /documents upload endpoint.
     * <p>
     * Mocks a file upload request and verifies that the saved
     * {@link DocumentEntity} returned from the service is serialized
     * correctly in the response.
     */
    @Test
    void uploadDocument_ReturnsSavedEntity() throws Exception {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "Hello world".getBytes()
        );

        DocumentEntity saved = DocumentEntity.builder()
                .id(1L)
                .filename("test.txt")
                .contentType("text/plain")
                .contentText("Hello world")
                .description("desc")
                .uploadedAt(Instant.now())
                .build();

        Mockito.when(service.upload(any(), eq("desc"))).thenReturn(saved);

        // when + then
        mockMvc.perform(multipart("/documents")
                        .file(file)
                        .param("description", "desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.filename").value("test.txt"))
                .andExpect(jsonPath("$.description").value("desc"));
    }

    /**
     * Tests the /search endpoint.
     * <p>
     * Mocks the service layer to return a list of two documents and verifies
     * that the controller responds with a JSON array of the correct size
     * and matching document IDs.
     */
    @Test
    void searchDocuments_ReturnsList() throws Exception {
        DocumentEntity doc1 = DocumentEntity.builder().id(1L).filename("a.txt").build();
        DocumentEntity doc2 = DocumentEntity.builder().id(2L).filename("b.txt").build();

        Mockito.when(service.search("hello")).thenReturn(List.of(doc1, doc2));

        mockMvc.perform(get("/search").param("q", "hello"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
    }
}
