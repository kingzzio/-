#!/usr/bin/env python3
"""Pack src/ into a ready-to-open Roblox place file (Primordia.rbxlx).

No Rojo needed: double-click the output and Roblox Studio opens the game.
Usage: python3 tools/build_place.py [output_path]
"""
import itertools
import pathlib
import sys
from xml.sax.saxutils import escape

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
_ref = itertools.count(1)


def cdata(text: str) -> str:
    # split any "]]>" so it can't terminate the CDATA block early
    return "<![CDATA[" + text.replace("]]>", "]]]]><![CDATA[>") + "]]>"


def item(cls: str, name: str, children: str = "", extra: str = "") -> str:
    return (
        f'<Item class="{cls}" referent="RBX{next(_ref)}"><Properties>'
        f'<string name="Name">{escape(name)}</string>{extra}</Properties>{children}</Item>'
    )


def script_item(path: pathlib.Path) -> str:
    stem = path.name[: -len(".lua")]
    if stem.endswith(".server"):
        cls, name = "Script", stem[: -len(".server")]
    elif stem.endswith(".client"):
        cls, name = "LocalScript", stem[: -len(".client")]
    else:
        cls, name = "ModuleScript", stem
    source = path.read_text(encoding="utf-8")
    return item(cls, name, extra=f'<ProtectedString name="Source">{cdata(source)}</ProtectedString>')


def folder(path: pathlib.Path, name: str) -> str:
    children = []
    for child in sorted(path.iterdir()):
        if child.is_dir():
            children.append(folder(child, child.name))
        elif child.suffix == ".lua":
            children.append(script_item(child))
    return item("Folder", name, "".join(children))


def build() -> str:
    parts = [
        item("Workspace", "Workspace", extra='<bool name="StreamingEnabled">true</bool>'),
        item(
            "Lighting",
            "Lighting",
            extra='<float name="ClockTime">14</float><float name="Brightness">2.4</float><bool name="GlobalShadows">true</bool>',
        ),
        item("ReplicatedStorage", "ReplicatedStorage", folder(SRC / "shared", "Shared")),
        item("ServerScriptService", "ServerScriptService", folder(SRC / "server", "Server")),
        item(
            "StarterPlayer",
            "StarterPlayer",
            item("StarterPlayerScripts", "StarterPlayerScripts", folder(SRC / "client", "Client")),
        ),
    ]
    return '<roblox version="4">' + "".join(parts) + "</roblox>"


if __name__ == "__main__":
    out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "Primordia.rbxlx"
    out.write_text(build(), encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")
