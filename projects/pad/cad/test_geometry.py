"""Checks intended to catch physical overlap and packaging regressions."""
import copy
import unittest
from build import baseline, validate_inventory
from geometry import overlap, validate_scene, world_vertices
from layouts import LAYOUTS
from model import make_scene, part


class GeometryTests(unittest.TestCase):
    def test_all_inventory_and_sweep(self):
        for layout in LAYOUTS:
            with self.subTest(layout=layout["id"]):
                scene=make_scene(layout)
                validate_inventory(scene)
                result=validate_scene(scene)
                self.assertEqual(result["solid_collisions"],[])
                self.assertEqual(result["reserve_collisions"],[])
                self.assertEqual(result["sweep_collisions_with_1mm_margin"],[])

    def test_collision_is_not_silently_ignored(self):
        scene=copy.deepcopy(make_scene(LAYOUTS[1]))
        by_id={p["id"]:p for p in scene["parts"]}
        by_id["amp-0"]["center"]=by_id["battery"]["center"][:]
        self.assertIn(["battery","amp-0"],validate_scene(scene)["solid_collisions"])

    def test_clearance_margin(self):
        scene=LAYOUTS[0]
        a=part("a","A",[10,10,10],[0,0,0],"electronics")
        b=part("b","B",[10,10,10],[10.5,0,0],"electronics")
        self.assertFalse(overlap(a,b,scene,0))
        self.assertTrue(overlap(a,b,scene,0,margin=1))

    def test_rotated_box_does_not_use_only_axis_aligned_bounds(self):
        scene={"pivot":[0,0,0]}
        a=part("a","A",[2,20,2],[0,10,0],"display",moving=True)
        b=part("b","B",[1,1,1],[0,12,1],"electronics")
        self.assertFalse(overlap(a,b,scene,45))
        b["center"]=[0,7,7]
        self.assertTrue(overlap(a,b,scene,45))

    def test_pivot_transformation(self):
        scene={"pivot":[5,10,20]}
        a=part("a","A",[2,4,2],[0,2,0],"display",moving=True)
        vertices=world_vertices(a,scene,90)
        self.assertAlmostEqual(max(v[2] for v in vertices),24)
        self.assertAlmostEqual(min(v[1] for v in vertices),9)

    def test_baseline_comes_from_existing_parts(self):
        self.assertEqual(baseline()["base"],[110,160,35])


if __name__=="__main__":
    unittest.main()
