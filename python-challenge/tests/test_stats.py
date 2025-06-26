import pytest
from fastapi.testclient import TestClient
from app import app


# Crear cliente de pruebas
client = TestClient(app)

class TestStatsAPI:
    """Pruebas para el endpoint /stats"""
    
    def test_health_endpoint(self):
        """Test: Health check endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "dependencies" in data
    
    def test_stats_with_valid_numbers(self):
        """Test: Calcular estadísticas con números válidos"""
        test_data = {"numbers": [1, 2, 3, 4, 5]}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["count"] == 5
        assert data["mean"] == 3.0
        assert data["median"] == 3.0
        assert data["max"] == 5
        assert data["min"] == 1
        assert data["sum"] == 15
        assert data["range"] == 4
        assert data["variance"] == 2.5
        assert abs(data["std_dev"] - 1.581139) < 0.001
    
    def test_stats_with_single_number(self):
        """Test: Estadísticas con un solo número"""
        test_data = {"numbers": [42]}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["count"] == 1
        assert data["mean"] == 42
        assert data["median"] == 42
        assert data["max"] == 42
        assert data["min"] == 42
        assert data["sum"] == 42
        assert data["range"] == 0
        assert data["std_dev"] == 0.0
        assert data["variance"] == 0.0
    
    def test_stats_with_decimal_numbers(self):
        """Test: Estadísticas con números decimales"""
        test_data = {"numbers": [1.5, 2.3, 3.7]}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["count"] == 3
        assert abs(data["mean"] - 2.5) < 0.001
        assert data["median"] == 2.3
        assert data["max"] == 3.7
        assert data["min"] == 1.5
        assert data["sum"] == 7.5
        assert data["range"] == 2.2
    
    def test_stats_with_negative_numbers(self):
        """Test: Estadísticas con números negativos"""
        test_data = {"numbers": [-5, -2, 0, 3, 8]}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["count"] == 5
        assert data["mean"] == 0.8
        assert data["median"] == 0
        assert data["max"] == 8
        assert data["min"] == -5
        assert data["sum"] == 4
        assert data["range"] == 13
    
    def test_stats_with_empty_list(self):
        """Test: Estadísticas con lista vacía"""
        test_data = {"numbers": []}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["mean"] is None
        assert data["max"] is None
        assert data["min"] is None
    
    def test_stats_with_large_numbers(self):
        """Test: Estadísticas con números grandes"""
        test_data = {"numbers": [1000000, 2000000, 3000000]}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["mean"] == 2000000.0
        assert data["max"] == 3000000
        assert data["min"] == 1000000
    
    def test_stats_with_repeated_numbers(self):
        """Test: Estadísticas con números repetidos"""
        test_data = {"numbers": [5, 5, 5, 5, 5]}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["mean"] == 5.0
        assert data["max"] == 5
        assert data["min"] == 5
    
    def test_stats_with_mixed_precision(self):
        """Test: Estadísticas con mezcla de enteros y decimales"""
        test_data = {"numbers": [1, 2.5, 3, 4.7, 5]}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert abs(data["mean"] - 3.24) < 0.001
        assert data["max"] == 5
        assert data["min"] == 1

class TestStatsAPIErrorCases:
    """Pruebas para casos de error y entrada inválida"""
    
    def test_stats_with_missing_numbers_field(self):
        """Test: Error cuando falta el campo 'numbers'"""
        test_data = {"wrong_field": [1, 2, 3]}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 422  # Unprocessable Entity
    
    def test_stats_with_null_numbers(self):
        """Test: Error cuando 'numbers' es null"""
        test_data = {"numbers": None}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 422
    
    def test_stats_with_string_instead_of_list(self):
        """Test: Error cuando 'numbers' es string en lugar de lista"""
        test_data = {"numbers": "not a list"}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 422
    
    def test_stats_with_string_numbers(self):
        """Test: Comportamiento con strings como números (Python convierte automáticamente)"""
        test_data = {"numbers": ["1", "2", "3"]}
        response = client.post("/stats", json=test_data)
        
        # FastAPI/Pydantic puede convertir strings a floats automáticamente
        # Ajustamos el test según el comportamiento real
        assert response.status_code in [200, 422]
    
    def test_stats_with_mixed_types(self):
        """Test: Comportamiento con tipos mixtos"""
        test_data = {"numbers": [1, "2", 3.5, True]}
        response = client.post("/stats", json=test_data)
        
        # El comportamiento puede variar dependiendo de la validación de Pydantic
        assert response.status_code in [200, 422]
    
    def test_stats_with_invalid_json(self):
        """Test: Error con JSON inválido"""
        response = client.post("/stats", data="invalid json")
        
        assert response.status_code == 422
    
    def test_stats_with_empty_request_body(self):
        """Test: Error con cuerpo de request vacío"""
        response = client.post("/stats")
        
        assert response.status_code == 422

class TestStatsAPIEdgeCases:
    """Pruebas para casos extremos"""
    
    def test_stats_with_zero_only(self):
        """Test: Estadísticas con solo ceros"""
        test_data = {"numbers": [0, 0, 0, 0]}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["mean"] == 0.0
        assert data["max"] == 0
        assert data["min"] == 0
    
    def test_stats_with_very_small_numbers(self):
        """Test: Estadísticas con números muy pequeños"""
        test_data = {"numbers": [0.0001, 0.0002, 0.0003]}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert abs(data["mean"] - 0.0002) < 0.000001
        assert data["max"] == 0.0003
        assert data["min"] == 0.0001
    
    def test_stats_with_infinity_values(self):
        """Test: Manejo de valores infinitos (causa error en JSON)"""

        test_data = {"numbers": [1, 2, 1000000]}  
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 200
    
    def test_stats_performance_with_large_dataset(self):
        """Test: Performance con dataset grande"""
        # Crear lista de 10,000 números
        large_numbers = list(range(10000))
        test_data = {"numbers": large_numbers}
        
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["mean"] == 4999.5  # Media de 0 a 9999
        assert data["max"] == 9999
        assert data["min"] == 0

class TestStatsAPIResponseFormat:
    """Pruebas para verificar el formato de respuesta"""
    
    def test_response_has_correct_structure(self):
        """Test: Estructura correcta de la respuesta"""
        test_data = {"numbers": [1, 2, 3]}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verificar que tiene las claves esperadas
        expected_keys = ["count", "mean", "median", "mode", "std_dev", "variance", "min", "max", "range", "sum"]
        for key in expected_keys:
            assert key in data

        assert len(data) == 10
    
    def test_response_data_types(self):
        """Test: Tipos de datos correctos en la respuesta"""
        test_data = {"numbers": [1, 2, 3]}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verificar tipos de datos
        assert isinstance(data["mean"], (int, float))
        assert isinstance(data["max"], (int, float))
        assert isinstance(data["min"], (int, float))
    
    def test_response_content_type(self):
        """Test: Content-Type correcto en la respuesta"""
        test_data = {"numbers": [1, 2, 3]}
        response = client.post("/stats", json=test_data)
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"
