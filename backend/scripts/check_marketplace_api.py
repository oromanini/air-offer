import argparse
import sys
from typing import Any, Dict, Optional

import httpx


DEFAULT_QUERY = "ar condicionado"
DEFAULT_ZIP_CODE = "01001-000"
SEARCH_URL = "https://api.mercadolivre.com.br/sites/MLB/search"
ITEM_URL = "https://api.mercadolivre.com.br/items/{item_id}"
SHIPPING_URL = "https://api.mercadolivre.com.br/items/{item_id}/shipping_options"


def fetch_json(
    client: httpx.Client,
    url: str,
    params: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    response = client.get(url, params=params)
    response.raise_for_status()
    return response.json()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check Mercado Livre public API connectivity using search and shipping endpoints."
    )
    parser.add_argument("--query", default=DEFAULT_QUERY, help="Search query to use for the test.")
    parser.add_argument("--zip-code", default=DEFAULT_ZIP_CODE, help="Zip code for shipping options.")
    parser.add_argument("--timeout", type=float, default=30.0, help="HTTP timeout in seconds.")
    args = parser.parse_args()

    with httpx.Client(timeout=args.timeout) as client:
        search_data = fetch_json(client, SEARCH_URL, params={"q": args.query, "limit": 1})
        results = search_data.get("results", [])
        if not results:
            print("No results returned from search endpoint.")
            return 1

        item = results[0]
        item_id = item.get("id")
        if not item_id:
            print("Search result missing item id.")
            return 1

        item_data = fetch_json(client, ITEM_URL.format(item_id=item_id))
        shipping_data = fetch_json(
            client,
            SHIPPING_URL.format(item_id=item_id),
            params={"zip_code": args.zip_code},
        )

    print("Search OK:", item_id)
    print("Item OK:", item_data.get("title", "<no title>"))
    options = shipping_data.get("options", [])
    print("Shipping OK:", f"{len(options)} option(s) for {args.zip_code}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
