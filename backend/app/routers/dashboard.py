from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dataset, User
from app.routers.auth import get_current_user
from app.schemas import DashboardStats, DatasetOut
from app.services import dataset_to_dict

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    datasets = (
        db.query(Dataset)
        .filter(Dataset.user_id == current_user.id)
        .order_by(Dataset.created_at.desc())
        .all()
    )
    total_rows = sum(d.row_count for d in datasets)
    latest = DatasetOut(**dataset_to_dict(datasets[0])) if datasets else None
    return DashboardStats(
        total_datasets=len(datasets),
        total_rows=total_rows,
        latest_upload=latest,
        available_charts=["bar", "line", "scatter"],
    )
