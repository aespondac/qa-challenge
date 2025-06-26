# app.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
import statistics
from math import sqrt

app = FastAPI(
    title="Statistics API",
    description="API para calcular estadísticas de listas de números",
    version="1.0.0"
)

class DataIn(BaseModel):
    numbers: List[float] = Field(..., description="Lista de números para calcular estadísticas")
    
    @field_validator('numbers')
    @classmethod
    def validate_numbers(cls, v):
        if not isinstance(v, list):
            raise ValueError("numbers debe ser una lista")
        
        # Permitir lista vacía pero validar tipos
        for num in v:
            if not isinstance(num, (int, float)):
                raise ValueError("Todos los elementos deben ser números")
        
        return v

class StatsOut(BaseModel):
    count: int = Field(..., description="Cantidad de números")
    mean: Optional[float] = Field(..., description="Media aritmética")
    median: Optional[float] = Field(..., description="Mediana")
    mode: Optional[List[float]] = Field(..., description="Moda(s)")
    std_dev: Optional[float] = Field(..., description="Desviación estándar")
    variance: Optional[float] = Field(..., description="Varianza")
    min: Optional[float] = Field(..., description="Valor mínimo")
    max: Optional[float] = Field(..., description="Valor máximo")
    range: Optional[float] = Field(..., description="Rango (max - min)")
    sum: Optional[float] = Field(..., description="Suma total")

@app.get("/")
def read_root():
    """Endpoint de health check"""
    return {"message": "Statistics API is running", "status": "healthy"}

@app.get("/health")
def health_check():
    """Endpoint de health check detallado"""
    return {
        "status": "healthy",
        "service": "Statistics API",
        "version": "1.0.0",
        "dependencies": {
            "fastapi": "✅",
            "pydantic": "✅",
            "statistics": "✅"
        }
    }

@app.post("/stats", response_model=StatsOut)
def calculate_stats(data: DataIn) -> StatsOut:
    """
    Calcula estadísticas completas para una lista de números.
    
    - **numbers**: Lista de números (int o float)
    - Retorna estadísticas descriptivas completas
    """
    nums = data.numbers
    
    if not nums:
        # Lista vacía - retornar valores None apropiados
        return StatsOut(
            count=0,
            mean=None,
            median=None,
            mode=None,
            std_dev=None,
            variance=None,
            min=None,
            max=None,
            range=None,
            sum=None
        )
    
    try:
        # Cálculos básicos
        count = len(nums)
        mean_val = statistics.mean(nums)
        median_val = statistics.median(nums)
        min_val = min(nums)
        max_val = max(nums)
        sum_val = sum(nums)
        range_val = max_val - min_val
        
        # Moda (puede tener múltiples valores)
        try:
            mode_val = [statistics.mode(nums)]
        except statistics.StatisticsError:
            # No hay moda única, calcular todas las modas
            from collections import Counter
            counter = Counter(nums)
            max_count = max(counter.values())
            if max_count == 1:
                mode_val = None  # No hay moda si todos aparecen una vez
            else:
                mode_val = [k for k, v in counter.items() if v == max_count]
        
        # Desviación estándar y varianza
        if count > 1:
            variance_val = statistics.variance(nums)
            std_dev_val = statistics.stdev(nums)
        else:
            variance_val = 0.0
            std_dev_val = 0.0
        
        return StatsOut(
            count=count,
            mean=round(mean_val, 6),
            median=median_val,
            mode=mode_val,
            std_dev=round(std_dev_val, 6),
            variance=round(variance_val, 6),
            min=min_val,
            max=max_val,
            range=range_val,
            sum=sum_val
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=422, 
            detail=f"Error calculando estadísticas: {str(e)}"
        )

@app.post("/stats/basic")
def calculate_basic_stats(data: DataIn) -> Dict[str, Any]:
    """
    Calcula estadísticas básicas.
    
    - **numbers**: Lista de números
    - Retorna: mean, max, min
    """
    nums = data.numbers
    
    if not nums:
        return {"mean": None, "max": None, "min": None}
    
    return {
        "mean": sum(nums) / len(nums),
        "max": max(nums),
        "min": min(nums)
    }
