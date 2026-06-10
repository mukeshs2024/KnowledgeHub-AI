"""
Universal AI Knowledge Assistant

Install requirements:
    pip install pandas openpyxl chromadb sentence-transformers google-genai

Run:
    python "untitled22 (1).py" path/to/dataset.csv

Supported uploads:
    - CSV
    - Excel .xlsx
    - JSON array or object containing an array
"""

from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import chromadb
import pandas as pd
from sentence_transformers import SentenceTransformer


EMPTY_VALUES = {"", "null", "undefined", "nan", "n/a", "na"}


@dataclass
class DatasetProfile:
    file_name: str
    file_type: str
    dataset_type: str
    entities: list[str]
    possible_questions: list[str]
    summary: str
    schema: list[dict[str, Any]]
    metadata: dict[str, Any]


def detect_file_format(file_path: str | Path) -> str:
    suffix = Path(file_path).suffix.lower()
    if suffix == ".csv":
        return "CSV"
    if suffix == ".xlsx":
        return "Excel"
    if suffix == ".json":
        return "JSON"
    raise ValueError("Unsupported file type. Upload a CSV, XLSX, or JSON file.")


def read_dataset(file_path: str | Path) -> pd.DataFrame:
    file_type = detect_file_format(file_path)

    if file_type == "CSV":
        df = pd.read_csv(file_path)
    elif file_type == "Excel":
        df = pd.read_excel(file_path)
    else:
        with open(file_path, "r", encoding="utf-8") as handle:
            payload = json.load(handle)
        records = find_json_records(payload)
        df = pd.json_normalize(records)

    df = df.dropna(how="all")
    df.columns = [str(column).strip() or f"column_{index + 1}" for index, column in enumerate(df.columns)]
    return df


def find_json_records(payload: Any) -> list[Any]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for value in payload.values():
            if isinstance(value, list):
                return value
        return [payload]
    return [{"value": payload}]


def is_empty(value: Any) -> bool:
    if pd.isna(value):
        return True
    return str(value).strip().lower() in EMPTY_VALUES


def prettify_name(name: str) -> str:
    text = re.sub(r"[_-]+", " ", str(name))
    text = re.sub(r"([a-z])([A-Z])", r"\1 \2", text)
    return re.sub(r"\s+", " ", text).strip()


def infer_dataset_type(file_name: str, columns: list[str]) -> str:
    source = f"{file_name} {' '.join(columns)}".lower()
    signals = {
        "Employee Dataset": ["employee", "salary", "department", "designation"],
        "Student Dataset": ["student", "course", "marks", "grade"],
        "Sales Dataset": ["sales", "revenue", "product", "customer", "order"],
        "Inventory Dataset": ["inventory", "stock", "sku", "warehouse", "quantity"],
        "Customer Dataset": ["customer", "city", "segment", "account"],
        "Project Dataset": ["project", "team", "status", "member"],
    }
    scores = {
        label: sum(1 for word in words if word in source)
        for label, words in signals.items()
    }
    best_label, best_score = max(scores.items(), key=lambda item: item[1])
    if best_score:
        return best_label
    return f"{prettify_name(Path(file_name).stem) or 'Universal'} Dataset"


def infer_schema(df: pd.DataFrame) -> list[dict[str, Any]]:
    schema = []
    for column in df.columns:
        series = df[column]
        present = series[~series.map(is_empty)]
        dtype = "text"
        numeric = pd.to_numeric(present.astype(str).str.replace(r"[$,%]", "", regex=True).str.replace(",", ""), errors="coerce")
        dates = pd.to_datetime(present, errors="coerce")

        if len(present) and numeric.notna().mean() >= 0.85:
            dtype = "number"
        elif len(present) and dates.notna().mean() >= 0.75:
            dtype = "date"
        elif len(present) and present.astype(str).str.lower().isin(["true", "false", "yes", "no"]).mean() >= 0.85:
            dtype = "boolean"

        values = present.astype(str)
        frequencies = values.value_counts().head(10).to_dict()
        schema.append(
            {
                "name": column,
                "label": prettify_name(column),
                "type": dtype,
                "missing_values": int(len(df) - len(present)),
                "unique_values": int(values.nunique()),
                "sample_values": values.drop_duplicates().head(4).tolist(),
                "frequencies": frequencies,
            }
        )
    return schema


def infer_entities(schema: list[dict[str, Any]]) -> list[str]:
    candidates = []
    for field in schema:
        name = field["name"]
        if re.search(r"(^id$|id$|_id$|name$|type$|category$|department$|course$|city$|status$)", name, re.I):
            entity = prettify_name(re.sub(r"id$", "", name, flags=re.I)).strip()
            if entity:
                candidates.append(entity if entity.endswith("s") else f"{entity}s")
    return list(dict.fromkeys(candidates))[:5] or ["Records"]


def build_possible_questions(schema: list[dict[str, Any]], dataset_type: str) -> list[str]:
    numeric = [field for field in schema if field["type"] == "number"]
    categorical = [field for field in schema if field["type"] == "text" and field["unique_values"] <= 20]
    questions = []
    if categorical:
        questions.append(f"Show records where {categorical[0]['label']} is {categorical[0]['sample_values'][0] if categorical[0]['sample_values'] else 'a value'}.")
    if numeric:
        questions.append(f"What is the average {numeric[0]['label']}?")
        questions.append(f"Show the highest {numeric[0]['label']} record.")
    questions.append(f"How many records are in this {dataset_type.lower()}?")
    return questions


def schema_detection_agent(df: pd.DataFrame) -> list[dict[str, Any]]:
    return infer_schema(df)


def document_generation_agent(df: pd.DataFrame) -> list[str]:
    documents = []
    for _, row in df.iterrows():
        parts = []
        for column, value in row.items():
            if not is_empty(value):
                parts.append(f"{prettify_name(column)} is {value}.")
        documents.append("\n".join(parts))
    return documents


def dataset_analysis_agent(file_path: str | Path) -> tuple[pd.DataFrame, DatasetProfile]:
    file_path = Path(file_path)
    file_type = detect_file_format(file_path)
    df = read_dataset(file_path)
    schema = schema_detection_agent(df)
    dataset_type = infer_dataset_type(file_path.name, list(df.columns))
    entities = infer_entities(schema)
    summary = "\n".join(
        [
            "Dataset Summary",
            f"File Name: {file_path.name}",
            f"File Type: {file_type}",
            f"Rows: {len(df)}",
            f"Columns: {len(df.columns)}",
            "Detected Fields:",
            *[f"- {field['label']} ({field['type']})" for field in schema],
        ]
    )
    profile = DatasetProfile(
        file_name=file_path.name,
        file_type=file_type,
        dataset_type=dataset_type,
        entities=entities,
        possible_questions=build_possible_questions(schema, dataset_type),
        summary=summary,
        schema=schema,
        metadata={
            "rows": len(df),
            "columns": len(df.columns),
            "agents": [
                "Coordinator Agent",
                "Dataset Analysis Agent",
                "Schema Detection Agent",
                "Document Generation Agent",
                "Retrieval Agent",
                "Gemini Response Agent",
            ],
        },
    )
    return df, profile


def create_chromadb_collection(documents: list[str], profile: DatasetProfile):
    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(documents).tolist()
    client = chromadb.Client()
    collection_name = re.sub(r"[^a-zA-Z0-9_-]", "_", Path(profile.file_name).stem.lower())[:60] or "knowledge_dataset"
    collection = client.get_or_create_collection(name=collection_name)
    ids = [f"doc_{index + 1}" for index in range(len(documents))]
    metadatas = [
        {
            "file_name": profile.file_name,
            "file_type": profile.file_type,
            "dataset_type": profile.dataset_type,
            "row_index": str(index),
        }
        for index in range(len(documents))
    ]
    collection.add(documents=documents, embeddings=embeddings, metadatas=metadatas, ids=ids)
    return collection, model


def retrieval_agent(question: str, collection, model, k: int = 5) -> str:
    query_embedding = model.encode([question]).tolist()[0]
    results = collection.query(query_embeddings=[query_embedding], n_results=k, include=["documents", "metadatas"])
    documents = results.get("documents", [[]])[0]
    return "\n\n".join(document for document in documents if document)


def gemini_response_agent(question: str, context: str, profile: DatasetProfile) -> str:
    if not context:
        return "No relevant information was found in the uploaded dataset."

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return f"Retrieved context:\n\n{context}"

    from google import genai

    client = genai.Client(api_key=api_key)
    prompt = f"""
You are a Universal AI Knowledge Assistant.

Answer only from the provided dataset context.

Dataset Type:
{profile.dataset_type}

Detected Entities:
{", ".join(profile.entities)}

Context:
{context}

Question:
{question}

Give a clear, concise answer. If the answer is not present, say so.
"""
    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    return response.text


def coordinator_agent(file_path: str | Path):
    df, profile = dataset_analysis_agent(file_path)
    documents = document_generation_agent(df)
    collection, model = create_chromadb_collection(documents, profile)
    return profile, collection, model


def main() -> None:
    parser = argparse.ArgumentParser(description="Universal AI Knowledge Assistant")
    parser.add_argument("file", help="Path to a CSV, XLSX, or JSON dataset")
    args = parser.parse_args()

    profile, collection, model = coordinator_agent(args.file)
    print(profile.summary)
    print("\nPossible Entities:", ", ".join(profile.entities))
    print("Possible Questions:")
    for question in profile.possible_questions:
        print(f"- {question}")

    while True:
        question = input("\nAsk a question, or type exit: ").strip()
        if question.lower() == "exit":
            break
        context = retrieval_agent(question, collection, model)
        answer = gemini_response_agent(question, context, profile)
        print("\nAnswer:")
        print(answer)


if __name__ == "__main__":
    main()
