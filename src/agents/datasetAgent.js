/**
 * Dataset Agent
 * Handles queries about dataset schema, structure, and metadata.
 */

/**
 * @param {object} dataset
 * @param {string} query
 * @returns {{ text: string, sources: string } | null}
 */
export function runDatasetAgent(dataset, query) {
  const q = query.toLowerCase();

  if (/how many (rows|records)/i.test(query)) {
    return {
      text: `The dataset has ${dataset.rows.length.toLocaleString()} records.`,
      sources: 'Dataset metadata',
    };
  }

  if (/how many (columns|fields)/i.test(query)) {
    return {
      text: `The dataset has ${dataset.columns.length} columns: ${dataset.columns.map((c) => c.label).join(', ')}.`,
      sources: 'Dataset schema',
    };
  }

  if (/schema|columns|fields|structure/i.test(query)) {
    const fields = dataset.columns.map((c) => `${c.label} (${c.type})`).join(', ');
    return {
      text: `Dataset: ${dataset.metadata.datasetType}\nRows: ${dataset.rows.length}\nFields: ${fields}`,
      sources: 'Dataset schema',
    };
  }

  if (/uploaded|file name|filename/i.test(query)) {
    return {
      text: `Active dataset: ${dataset.fileName} (${dataset.fileType}), uploaded at ${dataset.uploadedAt ?? 'this session'}.`,
      sources: 'Dataset metadata',
    };
  }

  return null;
}
