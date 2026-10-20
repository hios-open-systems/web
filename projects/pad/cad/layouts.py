"""Three packaging hypotheses; coordinates in mm, front at y=0, z upward."""

LAYOUTS = [
    {
        "id": "lineal", "name": "Lineal", "base": [120, 134, 38],
        "pivot": [60, 83, 46], "angle": 55,
        "note": "Conserva 2×5 y una fila de navegación. Más familiar; pantalla sobresale al bajarla.",
        "keys": [[16 + col * 18, 12 + row * 20] for row in range(2) for col in range(5)]
                + [[16, 56], [34, 56]],
        "joystick": [96, 55], "encoder": [58, 56],
    },
    {
        "id": "cuadricula", "name": "Cuadrícula", "base": [128, 120, 38],
        "pivot": [64, 68, 46], "angle": 55,
        "note": "12 teclas en 4×3; joystick y encoder a la derecha. Menor huella de base.",
        "keys": [[14 + col * 18, 12 + row * 18] for row in range(3) for col in range(4)],
        "joystick": [104, 42], "encoder": [104, 13],
    },
    {
        "id": "doble-fila", "name": "Doble fila", "base": [124, 126, 38],
        "pivot": [62, 85, 46], "angle": 60,
        "note": "2×5 acciones + un ALT al final de cada fila. Navegación detrás; más ancho.",
        "keys": [[17 + col * 18, 12 + row * 20] for row in range(2) for col in range(5)]
                + [[107, 12], [107, 32]],
        "joystick": [24, 57], "encoder": [64, 57],
    },
]
