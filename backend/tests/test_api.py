import io
import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import Base, get_db
from app.main import app

@pytest.fixture()
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "test.db"
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir()
    monkeypatch.setattr("app.config.settings.upload_dir", str(upload_dir))
    monkeypatch.setattr("app.services.settings.upload_dir", str(upload_dir))

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def register_and_login(client, email="user@example.com", password="secret123"):
    client.post("/auth/register", json={"email": email, "password": password})
    res = client.post("/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def make_csv(content: str) -> io.BytesIO:
    return io.BytesIO(content.encode("utf-8"))


class TestAuthentication:
    def test_register_and_login(self, client):
        res = client.post("/auth/register", json={"email": "a@test.com", "password": "pass1234"})
        assert res.status_code == 201
        assert res.json()["email"] == "a@test.com"

        res = client.post("/auth/login", json={"email": "a@test.com", "password": "pass1234"})
        assert res.status_code == 200
        assert "access_token" in res.json()

    def test_duplicate_register(self, client):
        client.post("/auth/register", json={"email": "dup@test.com", "password": "pass1234"})
        res = client.post("/auth/register", json={"email": "dup@test.com", "password": "pass1234"})
        assert res.status_code == 409

    def test_protected_route_requires_auth(self, client):
        res = client.get("/datasets")
        assert res.status_code == 401

    def test_me_with_valid_token(self, client):
        headers = register_and_login(client, "me@test.com")
        res = client.get("/auth/me", headers=headers)
        assert res.status_code == 200
        assert res.json()["email"] == "me@test.com"

    def test_logout(self, client):
        headers = register_and_login(client, "logout@test.com")
        res = client.post("/auth/logout", headers=headers)
        assert res.status_code == 204

    def test_invalid_token_rejected(self, client):
        res = client.get("/datasets", headers={"Authorization": "Bearer invalid-token"})
        assert res.status_code == 401

    def test_user_cannot_access_other_users_dataset(self, client):
        headers_a = register_and_login(client, "owner@test.com")
        upload = client.post(
            "/datasets",
            headers=headers_a,
            data={"name": "private"},
            files={"file": ("d.csv", make_csv("value\n1"), "text/csv")},
        )
        dataset_id = upload.json()["id"]
        headers_b = register_and_login(client, "other@test.com")
        res = client.get(f"/datasets/{dataset_id}", headers=headers_b)
        assert res.status_code == 404


class TestCsvValidation:
    def test_rejects_empty_file(self, client):
        headers = register_and_login(client, "csv1@test.com")
        res = client.post(
            "/datasets",
            headers=headers,
            data={"name": "empty"},
            files={"file": ("empty.csv", make_csv(""), "text/csv")},
        )
        assert res.status_code == 400

    def test_rejects_invalid_csv(self, client):
        headers = register_and_login(client, "csv2@test.com")
        res = client.post(
            "/datasets",
            headers=headers,
            data={"name": "bad"},
            files={"file": ("bad.csv", make_csv('"unclosed,quote\n1,2'), "text/csv")},
        )
        assert res.status_code == 400

    def test_rejects_non_csv_extension(self, client):
        headers = register_and_login(client, "csv3@test.com")
        res = client.post(
            "/datasets",
            headers=headers,
            data={"name": "txt"},
            files={"file": ("data.txt", make_csv("a,b\n1,2"), "text/plain")},
        )
        assert res.status_code == 400

    def test_rejects_duplicate_name(self, client):
        headers = register_and_login(client, "csv4@test.com")
        csv = make_csv("value\n1\n2\n")
        client.post("/datasets", headers=headers, data={"name": "sales"}, files={"file": ("s.csv", csv, "text/csv")})
        csv.seek(0)
        res = client.post("/datasets", headers=headers, data={"name": "sales"}, files={"file": ("s2.csv", csv, "text/csv")})
        assert res.status_code == 409

    def test_accepts_valid_csv(self, client):
        headers = register_and_login(client, "csv5@test.com")
        res = client.post(
            "/datasets",
            headers=headers,
            data={"name": "metrics"},
            files={"file": ("m.csv", make_csv("x,y\n1,2\n3,4"), "text/csv")},
        )
        assert res.status_code == 201
        assert res.json()["row_count"] == 2

    def test_preview_limits_to_25_rows(self, client):
        headers = register_and_login(client, "preview@test.com")
        rows = "\n".join(str(i) for i in range(30))
        upload = client.post(
            "/datasets",
            headers=headers,
            data={"name": "large"},
            files={"file": ("large.csv", make_csv(f"value\n{rows}"), "text/csv")},
        )
        dataset_id = upload.json()["id"]
        res = client.get(f"/datasets/{dataset_id}/preview", headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert len(body["rows"]) == 25
        assert body["total_rows"] == 30


class TestPagination:
    def test_pagination_and_search(self, client):
        headers = register_and_login(client, "page@test.com")
        for i in range(15):
            client.post(
                "/datasets",
                headers=headers,
                data={"name": f"dataset-{i:02d}"},
                files={"file": ("d.csv", make_csv(f"v\n{i}"), "text/csv")},
            )

        res = client.get("/datasets?page=1&page_size=10", headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert len(body["items"]) == 10
        assert body["total"] == 15
        assert body["total_pages"] == 2

        res = client.get("/datasets?search=dataset-01", headers=headers)
        assert res.status_code == 200
        assert any("dataset-01" in item["name"] for item in res.json()["items"])


class TestCompute:
    def test_compute_numeric_column(self, client):
        headers = register_and_login(client, "compute@test.com")
        upload = client.post(
            "/datasets",
            headers=headers,
            data={"name": "numbers"},
            files={"file": ("n.csv", make_csv("amount\n10\n20\n"), "text/csv")},
        )
        dataset_id = upload.json()["id"]
        res = client.post("/analytics/compute", headers=headers, json={"dataset_id": dataset_id, "column": "amount"})
        assert res.status_code == 200
        data = res.json()
        assert data["min"] == 10
        assert data["max"] == 20
        assert data["sum"] == 30

    def test_compute_invalid_column(self, client):
        headers = register_and_login(client, "compute2@test.com")
        upload = client.post(
            "/datasets",
            headers=headers,
            data={"name": "nums"},
            files={"file": ("n.csv", make_csv("amount\n1"), "text/csv")},
        )
        dataset_id = upload.json()["id"]
        res = client.post("/analytics/compute", headers=headers, json={"dataset_id": dataset_id, "column": "missing"})
        assert res.status_code == 400

    def test_compute_non_numeric_column(self, client):
        headers = register_and_login(client, "compute3@test.com")
        upload = client.post(
            "/datasets",
            headers=headers,
            data={"name": "mixed"},
            files={"file": ("m.csv", make_csv("label,value\na,1"), "text/csv")},
        )
        dataset_id = upload.json()["id"]
        res = client.post("/analytics/compute", headers=headers, json={"dataset_id": dataset_id, "column": "label"})
        assert res.status_code == 400

    def test_compute_ignores_null_values(self, client):
        headers = register_and_login(client, "compute4@test.com")
        upload = client.post(
            "/datasets",
            headers=headers,
            data={"name": "nulls"},
            files={"file": ("n.csv", make_csv("amount\n10\n\n20\n"), "text/csv")},
        )
        dataset_id = upload.json()["id"]
        res = client.post("/analytics/compute", headers=headers, json={"dataset_id": dataset_id, "column": "amount"})
        assert res.status_code == 200
        data = res.json()
        assert data["min"] == 10
        assert data["max"] == 20
        assert data["sum"] == 30
        assert data["count"] == 2
