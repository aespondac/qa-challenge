import pytest
from fastapi.testclient import TestClient
from app import app

@pytest.fixture
def client():
    """Fixture que proporciona un cliente de pruebas para la aplicación FastAPI"""
    return TestClient(app)

@pytest.fixture
def sample_numbers():
    """Fixture con números de ejemplo para pruebas"""
    return [1, 2, 3, 4, 5]

@pytest.fixture
def decimal_numbers():
    """Fixture con números decimales para pruebas"""
    return [1.1, 2.2, 3.3, 4.4, 5.5]

@pytest.fixture
def negative_numbers():
    """Fixture con números negativos para pruebas"""
    return [-10, -5, 0, 5, 10]

@pytest.fixture
def large_numbers():
    """Fixture con números grandes para pruebas"""
    return [1000000, 2000000, 3000000, 4000000, 5000000]

@pytest.fixture
def empty_list():
    """Fixture con lista vacía"""
    return []

@pytest.fixture
def single_number():
    """Fixture con un solo número"""
    return [42]

@pytest.fixture
def repeated_numbers():
    """Fixture con números repetidos"""
    return [7, 7, 7, 7, 7]

@pytest.fixture
def mixed_numbers():
    """Fixture con mezcla de enteros y decimales"""
    return [1, 2.5, 3, 4.7, 5]

@pytest.fixture
def invalid_data_cases():
    """Fixture con casos de datos inválidos para pruebas de error"""
    return [
        {"numbers": "not a list"},
        {"numbers": ["1", "2", "3"]},
        {"numbers": [1, "2", 3.5, True]},
        {"numbers": None},
        {"wrong_field": [1, 2, 3]},
        {}
    ]

@pytest.fixture
def edge_case_numbers():
    """Fixture con casos extremos"""
    return {
        "zeros": [0, 0, 0, 0],
        "very_small": [0.0001, 0.0002, 0.0003],
        "very_large": [1e10, 2e10, 3e10],
        "negative_and_positive": [-100, -50, 0, 50, 100]
    }
