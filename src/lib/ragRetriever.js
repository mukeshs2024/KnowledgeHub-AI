/**
 * PHASE 4: EMBEDDING & RAG LAYER
 * Handles document chunking, embeddings, semantic search, and retrieval
 */

export class DocumentChunker {
  constructor(chunkSize = 512, overlapSize = 64) {
    this.chunkSize = chunkSize;
    this.overlapSize = overlapSize;
  }

  /**
   * Chunk a document into smaller pieces
   */
  chunkDocument(document) {
    const text = document.content || document.text || '';
    const chunks = [];

    // Split by sentences first
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let currentChunk = '';
    let chunkNumber = 0;

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();

      if ((currentChunk + ' ' + trimmedSentence).length > this.chunkSize) {
        if (currentChunk) {
          chunks.push({
            id: `${document.id}_chunk_${chunkNumber}`,
            text: currentChunk.trim(),
            documentId: document.id,
            documentType: document.type,
            chunkNumber,
            metadata: {
              ...document.metadata,
              parentDocument: document.id,
              chunkSize: currentChunk.length,
            },
          });
          chunkNumber++;

          // Start next chunk with overlap
          currentChunk = trimmedSentence;
        }
      } else {
        currentChunk += ' ' + trimmedSentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        id: `${document.id}_chunk_${chunkNumber}`,
        text: currentChunk.trim(),
        documentId: document.id,
        documentType: document.type,
        chunkNumber,
        metadata: {
          ...document.metadata,
          parentDocument: document.id,
          chunkSize: currentChunk.length,
        },
      });
    }

    return chunks;
  }

  /**
   * Chunk multiple documents
   */
  chunkDocuments(documents) {
    const allChunks = [];

    for (const doc of documents) {
      const chunks = this.chunkDocument(doc);
      allChunks.push(...chunks);
    }

    return allChunks;
  }
}

export class SimpleEmbedder {
  /**
   * Generate simple embedding from text using TF-IDF-like approach
   * In production, use OpenAI, Cohere, or similar service
   */
  generateEmbedding(text) {
    // Normalize text
    const normalized = text.toLowerCase().trim();

    // Tokenize
    const tokens = normalized.match(/\b\w+\b/g) || [];

    // Calculate term frequencies
    const termFreq = {};
    for (const token of tokens) {
      termFreq[token] = (termFreq[token] || 0) + 1;
    }

    // Create a sparse embedding representation
    return {
      text,
      tokens,
      termFrequency: termFreq,
      tokenCount: tokens.length,
      uniqueTokens: Object.keys(termFreq).length,
      // For similarity: we'll use Jaccard + TF-based similarity
      signature: this.createSignature(tokens),
    };
  }

  /**
   * Create a simple signature for fast comparison
   */
  createSignature(tokens) {
    const uniqueTokens = [...new Set(tokens)];
    return uniqueTokens.slice(0, 50).sort().join('|');
  }

  /**
   * Calculate similarity between two embeddings
   */
  calculateSimilarity(embedding1, embedding2) {
    // Jaccard similarity
    const set1 = new Set(embedding1.tokens);
    const set2 = new Set(embedding2.tokens);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    const jaccardSimilarity = intersection.size / union.size;

    // TF-based overlap
    let tfSimilarity = 0;
    for (const token of intersection) {
      const tf1 = embedding1.termFrequency[token] || 0;
      const tf2 = embedding2.termFrequency[token] || 0;
      tfSimilarity += Math.min(tf1, tf2);
    }
    tfSimilarity = tfSimilarity / Math.max(embedding1.tokenCount, embedding2.tokenCount);

    // Combine
    return (jaccardSimilarity * 0.4 + tfSimilarity * 0.6) * 100;
  }
}

export class RAGRetriever {
  constructor(documents = []) {
    this.documents = documents;
    this.chunks = [];
    this.embeddings = [];
    this.chunker = new DocumentChunker();
    this.embedder = new SimpleEmbedder();
    this.index = new Map();
  }

  /**
   * Index documents for retrieval
   */
  indexDocuments(documents) {
    this.documents = documents;

    // Chunk documents
    this.chunks = this.chunker.chunkDocuments(documents);

    // Generate embeddings
    this.embeddings = this.chunks.map(chunk => ({
      chunkId: chunk.id,
      text: chunk.text,
      embedding: this.embedder.generateEmbedding(chunk.text),
      metadata: chunk.metadata,
      documentType: chunk.documentType,
      documentId: chunk.documentId,
    }));

    // Build index
    for (const emb of this.embeddings) {
      if (!this.index.has(emb.documentId)) {
        this.index.set(emb.documentId, []);
      }
      this.index.get(emb.documentId).push(emb);
    }

    return this;
  }

  /**
   * Retrieve relevant documents using semantic search
   */
  retrieve(query, topK = 5) {
    if (this.embeddings.length === 0) {
      return [];
    }

    // Generate query embedding
    const queryEmbedding = this.embedder.generateEmbedding(query);

    // Calculate similarity with all chunks
    const similarities = this.embeddings.map(emb => ({
      chunkId: emb.chunkId,
      text: emb.text,
      documentId: emb.documentId,
      documentType: emb.documentType,
      metadata: emb.metadata,
      similarity: this.embedder.calculateSimilarity(queryEmbedding, emb.embedding),
    }));

    // Sort by similarity and return top K
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .filter(item => item.similarity > 0); // Only return relevant results
  }

  /**
   * Retrieve by document type
   */
  retrieveByType(query, docType, topK = 5) {
    const typeDocuments = this.embeddings.filter(e => e.documentType === docType);

    if (typeDocuments.length === 0) {
      return [];
    }

    const queryEmbedding = this.embedder.generateEmbedding(query);

    const similarities = typeDocuments.map(emb => ({
      chunkId: emb.chunkId,
      text: emb.text,
      documentId: emb.documentId,
      documentType: emb.documentType,
      metadata: emb.metadata,
      similarity: this.embedder.calculateSimilarity(queryEmbedding, emb.embedding),
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .filter(item => item.similarity > 0);
  }

  /**
   * Retrieve related documents
   */
  retrieveRelated(documentId, topK = 5) {
    const sourceChunks = this.index.get(documentId) || [];

    if (sourceChunks.length === 0) {
      return [];
    }

    const sourceText = sourceChunks.map(c => c.text).join(' ');
    return this.retrieve(sourceText, topK);
  }

  /**
   * Build context from retrieved documents
   */
  buildContext(retrievedDocs, includeMetadata = true) {
    const context = {
      sourceCount: retrievedDocs.length,
      avgSimilarity: retrievedDocs.reduce((sum, doc) => sum + doc.similarity, 0) / retrievedDocs.length,
      documents: retrievedDocs.map(doc => ({
        id: doc.chunkId,
        documentId: doc.documentId,
        type: doc.documentType,
        text: doc.text,
        similarity: doc.similarity,
        metadata: includeMetadata ? doc.metadata : undefined,
      })),
      combinedText: retrievedDocs.map(doc => doc.text).join('\n\n'),
    };

    return context;
  }

  /**
   * Generate source citations
   */
  generateCitations(retrievedDocs) {
    const citations = [];
    const seen = new Set();

    for (const doc of retrievedDocs) {
      const key = doc.documentId;
      if (!seen.has(key)) {
        citations.push({
          documentId: doc.documentId,
          documentType: doc.documentType,
          entityId: doc.metadata?.entityId,
          entityType: doc.metadata?.entityType,
          relevance: doc.similarity,
        });
        seen.add(key);
      }
    }

    return citations.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Search with filters
   */
  search(query, options = {}) {
    let results = this.retrieve(query, options.topK || 5);

    // Filter by entity type
    if (options.entityType) {
      results = results.filter(r => r.metadata?.entityType === options.entityType);
    }

    // Filter by document type
    if (options.documentType) {
      results = results.filter(r => r.documentType === options.documentType);
    }

    // Filter by minimum similarity
    if (options.minSimilarity) {
      results = results.filter(r => r.similarity >= options.minSimilarity);
    }

    return {
      query,
      results,
      count: results.length,
      context: this.buildContext(results),
      citations: this.generateCitations(results),
    };
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalDocuments: this.documents.length,
      totalChunks: this.chunks.length,
      totalEmbeddings: this.embeddings.length,
      averageChunkSize: this.chunks.reduce((sum, c) => sum + c.text.length, 0) / this.chunks.length,
      documentTypes: [...new Set(this.embeddings.map(e => e.documentType))],
    };
  }
}

export default { DocumentChunker, SimpleEmbedder, RAGRetriever };
