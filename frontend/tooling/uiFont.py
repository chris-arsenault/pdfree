"""Generate/check the UI WOFF2 projection; PDF embedding keeps the original TTF."""
import argparse
import json
from pathlib import Path

from fontTools.ttLib import TTFont

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--check", action="store_true", help="Verify without regenerating")
args = parser.parse_args()
assets = Path(__file__).resolve().parent.parent / "src" / "assets"
original = assets / "NotoSans-Regular.ttf"
output = assets / "NotoSans-Regular.woff2"
if not args.check:
    with TTFont(original, recalcTimestamp=False) as font:
        font.flavor = "woff2"
        font.save(output)
with TTFont(original, recalcTimestamp=False) as source, TTFont(output) as projected:
    assert source.getGlyphOrder() == projected.getGlyphOrder(), "Glyph order changed"
    assert source.getBestCmap() == projected.getBestCmap(), "Character coverage changed"
    assert source["hmtx"].metrics == projected["hmtx"].metrics, "Horizontal metrics changed"
    for field in ("unitsPerEm", "xMin", "yMin", "xMax", "yMax", "macStyle",
                  "lowestRecPPEM", "fontRevision", "created", "modified"):
        assert getattr(source["head"], field) == getattr(projected["head"], field), field
    for table in source.keys():
        if table not in {"GlyphOrder", "head", "glyf", "loca", "hmtx"}:
            assert source.getTableData(table) == projected.getTableData(table), table
    for glyph in source.getGlyphOrder():
        before = source["glyf"][glyph].getCoordinates(source["glyf"])
        after = projected["glyf"][glyph].getCoordinates(projected["glyf"])
        assert before == after, f"Glyph outline changed: {glyph}"
    print(json.dumps({"glyphs": len(source.getGlyphOrder()),
                      "characters": len(source.getBestCmap()),
                      "ttfBytes": original.stat().st_size,
                      "woff2Bytes": output.stat().st_size}))
