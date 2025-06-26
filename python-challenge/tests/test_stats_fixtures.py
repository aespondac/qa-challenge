import pytest
from fastapi.testclient import TestClient

class TestStatsWithFixtures:
    """Pruebas usando fixtures para casos comunes"""
    
    def test_stats_with_sample_numbers(self, client, sample_numbers):
        """Test usando fixture de números de ejemplo"""
        response = client.post("/stats", json={"numbers": sample_numbers})
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["mean"] == 3.0
        assert data["max"] == 5
        assert data["min"] == 1
    
    def test_stats_with_decimal_numbers(self, client, decimal_numbers):
        """Test usando fixture de números decimales"""
        response = client.post("/stats", json={"numbers": decimal_numbers})
        
        assert response.status_code == 200
        data = response.json()
        
        assert abs(data["mean"] - 3.3) < 0.001
        assert data["max"] == 5.5
        assert data["min"] == 1.1
    
    def test_stats_with_negative_numbers(self, client, negative_numbers):
        """Test usando fixture de números negativos"""
        response = client.post("/stats", json={"numbers": negative_numbers})
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["mean"] == 0.0
        assert data["max"] == 10
        assert data["min"] == -10
    
    def test_stats_with_large_numbers(self, client, large_numbers):
        """Test usando fixture de números grandes"""
        response = client.post("/stats", json={"numbers": large_numbers})
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["mean"] == 3000000.0
        assert data["max"] == 5000000
        assert data["min"] == 1000000
    
    def test_stats_with_empty_list(self, client, empty_list):
        """Test usando fixture de lista vacía"""
        response = client.post("/stats", json={"numbers": empty_list})
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["mean"] is None
        assert data["max"] is None
        assert data["min"] is None
    
    def test_stats_with_single_number(self, client, single_number):
        """Test usando fixture de número único"""
        response = client.post("/stats", json={"numbers": single_number})
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["mean"] == 42
        assert data["max"] == 42
        assert data["min"] == 42
    
    def test_stats_with_repeated_numbers(self, client, repeated_numbers):
        """Test usando fixture de números repetidos"""
        response = client.post("/stats", json={"numbers": repeated_numbers})
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["mean"] == 7.0
        assert data["max"] == 7
        assert data["min"] == 7
    
    def test_stats_with_mixed_numbers(self, client, mixed_numbers):
        """Test usando fixture de números mixtos"""
        response = client.post("/stats", json={"numbers": mixed_numbers})
        
        assert response.status_code == 200
        data = response.json()
        
        assert abs(data["mean"] - 3.24) < 0.001
        assert data["max"] == 5
        assert data["min"] == 1

class TestStatsErrorsWithFixtures:
    """Pruebas de errores usando fixtures"""
    
    @pytest.mark.parametrize("invalid_data", [
        {"numbers": "not a list"},
        {"numbers": None},
        {"wrong_field": [1, 2, 3]},
        {}
    ])
    def test_stats_with_invalid_data(self, client, invalid_data):
        """Test parametrizado para datos inválidos"""
        response = client.post("/stats", json=invalid_data)
        assert response.status_code == 422

class TestStatsEdgeCasesWithFixtures:
    """Pruebas de casos extremos usando fixtures"""
    
    def test_stats_with_edge_cases(self, client, edge_case_numbers):
        """Test para casos extremos usando fixture"""
        
        # Test con zeros
        response = client.post("/stats", json={"numbers": edge_case_numbers["zeros"]})
        assert response.status_code == 200
        data = response.json()
        assert data["mean"] == 0.0
        assert data["max"] == 0
        assert data["min"] == 0
        
        # Test con números muy pequeños
        response = client.post("/stats", json={"numbers": edge_case_numbers["very_small"]})
        assert response.status_code == 200
        data = response.json()
        assert abs(data["mean"] - 0.0002) < 0.000001
        
        # Test con números muy grandes
        response = client.post("/stats", json={"numbers": edge_case_numbers["very_large"]})
        assert response.status_code == 200
        data = response.json()
        assert abs(data["mean"] - 2e10) < 1e9
        
        # Test con negativos y positivos
        response = client.post("/stats", json={"numbers": edge_case_numbers["negative_and_positive"]})
        assert response.status_code == 200
        data = response.json()
        assert data["mean"] == 0.0
        assert data["max"] == 100
        assert data["min"] == -100
