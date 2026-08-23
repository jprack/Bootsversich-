#!/usr/bin/env python3
"""Prueft die Querverweise der Fachdokumente.

Ein toter Verweis in einem Fachkonzept ist kein Schoenheitsfehler: Wer der
Verweiskette nicht folgen kann, liest die Begruendung nicht und entscheidet
ohne sie. Deshalb bricht die Pipeline hier ab.

Geprueft wird ausschliesslich Vorhandenes, nicht Stilistisches:
  1. Jeder relative Markdown-Verweis zeigt auf eine existierende Datei.
  2. Jedes ADR-Verzeichnis listet in seiner README alle vorhandenen ADR.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

WURZEL = Path(__file__).resolve().parents[2]
AUSGENOMMEN = {".git", "node_modules", "dist", ".next", ".turbo", "coverage"}
VERWEIS = re.compile(r"\[[^\]]*\]\(([^)]+)\)")


def markdown_dateien() -> list[Path]:
    treffer = []
    for pfad in WURZEL.rglob("*.md"):
        if any(teil in AUSGENOMMEN for teil in pfad.relative_to(WURZEL).parts):
            continue
        treffer.append(pfad)
    return sorted(treffer)


def pruefe_verweise(dateien: list[Path]) -> list[str]:
    fehler = []
    for datei in dateien:
        for ziel in VERWEIS.findall(datei.read_text(encoding="utf-8")):
            ziel = ziel.strip()
            if ziel.startswith(("http://", "https://", "mailto:", "#")):
                continue
            ziel = ziel.split("#", 1)[0].split(" ", 1)[0]
            if not ziel:
                continue
            aufgeloest = (datei.parent / ziel).resolve()
            if not aufgeloest.exists():
                fehler.append(
                    f"{datei.relative_to(WURZEL)}: Verweis geht ins Leere -> {ziel}"
                )
    return fehler


def pruefe_adr_verzeichnisse() -> list[str]:
    fehler = []
    for index in WURZEL.rglob("adr/README.md"):
        if any(teil in AUSGENOMMEN for teil in index.relative_to(WURZEL).parts):
            continue
        inhalt = index.read_text(encoding="utf-8")
        for adr in sorted(index.parent.glob("[0-9][0-9][0-9][0-9]-*.md")):
            if adr.name not in inhalt:
                fehler.append(
                    f"{index.relative_to(WURZEL)}: {adr.name} ist nicht im Verzeichnis gelistet"
                )
    return fehler


def main() -> int:
    dateien = markdown_dateien()
    fehler = pruefe_verweise(dateien) + pruefe_adr_verzeichnisse()

    if fehler:
        for zeile in fehler:
            print(f"::error::{zeile}")
        print(f"\n{len(fehler)} Befund(e) in {len(dateien)} Dokumenten.")
        return 1

    print(f"{len(dateien)} Dokumente geprueft, alle Querverweise loesen auf.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
