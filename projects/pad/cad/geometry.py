"""Conservative box collision checks, including the display's rotated envelope."""
import math
from itertools import product


def world_vertices(part, layout, angle):
    vertices = []
    a = math.radians(angle)
    for signs in product([-1, 1], repeat=3):
        q = [part["center"][i] + signs[i]*part["size"][i]/2 for i in range(3)]
        if part.get("moving"):
            x,y,z = q
            p = layout["pivot"]
            q = [p[0]+x, p[1]+y*math.cos(a)-z*math.sin(a),
                 p[2]+y*math.sin(a)+z*math.cos(a)]
        vertices.append(q)
    return vertices


def bounds(vertices):
    return [[min(p[i] for p in vertices), max(p[i] for p in vertices)] for i in range(3)]


def overlap(a, b, layout, angle, margin=0):
    """SAT for boxes with rotations around X only; exact for our box envelopes."""
    av, bv = world_vertices(a,layout,angle), world_vertices(b,layout,angle)
    rad = math.radians(angle)
    axes = [[1,0,0],[0,1,0],[0,0,1]]
    if a.get("moving") or b.get("moving"):
        axes += [[0,math.cos(rad),math.sin(rad)], [0,-math.sin(rad),math.cos(rad)]]
    for axis in axes:
        ap = [sum(v[i]*axis[i] for i in range(3)) for v in av]
        bp = [sum(v[i]*axis[i] for i in range(3)) for v in bv]
        depth = min(max(ap),max(bp)) - max(min(ap),min(bp))
        if depth <= -margin + 1e-7:
            return False
    return True


def metrics(scene, angle):
    parts = [p for p in scene["parts"] if not p.get("reserve")]
    bb = bounds([v for p in parts for v in world_vertices(p,scene,angle)])
    size = [round(b-a,2) for a,b in bb]
    w,d,h = scene["base"]
    return dict(angle=angle, overall_mm=size,
                base_area_reduction_pct=round(100*(1-w*d/(110*160)),2),
                overall_area_reduction_pct=round(100*(1-size[0]*size[1]/17600),2),
                base_envelope_volume_change_pct=round(100*(w*d*h/(110*160*35)-1),2))


def validate_scene(scene):
    solids = [p for p in scene["parts"] if not p.get("reserve") and not p.get("container")]
    pairs = []
    for i, a in enumerate(solids):
        for b in solids[i+1:]:
            if a["group"] != b["group"] and overlap(a,b,scene,scene["angle"]):
                pairs.append([a["id"], b["id"]])
    display = next(p for p in solids if p["id"]=="display")
    obstacles = [p for p in solids if p["group"]!=display["group"]]
    obstacles += [p for p in scene["parts"] if p.get("ergonomic")]
    obstacles += [p for p in scene["parts"] if p.get("container")]
    sweep = []
    for angle in range(0,76):
        hit = [p["id"] for p in obstacles if overlap(display,p,scene,angle,margin=1)]
        if hit:
            sweep.append({"angle": angle, "parts": hit})
    reserves = [p for p in scene["parts"] if p.get("reserve") and not p.get("ergonomic")]
    reserve_hits = [[r["id"],s["id"]] for r in reserves for s in solids
                    if r["group"]!=s["group"] and overlap(r,s,scene,scene["angle"])]
    return dict(solid_collisions=pairs, sweep_collisions_with_1mm_margin=sweep,
                reserve_collisions=reserve_hits,
                intended_contacts=["Display and hinge supports share screen-hinge group; bearing fit unmodeled."],
                metrics=[metrics(scene,a) for a in [0,20,35,45,55,75]],
                scope="Box envelopes only. Does not certify fasteners, wires, ergonomics, holding torque or stability.")
