from functools import wraps
from time import time
from math import sqrt


def timing(f):
    @wraps(f)
    def wrap(*args, **kw):
        ts = time()
        result = f(*args, **kw)
        te = time()
        print ('func:%r args:[%r, %r] took: %2.4f sec').format(f.__name__, args, kw, te-ts)
        return result
    return wrap


class Point:

    def __init__(self, p_vals):
        self.x = p_vals["x"]
        self.y = p_vals["y"]

    def __repr__(self):
        return "".join(["Point(", str(self.x), ",", str(self.y), ")"])

    def distance_from_center(self):
        return sqrt((self.x - 0.5) ** 2 + (self.y - 0.5) ** 2)

    def distance_from_point(self, p2):
        return sqrt((self.x - p2.x) ** 2 + (self.y - p2.y) ** 2)


class ImageBoundingBox:
    def __init__(self, nv):
      
        self.points = [Point(ps) for ps in nv]
        self.distance = sum(map(lambda p: p.distance_from_center(), self.points)) + self.points[0].x + self.points[0].y
        self.center = Point({"x": (self.points[0].x + self.points[1].x) / 2, 
                             "y": (self.points[2].y + self.points[0].y) / 2})

    """
    def resize_on_bb(self):
        h_dim = self.points[0].distance_from_point(self.points[1]) # horizontal dimension
        v_dim = self.points[0].distance_from_point(self.points[2]) # vertical dimension

        if h_dim < CROP_SIZE[0]:
            extra = (CROP_SIZE[0] - h_dim) / 2
            self.points[0].x = max(self.points[0].x - extra, 0)
            self.points[0].x = max(self.points[0].x - extra, 0)

        if v_dim < CROP_SIZE[1]:
            extra = (CROP_SIZE[1] - v_dim) / 2
    """
