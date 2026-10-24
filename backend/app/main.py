from fastapi import FastAPI

app = FastAPI(
    title="Wind forecast",
    description=(
        "Wind forecasting using Elexon BMRS Data"
    ),
    version="0.1.0"
)

@app.get("/health")
async def main():
    return{
        "status":"ok",
        "service":"Wind forecast API"
    }