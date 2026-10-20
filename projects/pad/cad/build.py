"""Run: python projects/pad/cad/build.py [--inline-output ABSOLUTE.html]."""
import argparse
import json
from pathlib import Path
import struct
from exporters import write_glb, write_scad
from geometry import validate_scene
from layouts import LAYOUTS
from model import make_scene, SPEC

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]


def stl_bounds(path):
    data = path.read_bytes()
    count = struct.unpack_from("<I",data,80)[0]
    assert len(data) == 84+count*50
    vertices = [struct.unpack_from("<3f",data,84+i*50+12+j*12)
                for i in range(count) for j in range(3)]
    return [[min(v[k] for v in vertices),max(v[k] for v in vertices)] for k in range(3)]


def baseline():
    names = ["box","front_plate","tapa-superior"]
    boxes = {name:stl_bounds(REPO/"public"/"downloads"/"pad"/(name+".stl")) for name in names}
    bounds = [[min(b[k][0] for b in boxes.values()),max(b[k][1] for b in boxes.values())]
              for k in range(3)]
    return {"source":"Existing STL bounds; STL units interpreted as mm.",
            "parts":boxes,"base":[round(b-a,3) for a,b in bounds],
            "excludes":"Actual screen, pivot, feet and any protrusions in current physical assembly."}


def validate_inventory(scene):
    parts = scene["parts"]
    ids = [p["id"] for p in parts]
    assert len(ids) == len(set(ids))
    assert len([p for p in parts if p.get("kind")=="keycap"])==12
    for prefix,count in [("speaker-",2),("amp-",2),("led-",2),("switch-",2)]:
        assert len([i for i in ids if i.startswith(prefix)])==count
    for identifier in ["esp32","battery","buck","bms","display","joystick","encoder"]:
        assert identifier in ids
    w,d,h = scene["base"]
    for p in parts:
        if p["category"] not in ["power","electronics","audio"]:
            continue
        assert all(0 < p["center"][i]-p["size"][i]/2
                   and p["center"][i]+p["size"][i]/2 < [w,d,h][i] for i in range(3)), p["id"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--inline-output",type=Path)
    args = parser.parse_args()
    output = ROOT/"generated"
    output.mkdir(exist_ok=True)
    scenes = [make_scene(layout) for layout in LAYOUTS]
    reports = {}
    for scene in scenes:
        validate_inventory(scene)
        report = validate_scene(scene)
        assert not report["solid_collisions"], (scene["id"],report["solid_collisions"])
        assert not report["sweep_collisions_with_1mm_margin"], scene["id"]
        assert not report["reserve_collisions"], (scene["id"],report["reserve_collisions"])
        reports[scene["id"]] = report
        write_glb(scene,output/(scene["id"]+".glb"))
    data = dict(spec=SPEC,baseline=baseline(),scenes=scenes,reports=reports)
    encoded = json.dumps(data,ensure_ascii=False,separators=(",",":"))
    (output/"study.json").write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8",newline="\n")
    write_scad(scenes,ROOT/"assembly.scad")
    template = (ROOT/"viewer.html").read_text(encoding="utf-8")
    script = (ROOT/"viewer.js").read_text(encoding="utf-8")
    drawing = (ROOT/"drawing.js").read_text(encoding="utf-8")
    fragment = template.replace("/*__DATA__*/",encoded).replace("/*__DRAWING__*/",drawing).replace("/*__VIEWER__*/",script)
    (output/"preview.html").write_text(fragment,encoding="utf-8",newline="\n")
    if args.inline_output:
        args.inline_output.parent.mkdir(parents=True,exist_ok=True)
        args.inline_output.write_text(fragment,encoding="utf-8",newline="\n")
    print(json.dumps({"baseline":data["baseline"]["base"],"layouts":list(reports),
                      "sweep":"0..75 degrees, 1-degree sampling, 1 mm margin",
                      "status":"PASS for provisional box envelopes; see README for limitations"}))


if __name__ == "__main__":
    main()
