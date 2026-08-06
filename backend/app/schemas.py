from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DatasetOut(BaseModel):
    id: int
    name: str
    row_count: int
    column_count: int
    columns: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class DatasetListResponse(BaseModel):
    items: list[DatasetOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class PreviewResponse(BaseModel):
    columns: list[str]
    rows: list[dict[str, Any]]
    total_rows: int


class ColumnInfo(BaseModel):
    name: str
    dtype: str
    is_numeric: bool


class ComputeRequest(BaseModel):
    dataset_id: int
    column: str


class ComputeResponse(BaseModel):
    column: str
    min: float | None
    max: float | None
    sum: float | None
    count: int


class ChartDataRequest(BaseModel):
    x_column: str
    y_column: str


class ChartDataResponse(BaseModel):
    x: list[Any]
    y: list[float | None]


class DashboardStats(BaseModel):
    total_datasets: int
    total_rows: int
    latest_upload: DatasetOut | None
    available_charts: list[str]
