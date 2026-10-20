"""Shared geometry for OpenSCAD, GLB, the interactive study and validation."""
from pathlib import Path
import json

SPEC = json.loads((Path(__file__).parent / "components.json").read_text(encoding="utf-8"))
ENVELOPES = SPEC["envelopes"]


def part(identifier, label, size, center, category, group=None, **extra):
    return dict(id=identifier, label=label, size=size, center=center,
                category=category, group=group or identifier, **extra)


def from_lower(identifier, label, kind, lower, category, size=None, **extra):
    size = size or ENVELOPES[kind]["size"]
    center = [lower[i] + size[i] / 2 for i in range(3)]
    return part(identifier, label, size, center, category, kind=kind, **extra)


def internal_parts(layout):
    w, d, _ = layout["base"]
    rotated = lambda kind: [ENVELOPES[kind]["size"][1], ENVELOPES[kind]["size"][0],
                            ENVELOPES[kind]["size"][2]]
    result = [
        from_lower("battery", "Portaceldas + 2×18650", "battery_holder", [4, 75, 3], "power"),
        from_lower("buck", "LM2596S + voltímetro", "buck", [25, 3, 3], "power"),
        from_lower("esp32", "ESP32-S3", "esp32", [25, 42, 3], "electronics"),
        from_lower("bms", "BMS 2S USB-C", "bms", [90, 75, 3], "power", size=rotated("bms")),
        from_lower("speaker-l", "Parlante izquierdo", "speaker", [3, 3, 3],
                   "audio", size=rotated("speaker")),
        from_lower("speaker-r", "Parlante derecho", "speaker", [w-21, 3, 3],
                   "audio", size=rotated("speaker")),
    ]
    for i, x in enumerate([6, 30]):
        result.append(from_lower(f"led-{i}", f"NeoPixel zona {i+1} · 4 LEDs",
                                 "led_board", [x, 80, 27], "electronics"))
    for i, y in enumerate([82, 100]):
        result.append(from_lower(f"amp-{i}", f"MAX98357A {'LR'[i]}",
                                 "amplifier", [54, y, 27], "audio"))
    for i, x in enumerate([3, 14]):
        result.append(from_lower(f"cap-{i}", f"Reserva condensador {i+1}",
                                 "bulk_cap", [x, 62, 3], "power", provisional=True))
    for i, x in enumerate([74, 88]):
        result.append(from_lower(f"switch-{i}", ["SW-CELDAS", "SW-PANTALLA"][i],
                                 "switch", [x, d-10, 25], "controls"))
    return result


def control_parts(layout):
    h = layout["base"][2]
    result = []
    cap = ENVELOPES["keycap"]["size"]
    body = ENVELOPES["button_body"]["size"]
    for i, (x, y) in enumerate(layout["keys"]):
        label = str(i+1) if i < 10 else f"ALT{i-9}"
        group = f"key-{i+1}"
        result += [
            part(group, label, cap, [x,y,h+cap[2]/2],
                 "controls", group, kind="keycap", top_label=label),
            part(group+"-body", "Pulsador "+label, body, [x,y,h-body[2]/2],
                 "controls", group, kind="button_body"),
            part(group+"-wire", "Soldadura "+label, [body[0]+2,body[1]+2,5], [x,y,h-body[2]-2.5],
                 "clearance", group, reserve=True),
        ]
    for kind, cap_dia, cap_height in [("joystick",28,12), ("encoder",22,12)]:
        x,y = layout[kind]
        sx,sy,sz = ENVELOPES[kind]["size"]
        result += [
            part(kind, kind.capitalize(), [sx,sy,sz], [x,y,h-sz/2], "controls",
                 kind=kind),
            part(kind+"-cap", kind.capitalize(), [cap_dia,cap_dia,cap_height],
                 [x,y,h+cap_height/2], "controls", kind, shape="cylinder",
                 top_label="JOY" if kind=="joystick" else "ENC"),
            part(kind+"-wire", "Cableado "+kind, [sx,sy,4], [x,y,h-sz-2],
                 "clearance", kind, reserve=True),
        ]
    x,y = layout["joystick"]
    result.append(part("thumb", "Recorrido provisional del pulgar", [38,38,20],
                       [x,y,h+12], "clearance", "joystick", reserve=True,
                       ergonomic=True))
    return result


def mechanical_parts(layout):
    w,d,h = layout["base"]
    px,py,pz = layout["pivot"]
    bezel=ENVELOPES["bezel"]["size"]
    result = [
        part("base", "Volumen de carcasa propuesto", [w,d,h], [w/2,d/2,h/2],
             "structure", container=True),
        part("display", "Pantalla 4″ con bisel provisional", bezel,
             [0,bezel[1]/2,0], "display", "screen-hinge", moving=True, kind="bezel"),
    ]
    for side in [-1,1]:
        result.append(part(f"hinge-{side}", "Reserva soporte lateral", [2,12,14],
                           [px+side*(bezel[0]/2+1),py,pz-5], "structure", "screen-hinge"))
    result += [
        part("screen-cable", "Bucle flexible de pantalla", [14,8,12],
             [px,py-8,h-1], "clearance", "screen-hinge", reserve=True),
        part("usb-space", "Acceso USB ESP32 (orientación a confirmar)", [w+14-85,10,8],
             [(85+w+14)/2,66,10], "clearance", "esp32", reserve=True),
        part("charge-space", "Acceso USB-C BMS (orientación a confirmar)", [12,d+14-117,8],
             [99,(117+d+14)/2,8], "clearance", "bms", reserve=True),
    ]
    return result


def make_scene(layout):
    return {**layout, "parts": internal_parts(layout) + control_parts(layout)
            + mechanical_parts(layout)}
