# ai-search-doc
AI Semantic Document Search  Spring Boot app for semantic search across TXT &amp; PDF documents.  Upload documents → extract text → generate embeddings with Spring AI + Ollama.  Store &amp; search embeddings via Postgres + pgvector.  REST APIs + unit tests included.

# doc-search (Spring AI + Ollama + pgvector)

This version replaces the previous AI integration with **Spring AI**, **Ollama**, and **pgvector**.

## Prereqs

- Java 17
- Docker (for Postgres)
- [Ollama](https://ollama.com) running locally and the embedding model pulled:

```bash
ollama pull nomic-embed-text
ollama serve
```

## Start Postgres with pgvector

```bash
docker run --name docsearch-pg -e POSTGRES_USER=docsearch -e POSTGRES_PASSWORD=docsearch -e POSTGRES_DB=docsearch -p 5432:5432 -d ankane/pgvector:latest
```

## Configure

Edit `src/main/resources/application.yaml` if needed. Defaults assume local Postgres & Ollama.

## Run

```bash
./mvnw spring-boot:run
```

## How it works

- On document upload, text is chunked (800 chars, 120 overlap).
- Each chunk is embedded via Spring AI's `EmbeddingClient` (Ollama `nomic-embed-text`).
- Embeddings are stored in Postgres `document_chunks` (pgvector).
- Search embeds the query and retrieves top chunks using `<->` operator and returns ranked documents.

## API

- `POST /api/documents` – upload metadata + text body (see controller)
- `GET /api/search?q=your query` – semantic search
