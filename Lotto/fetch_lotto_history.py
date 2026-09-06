#!/usr/bin/env python3
"""
Sabí Fetcher — Descarga el historial completo de lottoaruba.com
================================================================
Hace POST a /templates/lotto/xjpot-tab.php para cada juego y cada pagina,
parsea las filas tr_ya / tr_yi y devuelve un JSON con todos los sorteos.

Uso:
  python fetch_lotto_history.py [GAME_IDS_COMMA_SEPARATED]
  # default = todos (1,2,3,4,5,6,7,8,11,12)

Salida:
  fetch_lotto_history.json (en el mismo directorio)
"""

import urllib.request
import urllib.parse
import re
import json
import time
import sys
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
URL = "https://www.lottoaruba.com/templates/lotto/xjpot-tab.php"

# Game ID -> (slug, friendly name, expected numbers count per draw)
GAMES = {
    1:  ("minimega",     "Mini Mega",        4),  # 4 numbers + megaball
    2:  ("lotto5",       "Lotto 5",           5),  # 5 numbers
    3:  ("lottodidia",   "Lotto di Dia",     5),  # 5 numbers
    4:  ("big4",         "Big 4",            4),  # 4 digits, 4-of-4 (single number, 0000-9999)
    5:  ("catochi",      "Catochi",          4),  # 4 digits (3 prizes each)
    6:  ("zodiac",       "Zodiac",           4),  # 4 digits + sign
    7:  ("landsloterie", "Wega Korsou",      5),  # 5 numbers
    8:  ("cachicachi",   "Cachi Cachi",      5),  # 5 numbers
    11: ("1off",         "1-OFF",            4),  # 4 digits
    12: ("lucky3",       "Lucky 3",          3),  # 3 digits
}

ROW_REGEX = re.compile(
    r'<tr class="tr_(?:ya|yi)">'
    # Date (always first td)
    r'<td[^>]*>([^<]+?)</td>'
    # Optional: Draw type (e.g. "Evening Draw", "Midday Draw", "Anochi", "Atardi")
    r'(?:<td[^>]*>([^<]+?)</td>)?'
    # Draw number (always 2nd or 3rd td)
    r'<td[^>]*>(\d+)</td>'
    # Numbers (in a styled td)
    r'<td[^>]+>([0-9][0-9-]+)</td>',
    re.IGNORECASE
)
TOTAL_REGEX = re.compile(r"Showing\s+\d+\s+to\s+\d+\s+of\s+(\d+)")
FIRST_PAGE_TOTAL_AND_LAST = re.compile(
    r"of\s+(\d+)</span>[\s\S]*?p=(\d+)\"\s*class=\"tabres\"\s*>\s*Last\s*&raquo;",
    re.IGNORECASE
)


def fetch_page(game_id, page_idx, retries=4):
    body = f"i={game_id}&p={page_idx}".encode()
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                URL, data=body, method="POST",
                headers={
                    "User-Agent": UA,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-Requested-With": "XMLHttpRequest",
                    "Origin": "https://www.lottoaruba.com",
                    "Referer": f"https://www.lottoaruba.com/?results={game_id}",
                    "Accept": "text/html,*/*;q=0.9",
                })
            with urllib.request.urlopen(req, timeout=20) as resp:
                return resp.read().decode("utf-8", errors="ignore")
        except Exception as e:
            last_err = e
            time.sleep(1.5 + attempt * 1.0)
    return None


def parse_first_page(html):
    """Extrae total y last_page de la primera pagina."""
    total = 0
    last_page = 0
    if not html:
        return total, last_page
    m = TOTAL_REGEX.search(html)
    if m:
        try: total = int(m.group(1))
        except: total = 0
    m2 = FIRST_PAGE_TOTAL_AND_LAST.search(html)
    if m2:
        try:
            last_page = int(m2.group(2))
        except:
            last_page = 0
    return total, last_page


def parse_all_rows(html):
    """Returns tuples (date, draw_num, numbers, draw_type).
    draw_type is None for games without multiple draws per day.
    Empty draw_type (from empty <td>) is converted to None."""
    rows = []
    if not html:
        return rows
    for m in ROW_REGEX.finditer(html):
        date = m.group(1).strip()
        draw_type = m.group(2).strip() if m.group(2) else None
        draw_num = m.group(3).strip()
        numbers = m.group(4).strip()
        rows.append((date, draw_num, numbers, draw_type))
    return rows


def parse_row(html):
    """Legacy 3-tuple (date, draw_num, numbers)."""
    m = ROW_REGEX.search(html)
    if not m:
        return None
    if m.group(2) is not None:
        return (m.group(1), m.group(3), m.group(4))
    else:
        return (m.group(1), m.group(2), m.group(3))



def fetch_game(game_id, code, label, target_rows=None, max_pages=None):
    """
    Devuelve: {
      'rows': [(date, draw_num, numbers_str, ...)],
      'total': int,
      'pages_fetched': int
    }
    """
    print(f"  [start] game {game_id} ({label})")

    html0 = fetch_page(game_id, 0)
    if not html0 or len(html0) < 100:
        print(f"  [ERROR] primera respuesta invalida para game {game_id}")
        return {"rows": [], "total": 0, "pages_fetched": 0}

    total, last_page = parse_first_page(html0)
    if total == 0:
        # Detectar total via conteo directo de la pagina: el sitio a veces devuelve pagina sin "of TOTAL"
        rows0 = parse_all_rows(html0)
        total = last_page = len(rows0) if rows0 else 0

    print(f"  total sorteos={total}, last_page={last_page}")

    if total == 0 or last_page == 0:
        return {"rows": [], "total": 0, "pages_fetched": 0}

    # Si el usuario dio un objetivo (target_rows) y ya lo cubre la primera pagina,
    # bajamos un poco. Si no, scrapeamos todo.
    pages_to_fetch = last_page + 1  # pages 0..last_page inclusive
    if max_pages:
        pages_to_fetch = min(pages_to_fetch, max_pages)

    # Stop early if we already got enough rows
    all_rows_dict = {}  # draw_num -> row tuple

    # Add page 0 rows (4-tuples: date, draw_num, numbers, draw_type)
    for r in parse_all_rows(html0):
        # r = (date, draw_num, numbers, draw_type)
        all_rows_dict[(r[1], r[3] or 'default')] = r

    print(f"  [page 0/{last_page}] {len(all_rows_dict)} sorteos (parcial)")

    if target_rows and len(all_rows_dict) >= target_rows:
        print(f"  [stop early] ya tenemos {len(all_rows_dict)} sorteos")
        rows = list(all_rows_dict.values())
        return {"rows": rows, "total": total, "pages_fetched": 1}

    # Scrape pages 1..last_page concurrently (4 threads max)
    pages_to_scrape = list(range(1, pages_to_fetch))
    if pages_to_scrape:
        with ThreadPoolExecutor(max_workers=4) as ex:
            futures = {ex.submit(fetch_page, game_id, p): p for p in pages_to_scrape}
            ok_count = 0
            err_count = 0
            for fut in as_completed(futures):
                p = futures[fut]
                h = fut.result()
                if h:
                    rs = parse_all_rows(h)
                    for r in rs:
                        # r = (date, draw_num, numbers, draw_type)
                        all_rows_dict[(r[1], r[3] or 'default')] = r
                    ok_count += 1
                else:
                    err_count += 1
                if (ok_count + err_count) % 5 == 0:
                    print(f"    [progress] {ok_count}/{err_count} paginas | {len(all_rows_dict)} sorteos")
                # Stop early if we have enough
                if target_rows and len(all_rows_dict) >= target_rows:
                    print(f"  [stop early] {len(all_rows_dict)} sorteos >= target {target_rows}")
                    ex.shutdown(wait=False, cancel_futures=True)
                    break

    rows = list(all_rows_dict.values())
    # Filter: only keep rows where numbers count matches expected (o >= 0)
    rows = [r for r in rows if r[2].count('-') >= 0]
    print(f"  [done] game {game_id}: {len(rows)} sorteos scrapeados de {total} totales")
    return {"rows": rows, "total": total, "pages_fetched": len(pages_to_scrape) + 1}


def main(target_years=3, game_ids=None):
    """
    target_years: minimos anos a scrapear
    game_ids: lista de IDs a scrapear (default: todos)
    """
    if game_ids is None:
        game_ids = list(GAMES.keys())

    print(f"====================================================")
    print(f"[FETCHER] Sabí Loteria History Fetcher v1")
    print(f"====================================================")
    print(f"  Juegos a scrapear: {game_ids}")
    print(f"  Target anos: {target_years}")
    print(f"  Endpoint: POST {URL}")
    print(f"  Started: {datetime.now().isoformat()}")
    print(f"")

    # Calcular pages necesarias:
    # 7 sorteos/semana para juegos diarios (Lotto di Dia) ~ 3 anos = ~1090 sorteos = ~32 pages
    # Para juegos de turno unico (Cachi Cachi = 281 sorteos), MUCHAS menos paginas
    # Para asegurarnos 3 anos, scrapeamos TODAS las paginas (el servidor aguanta)
    all_data = {}

    for game_id in game_ids:
        info = GAMES.get(game_id)
        if not info:
            continue
        code, label, expected_numbers = info
        result = fetch_game(game_id, code, label)
        rows = result["rows"]
        # Convert 4-tuples (date, draw_num, numbers, draw_type) to dicts
        cleaned = []
        for r in rows:
            if not r or len(r) < 4:
                continue
            try:
                cleaned.append({
                    "draw": int(r[1]),
                    "date": r[0],
                    "numbers": r[2],
                    "draw_type": r[3],
                })
            except (ValueError, TypeError) as e:
                print(f"  [skip bad row] {r}: {e}")
                continue
        all_data[game_id] = cleaned
    for gid in all_data:
        all_data[gid].sort(key=lambda x: (-x["draw"], x.get("draw_type") or ""))
        # Dedup: keep first occurrence of each draw
        seen = set()
        deduped = []
        for d in all_data[gid]:
            if d["draw"] not in seen:
                seen.add(d["draw"])
                deduped.append(d)
        all_data[gid] = deduped

    out_path = r"C:\Users\Amaury\Downloads\Sabi\Lotto\fetch_lotto_history.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, indent=2, ensure_ascii=False)

    print(f"\n[OK] Wrote {out_path}")
    print(f"     Bytes: {len(json.dumps(all_data))}")
    total_sorteos = sum(len(v) for v in all_data.values())
    print(f"     Total sorteos scrapeados: {total_sorteos}")
    for gid in sorted(all_data.keys()):
        info = GAMES.get(gid)
        if info:
            code, label, _ = info
            print(f"     Game {gid} ({label} -> {code}): {len(all_data[gid])} sorteos")
    return out_path


if __name__ == "__main__":
    target_years = 3
    game_ids = None
    if len(sys.argv) >= 2:
        game_ids = [int(x) for x in sys.argv[1].split(",")]
    if len(sys.argv) >= 3:
        target_years = int(sys.argv[2])
    main(target_years=target_years, game_ids=game_ids)
