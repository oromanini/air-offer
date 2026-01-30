# Backend notes

## Marketplace API connectivity

The backend integrates with Mercado Livre public endpoints for search and shipping calculations in `server.py`.
Both endpoints always call Mercado Livre (no mock mode).

## Quick connectivity check

Run the script below to verify public Mercado Livre endpoints without needing the backend running:

```bash
python backend/scripts/check_marketplace_api.py --query "ar condicionado" --zip-code 01001-000
```

The script will:
1. Perform a search request.
2. Fetch the first item details.
3. Fetch shipping options for that item.

If any request fails, the script exits with a non-zero code.
