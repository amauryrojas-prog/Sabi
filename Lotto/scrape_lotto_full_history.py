#!/usr/bin/env python3
"""
Sabí Auto Import — Scraper de historial completo de lottoaruba.com
==================================================================
Raspa los 10 juegos de loteria para minimo 3 anos de historico.

Endpoint (descubierto por exploration de templates/lotto/scripts/lotto.js):
  POST https://www.lottoaruba.com/templates/lotto/xjpot-tab.php
  Body: i=<game_id>&p=<page>      (i = game_id, p = page index 0..N-1)
  Respuesta: HTML <table> con rows tr_ya / tr_yi con Date | Draw # | Numbers

IDs de juegos (verificados):
  1 = minimega           |  2 = lotto5
  3 = lottodidia         |  4 = big4
  5 = catochi            |  6 = zodiac
  7 = landsloterie       |  8 = cachicachi
  11 = 1off              | 12 = lucky3

Patron de URL y extraccion es IDENTICO para todos los juegos.
La cantidad de sorteos historicos varia por juego (lotto di dia = 4982).
Para 3 anos de cobertura:
  * Lotto di Dia: ~7 sorteos/semana * 52 * 3 = ~1090 sorteos = ~32 paginas
  * Lotto 5: similar ~14 paginas
  * Etc.
"""

import urllib.request
import urllib.parse
import re
import json
import time
import sys
from datetime import datetime, timedelta

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
URL = "https://www.lottoaruba.com/templates/lotto/xjpot-tab.php"

# Map game_id -> (game_code_frontend, game_label)
GAMES = {
    1:  ("minimega",      "Mini Mega",     "01-02-03-04",   "0",   "101,1,30"),
    2:  ("lotto5",        "Lotto 5",       "01-02-03-04-05", "01", "105,1,35"),
    3:  ("lottodidia",    "Lotto di Dia",  "01-02-03-04-05", "0",  "105,1,30"),
    4:  ("big4",          "Big 4",         "0-0-0-0",       "0",  "104,0,9"),
    5:  ("catochi",       "Catochi",       "0-0-0-0",       "0",  "104,0,9"),  # 4-digit × 3 prizes
    6:  ("zodiac",        "Zodiac",        "0-0-0-0",       "0",  "104,0,9"),
    7:  ("landsloterie",  "Wega Korsou",   "01-02-03-04-05", "0", "105,0,36"),
    8:  ("cachicachi",    "Cachi Cachi",   "01-02-03-04-05", "0", "105,0,99"),
    11: ("1off",          "1-OFF",         "0-0-0-0",       "0",  "104,0,9"),
    12: ("lucky3",        "Lucky 3",       "0-0-0",         "0",  "103,0,9"),
}

def fetch_page(game_id, page_idx, retries=3):
    """POST a xjpot-tab.php con retries."""
    body = f"i={game_id}&p={page_idx}".encode()
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
                })
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.read().decode("utf-8", errors="ignore")
        except Exception as e:
            print(f"  retry {attempt+1}/{retries} on game {game_id} page {page_idx}: {e}", file=sys.stderr)
            time.sleep(2)
    return None


ROW_REGEX = re.compile(
    r'<tr class="tr_(?:ya|yi)">'
    r'<td width="100">([^<]+)</td>'
    r'<td width="60">(\d+)</td>'
    r'<td[^>]+>([0-9][0-9-]+)</td>',
    re.IGNORECASE
)
PAGE_TOTAL_REGEX = re.compile(r"Showing\s+(\d+)\s+to\s+(\d+)\s+of\s+(\d+)")
LAST_PAGE_REGEX = re.compile(r"\?i=\d+&p=(\d+)[^\"]*\"[^>]*>Last\s*&raquo;", re.IGNORECASE)


def parse_page(html):
    """Devuelve (rows, total_count, last_page)."""
    if not html:
        return [], 0, 0
    rows = ROW_REGEX.findall(html)
    total_match = PAGE_TOTAL_REGEX.search(html)
    total = int(total_match.group(3)) if total_match else 0
    last_match = LAST_PAGE_REGEX.search(html)
    last_page = int(last_match.group(1)) if last_match else 0
    return rows, total, last_page


def parse_numbers(num_str):
    """'02-03-13-14-26' -> [2, 3, 13, 14, 26]"""
    return [int(x) for x in num_str.split('-') if x.strip()]


def parse_date(date_str):
    """'Jul 14, 2026' -> '2026-07-14'"""
    try:
        dt = datetime.strptime(date_str.strip(), "%b %d, %Y")
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return None


def escape_sql(s):
    return s.replace("'", "''")


def build_sql_for_game(game_id, code, label, rows, total):
    """rows es list of (date_str, draw_num, numbers_str)."""
    parts = []
    parts.append(f"-- ===========================================================")
    parts.append(f"-- {label} ({code}) — game_id={game_id}")
    parts.append(f"-- Generated {datetime.now().isoformat()} | {len(rows)} sorteos | total historico={total}")
    parts.append(f"-- ===========================================================")
    seen_draws = set()
    seen_draws_full = set()
    parts.append("BEGIN;")
    parts.append("")
    parts.append(f"-- Limpieza previa: borrar draws del juego {code} (idempotente)")
    parts.append(f"DELETE FROM lottery_draws WHERE game = '{code}';")
    parts.append("")
    parts.append(f"-- Inserciones para {label}")
    for date_str, draw_num_str, numbers_str in rows:
        n = draw_num_str
        if n in seen_draws_full:
            continue
        seen_draws_full.add(n)
        # Build VALUES
        numbers_list = parse_numbers(numbers_str)
        numbers_arr = "{" + ",".join(str(x) for x in numbers_list) + "}"
        d = parse_date(date_str)
        if not d:
            continue
        # Game-specific post-processing
        zodiac_sign = "null"
        megaball = "null"
        # For now, just insert the basic data
        parts.append(
            "INSERT INTO lottery_draws (game, draw_number, draw_date, draw_type, numbers, megaball, zodiac_sign, source)"
        )
        parts.append(
            f"  VALUES ('{code}', {n}, '{d}', 'Evening', '{numbers_arr}'::int[], {megaball}, {zodiac_sign}, 'lottoaruba_history_2026_07_15')"
        )
        parts.append("ON CONFLICT (game, draw_number, draw_type) DO UPDATE SET draw_date = EXCLUDED.draw_date, numbers = EXCLUDED.numbers;")
        parts.append("")
    parts.append("COMMIT;")
    return "\n".join(parts)


def main(targets):
    """targets = dict[game_id] = list[(date, draw_num, numbers_str)]"""
    print(f"[{datetime.now().isoformat()}] Start scrape de {len(targets)} juegos")
    sql_parts = []
    sql_parts.append("-- ===========================================================")
    sql_parts.append("-- SABÍ AUTO IMPORT — SCRAPE DE HISTORICO LOTTOARUBA.COM")
    sql_parts.append(f"-- Generated {datetime.now().isoformat()}")
    sql_parts.append("-- Minimo 3 años de historico por juego")
    sql_parts.append("-- Source: https://www.lottoaruba.com/?results=N")
    sql_parts.append("-- ===========================================================")
    sql_parts.append("")
    sql_parts.append("-- IMPORTANTE:")
    sql_parts.append("-- 1. Ejecutar en SQL Editor de Supabase (proyecto bfbqiocegzjqbogvjlux)")
    sql_parts.append("-- 2. Si ya tienes datos, estos INSERTs los sobreescriben (ON CONFLICT DO UPDATE)")
    sql_parts.append("-- 3. Las tablas lottery_draws deben existir (ver migration 20260714xxx_lottery_draws.sql)")
    sql_parts.append("")

    summary = []
    for game_id, (code, label, sample, _, _) in GAMES.items():
        if game_id not in targets:
            continue
        print(f"\n=== Game {game_id} ({label}) ===")
        all_rows = targets[game_id]
        total = len(all_rows)
        # Dedup by draw #
        unique = {}
        for r in all_rows:
            unique[r[1]] = r
        all_rows_unique = list(unique.values())
        # Sort by draw num desc (most recent first) and limit
        all_rows_unique.sort(key=lambda r: int(r[1]), reverse=True)
        print(f"  total sorteos scrapeados: {len(all_rows_unique)}")
        sql = build_sql_for_game(game_id, code, label, all_rows_unique, total)
        sql_parts.append(sql)
        summary.append((code, label, len(all_rows_unique)))

    full_sql = "\n".join(sql_parts)
    out_path = r"C:\Users\Amaury\Downloads\Sabi\Lotto\insert_lottery_history.sql"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(full_sql)
    print(f"\n[OK] SQL written to {out_path}")
    print(f"[OK] File size: {len(full_sql)} bytes / {len(full_sql.splitlines())} lines")
    print("\nSUMMARY:")
    for code, label, count in summary:
        print(f"  {label} ({code}): {count} sorteos")
    return out_path


if __name__ == "__main__":
    # args
    if len(sys.argv) < 2:
        print("Usage: python scrape_lotto_full_history.py input.json")
        sys.exit(1)
    input_path = sys.argv[1]
    with open(input_path, "r", encoding="utf-8") as f:
        targets = json.load(f)
    # Convert keys back to int
    targets = {int(k): v for k, v in targets.items()}
    main(targets)
