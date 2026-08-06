from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.routers.auth import get_current_user
from app.schemas import ComputeRequest, ComputeResponse
from app.services import compute_column_stats, get_user_dataset, load_dataset_df

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/compute", response_model=ComputeResponse)
def compute_stats(
    payload: ComputeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = get_user_dataset(db, current_user.id, payload.dataset_id)
    df = load_dataset_df(dataset)
    result = compute_column_stats(df, payload.column)
    return ComputeResponse(**result)
