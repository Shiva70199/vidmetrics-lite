import json
import os
from io import BytesIO

import pandas as pd
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Dataset, User


def ensure_upload_dir() -> None:
    os.makedirs(settings.upload_dir, exist_ok=True)


def validate_csv_file(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    if file.content_type and file.content_type not in ("text/csv", "application/vnd.ms-excel", "application/csv", "text/plain", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Invalid file type. Upload a CSV file.")


async def read_csv_dataframe(file: UploadFile) -> pd.DataFrame:
    content = await file.read()
    if not content or not content.strip():
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    try:
        df = pd.read_csv(BytesIO(content))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid CSV format.")

    if df.empty or len(df.columns) == 0:
        raise HTTPException(status_code=400, detail="CSV file contains no data.")

    return df


def check_duplicate_name(db: Session, user_id: int, name: str, exclude_id: int | None = None) -> None:
    query = db.query(Dataset).filter(Dataset.user_id == user_id, Dataset.name == name)
    if exclude_id:
        query = query.filter(Dataset.id != exclude_id)
    if query.first():
        raise HTTPException(status_code=409, detail="A dataset with this name already exists.")


def save_dataset_file(user_id: int, dataset_id: int, df: pd.DataFrame) -> str:
    ensure_upload_dir()
    user_dir = os.path.join(settings.upload_dir, str(user_id))
    os.makedirs(user_dir, exist_ok=True)
    file_path = os.path.join(user_dir, f"{dataset_id}.csv")
    df.to_csv(file_path, index=False)
    return file_path


def load_dataset_df(dataset: Dataset) -> pd.DataFrame:
    if not os.path.exists(dataset.file_path):
        raise HTTPException(status_code=404, detail="Dataset file not found.")
    try:
        df = pd.read_csv(dataset.file_path)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read dataset file.")
    return df


def get_user_dataset(db: Session, user_id: int, dataset_id: int) -> Dataset:
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    return dataset


def dataset_to_dict(dataset: Dataset) -> dict:
    return {
        "id": dataset.id,
        "name": dataset.name,
        "row_count": dataset.row_count,
        "column_count": dataset.column_count,
        "columns": json.loads(dataset.columns_json),
        "created_at": dataset.created_at,
    }


def create_dataset_record(db: Session, user: User, name: str, df: pd.DataFrame) -> Dataset:
    check_duplicate_name(db, user.id, name)
    dataset = Dataset(
        user_id=user.id,
        name=name.strip(),
        file_path="",
        row_count=len(df),
        column_count=len(df.columns),
        columns_json=json.dumps([str(c) for c in df.columns.tolist()]),
    )
    db.add(dataset)
    db.flush()
    dataset.file_path = save_dataset_file(user.id, dataset.id, df)
    db.commit()
    db.refresh(dataset)
    return dataset


def delete_dataset_file(dataset: Dataset) -> None:
    if dataset.file_path and os.path.exists(dataset.file_path):
        os.remove(dataset.file_path)


def delete_dataset_record(db: Session, dataset: Dataset) -> None:
    delete_dataset_file(dataset)
    db.delete(dataset)
    db.commit()


def get_numeric_columns(df: pd.DataFrame) -> list[str]:
    return [str(col) for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]


def compute_column_stats(df: pd.DataFrame, column: str) -> dict:
    if df.empty:
        raise HTTPException(status_code=400, detail="Dataset is empty.")
    if column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{column}' not found.")
    if not pd.api.types.is_numeric_dtype(df[column]):
        raise HTTPException(status_code=400, detail=f"Column '{column}' is not numeric.")

    series = pd.to_numeric(df[column], errors="coerce")
    valid = series.dropna()
    if valid.empty:
        return {"column": column, "min": None, "max": None, "sum": None, "count": 0}

    return {
        "column": column,
        "min": float(valid.min()),
        "max": float(valid.max()),
        "sum": float(valid.sum()),
        "count": int(valid.count()),
    }


def get_column_info(df: pd.DataFrame) -> list[dict]:
    info = []
    for col in df.columns:
        name = str(col)
        is_numeric = pd.api.types.is_numeric_dtype(df[col])
        dtype = str(df[col].dtype)
        info.append({"name": name, "dtype": dtype, "is_numeric": is_numeric})
    return info


def get_chart_data(df: pd.DataFrame, x_column: str, y_column: str) -> dict:
    if x_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{x_column}' not found.")
    if y_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{y_column}' not found.")
    if not pd.api.types.is_numeric_dtype(df[y_column]):
        raise HTTPException(status_code=400, detail=f"Column '{y_column}' must be numeric.")

    x_vals = df[x_column].tolist()
    y_series = pd.to_numeric(df[y_column], errors="coerce")
    y_vals = [float(v) if pd.notna(v) else None for v in y_series.tolist()]
    return {"x": x_vals, "y": y_vals}
