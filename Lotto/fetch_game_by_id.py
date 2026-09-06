#!/usr/bin/env python3
"""
Sabí - Fetch 1 juego a la vez (script seguro)
================================================================
Uso: python fetch_game_by_id.py <game_id>
Guarda resultado en fetch_lotto_game_<gid>.json
"""
import sys, json, time
from fetch_lotto_history import fetch_game, GAMES

def main():
    if len(sys.argv) < 2:
        print("Usage: python fetch_game_by_id.py <game_id>")
        sys.exit(1)
    game_id = int(sys.argv[1])
    info = GAMES.get(game_id)
    if not info:
        print(f"Game {game_id} not found")
        sys.exit(1)
    code, label, expected = info
    print(f"Fetch game {game_id} ({label}) -> {code}")
    print(f"   expected rows={expected}")
    result = fetch_game(game_id, code, label)
    rows = []
    for r in result["rows"]:
        # r = (date, draw_num, numbers, draw_type)
        try:
            rows.append({
                "draw": int(r[1]),
                "date": r[0],
                "numbers": r[2],
                "draw_type": r[3],
                "game_id": game_id,
                "game_slug": code,
            })
        except Exception as ex:
            print(f"   [skip bad] {r}: {ex}")
            continue
    # Dedup by (draw, draw_type)
    seen = set()
    deduped = []
    for d in rows:
        key = (d["draw"], d.get("draw_type"))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(d)
    rows = deduped
    rows.sort(key=lambda x: -x["draw"])
    out = r"C:\Users\Amaury\Downloads\Sabi\Lotto\fetch_lotto_game_" + str(game_id) + ".json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"rows": rows, "total_scraped": len(rows), "total_announced": result["total"], "pages_fetched": result["pages_fetched"]}, f, indent=2, ensure_ascii=False)
    print(f"Wrote {out}: {len(rows)} sorteos")

if __name__ == "__main__":
    main()
