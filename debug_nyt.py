import os
import requests
from dotenv import load_dotenv

load_dotenv(".env")
cookie = os.getenv("NYT_S_COOKIE")

if not cookie:
    print("Failed to get NYT_S_COOKIE")
    exit(1)

session = requests.Session()
# connections puzzle ID for 2026-07-09 is 1206
pid = 1206
resp = session.get(f"https://www.nytimes.com/svc/games/state/connections/latests?puzzle_ids={pid}", headers={"Cookie": f"NYT-S={cookie}"})
if resp.status_code != 200:
    print("Failed to fetch states:", resp.status_code)
else:
    states = resp.json().get("states", [])
    if states:
        game_data = states[0].get("game_data", {})
        print("Keys in Connections game_data:", list(game_data.keys()))
        print("Game Data contents:", game_data)
    else:
        print("No states returned")
