from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

class ProductCondition(str, Enum):
    NEW = "new"
    USED = "used"
    REFURBISHED = "refurbished"

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    title: str
    price: float
    original_price: Optional[float] = None
    currency: str = "BRL"
    condition: str
    thumbnail: str
    permalink: str
    seller: Dict[str, Any]
    free_shipping: bool = False
    location: Optional[str] = None
    available_quantity: int = 0
    sold_quantity: int = 0
    attributes: List[Dict[str, Any]] = []

class PriceHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    price: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_title: str
    target_price: float
    user_email: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AlertCreate(BaseModel):
    product_id: str
    product_title: str
    target_price: float
    user_email: Optional[str] = None

class ShippingRequest(BaseModel):
    zip_code: str

@api_router.get("/")
async def root():
    return {"message": "FrostFind API - Air Conditioner Deal Finder"}

@api_router.get("/products/search")
async def search_products(
    q: str = Query(default="ar condicionado", description="Search query"),
    condition: Optional[str] = Query(default=None, description="new, used, or refurbished"),
    sort: Optional[str] = Query(default="price_asc", description="Sort: price_asc, price_desc"),
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = Query(default=50, le=100),
):
    """Search products on Mercado Livre."""

    # Real API call
    try:
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            url = "https://api.mercadolivre.com.br/sites/MLB/search"
            params = {
                "q": q,
                "limit": limit
            }

            # Add condition filter
            if condition:
                if condition == "refurbished":
                    params["ITEM_CONDITION"] = "2230284"
                elif condition == "new":
                    params["condition"] = "new"
                elif condition == "used":
                    params["condition"] = "used"

            # Add price filters
            if min_price:
                params["price"] = f"{min_price}-{max_price or ''}" if max_price else f"{min_price}-*"
            elif max_price:
                params["price"] = f"*-{max_price}"

            # Add sorting
            if sort == "price_asc":
                params["sort"] = "price_asc"
            elif sort == "price_desc":
                params["sort"] = "price_desc"

            response = await http_client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            products = []
            for item in data.get("results", []):
                # Determine condition
                item_condition = item.get("condition", "used").lower()
                if item.get("attributes"):
                    for attr in item["attributes"]:
                        if attr.get("id") == "ITEM_CONDITION" and attr.get("value_name") == "Reacondicionado":
                            item_condition = "refurbished"
                            break

                # Calculate discount
                original_price = item.get("original_price")
                current_price = item.get("price", 0)

                product = Product(
                    id=item["id"],
                    title=item["title"],
                    price=current_price,
                    original_price=original_price,
                    currency=item.get("currency_id", "BRL"),
                    condition=item_condition,
                    thumbnail=item.get("thumbnail", "").replace("http://", "https://"),
                    permalink=item.get("permalink", ""),
                    seller={
                        "id": item.get("seller", {}).get("id"),
                        "nickname": item.get("seller", {}).get("nickname", "Vendedor")
                    },
                    free_shipping=item.get("shipping", {}).get("free_shipping", False),
                    location=item.get("address", {}).get("state_name"),
                    available_quantity=item.get("available_quantity", 0),
                    sold_quantity=item.get("sold_quantity", 0),
                    attributes=item.get("attributes", [])
                )
                products.append(product)

                # Save price to history
                price_history = PriceHistory(
                    product_id=item["id"],
                    price=current_price
                )
                history_doc = price_history.model_dump()
                history_doc['timestamp'] = history_doc['timestamp'].isoformat()
                await db.price_history.insert_one(history_doc)

            # Sort by discount if refurbished (prioritize deals)
            if condition == "refurbished" or not condition:
                products.sort(key=lambda x: (
                    x.condition == "refurbished",
                    -((x.original_price - x.price) / x.original_price * 100) if x.original_price and x.original_price > x.price else 0
                ), reverse=True)

            return {
                "total": len(products),
                "products": products,
                "mock_data": False
            }

    except httpx.HTTPError as e:
        logging.error(f"HTTP error searching products: {e}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except Exception as e:
        logging.error(f"Error searching products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/products/{product_id}/shipping")
async def calculate_shipping(product_id: str, shipping_req: ShippingRequest):
    """Calculate shipping cost for a product."""

    # Real API call
    try:
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            url = f"https://api.mercadolivre.com.br/items/{product_id}"
            response = await http_client.get(url)
            response.raise_for_status()
            item_data = response.json()
            
            # Get shipping options
            shipping_url = f"https://api.mercadolivre.com.br/items/{product_id}/shipping_options"
            shipping_params = {
                "zip_code": shipping_req.zip_code
            }
            
            shipping_response = await http_client.get(shipping_url, params=shipping_params)
            shipping_response.raise_for_status()
            shipping_data = shipping_response.json()
            
            options = []
            for option in shipping_data.get("options", []):
                options.append({
                    "name": option.get("name", "Padrão"),
                    "cost": option.get("cost", 0),
                    "currency": option.get("currency_id", "BRL"),
                    "estimated_delivery_time": option.get("estimated_delivery_time", {}).get("date"),
                    "shipping_method_id": option.get("shipping_method_id")
                })
            
            return {
                "product_id": product_id,
                "free_shipping": item_data.get("shipping", {}).get("free_shipping", False),
                "options": options,
                "mock_data": False
            }
            
    except httpx.HTTPError as e:
        logging.error(f"HTTP error calculating shipping: {e}")
        raise HTTPException(status_code=503, detail="Could not calculate shipping")
    except Exception as e:
        logging.error(f"Error calculating shipping: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/products/{product_id}/price-history")
async def get_price_history(product_id: str, days: int = Query(default=30, le=90)):
    """Get price history for a product"""
    try:
        # Calculate date range
        from_date = datetime.now(timezone.utc).timestamp() - (days * 24 * 60 * 60)
        
        # Query price history
        history = await db.price_history.find(
            {"product_id": product_id},
            {"_id": 0}
        ).sort("timestamp", 1).to_list(1000)
        
        # Convert timestamps
        for record in history:
            if isinstance(record['timestamp'], str):
                record['timestamp'] = record['timestamp']
        
        return {
            "product_id": product_id,
            "history": history
        }
        
    except Exception as e:
        logging.error(f"Error getting price history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/alerts", response_model=Alert)
async def create_alert(alert_create: AlertCreate):
    """Create a price alert"""
    try:
        alert = Alert(**alert_create.model_dump())
        alert_doc = alert.model_dump()
        alert_doc['created_at'] = alert_doc['created_at'].isoformat()
        
        await db.alerts.insert_one(alert_doc)
        return alert
        
    except Exception as e:
        logging.error(f"Error creating alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts(active_only: bool = Query(default=True)):
    """Get all alerts"""
    try:
        query = {"active": True} if active_only else {}
        alerts = await db.alerts.find(query, {"_id": 0}).to_list(1000)
        
        for alert in alerts:
            if isinstance(alert['created_at'], str):
                alert['created_at'] = datetime.fromisoformat(alert['created_at'])
        
        return alerts
        
    except Exception as e:
        logging.error(f"Error getting alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    """Delete an alert"""
    try:
        result = await db.alerts.delete_one({"id": alert_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
        return {"message": "Alert deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()