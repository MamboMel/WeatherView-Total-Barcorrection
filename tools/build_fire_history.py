"""Genera data/fire_history_peru.json: MODIS + VIIRS armonizados (celda ~1 km x día).
Uso: FIRMS_KEY=tu_clave python tools/build_fire_history.py --start 2018-01-01"""
import csv, io, json, os, sys, time, urllib.request, datetime as dt
KEY, AREA = os.environ["FIRMS_KEY"], "-81.5,-18.5,-68.5,0"
SRC = {"MODIS_SP": "M", "VIIRS_SNPP_SP": "V", "VIIRS_NOAA20_SP": "V"}
start = dt.date.fromisoformat(sys.argv[sys.argv.index("--start") + 1]) if "--start" in sys.argv else dt.date(2018, 1, 1)
cells = {}
for src, flag in SRC.items():
    d = start
    while d < dt.date.today():
        try:
            url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{KEY}/{src}/{AREA}/10/{d}"
            for r in csv.DictReader(io.StringIO(urllib.request.urlopen(url, timeout=120).read().decode())):
                k = (round(float(r["latitude"]), 2), round(float(r["longitude"]), 2), r["acq_date"])
                prev = cells.get(k); cells[k] = flag if prev in (None, flag) else "MV"
        except Exception as e: print("fallo", src, d, e)
        d += dt.timedelta(days=10); time.sleep(1.5)  # cada día consultado cuenta como transacción (límite 5000/10 min)
os.makedirs("data", exist_ok=True)
json.dump({"source": "FIRMS", "events": [[a, b, c, f] for (a, b, c), f in cells.items()]}, open("data/fire_history_peru.json", "w"), separators=(",", ":"))
