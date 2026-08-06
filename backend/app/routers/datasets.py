import math

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dataset, User
from app.routers.auth import get_current_user
from app.schemas import ChartDataRequest, ChartDataResponse, ColumnInfo, DatasetListResponse, DatasetOut, PreviewResponse
from app.services import (
    create_dataset_record,
    dataset_to_dict,
    delete_dataset_record,
    get_chart_data,
    get_column_info,
    get_user_dataset,
    load_dataset_df,
    read_csv_dataframe,
    validate_csv_file,
)

router = APIRouter(prefix="/datasets", tags=["datasets"])


def _to_out(dataset: Dataset) -> DatasetOut:
    return DatasetOut(**dataset_to_dict(dataset))


@router.get("", response_model=DatasetListResponse)
def list_datasets(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    search: str = Query(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Dataset).filter(Dataset.user_id == current_user.id)
    if search.strip():
        query = query.filter(Dataset.name.ilike(f"%{search.strip()}%"))
    total = query.count()
    items = (
        query.order_by(Dataset.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return DatasetListResponse(
        items=[_to_out(d) for d in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, math.ceil(total / page_size)) if total else 1,
    )


@router.post("", response_model=DatasetOut, status_code=201)
async def upload_dataset(
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not name.strip():
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Dataset name is required.")
    validate_csv_file(file)
    df = await read_csv_dataframe(file)
    dataset = create_dataset_record(db, current_user, name.strip(), df)
    return _to_out(dataset)


@router.get("/{dataset_id}", response_model=DatasetOut)
def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = get_user_dataset(db, current_user.id, dataset_id)
    return _to_out(dataset)


@router.get("/{dataset_id}/preview", response_model=PreviewResponse)
def preview_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = get_user_dataset(db, current_user.id, dataset_id)
    df = load_dataset_df(dataset)
    preview = df.head(25)
    rows = preview.where(preview.notna(), None).to_dict(orient="records")
    return PreviewResponse(
        columns=[str(c) for c in df.columns.tolist()],
        rows=rows,
        total_rows=len(df),
    )


@router.get("/{dataset_id}/columns", response_model=list[ColumnInfo])
def list_columns(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = get_user_dataset(db, current_user.id, dataset_id)
    df = load_dataset_df(dataset)
    return get_column_info(df)


@router.post("/{dataset_id}/chart-data", response_model=ChartDataResponse)
def chart_data(
    dataset_id: int,
    payload: ChartDataRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = get_user_dataset(db, current_user.id, dataset_id)
    df = load_dataset_df(dataset)
    result = get_chart_data(df, payload.x_column, payload.y_column)
    return ChartDataResponse(**result)


@router.delete("/{dataset_id}", status_code=204)
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = get_user_dataset(db, current_user.id, dataset_id)
    delete_dataset_record(db, dataset)
