// (c) Copyright 2016, Sean Connelly (@voidqk), http://syntheti.cc
// MIT License
// Project Home: https://github.com/voidqk/polybooljs

//
// provides the raw computation functions that takes epsilon into account
//
// zero is defined to be between (-epsilon, epsilon) exclusive
//

export class Epsilon {

	private eps: number;

	constructor(eps: number = 0.0000000001) {
		this.eps = eps;
	}

	epsilon(v?: number): number {
		if (typeof v === 'number')
			this.eps = v;
		return this.eps;
	}

	pointAboveOrOnLine(pt: Point, left: Point, right: Point): boolean {
		var Ax = left[0];
		var Ay = left[1];
		var Bx = right[0];
		var By = right[1];
		var Cx = pt[0];
		var Cy = pt[1];
		return (Bx - Ax) * (Cy - Ay) - (By - Ay) * (Cx - Ax) >= -this.eps;
	}

	pointBetween(p: Point, left: Point, right: Point): boolean {
		// p must be collinear with left->right
		// returns false if p == left, p == right, or left == right
		var d_py_ly = p[1] - left[1];
		var d_rx_lx = right[0] - left[0];
		var d_px_lx = p[0] - left[0];
		var d_ry_ly = right[1] - left[1];

		var dot = d_px_lx * d_rx_lx + d_py_ly * d_ry_ly;
		// if `dot` is 0, then `p` == `left` or `left` == `right` (reject)
		// if `dot` is less than 0, then `p` is to the left of `left` (reject)
		if (dot < this.eps)
			return false;

		var sqlen = d_rx_lx * d_rx_lx + d_ry_ly * d_ry_ly;
		// if `dot` > `sqlen`, then `p` is to the right of `right` (reject)
		// therefore, if `dot - sqlen` is greater than 0, then `p` is to the right of `right` (reject)
		if (dot - sqlen > -this.eps)
			return false;

		return true;
	}

	pointsSameX(p1: Point, p2: Point): boolean {
		return Math.abs(p1[0] - p2[0]) < this.eps;
	}

	pointsSameY(p1: Point, p2: Point): boolean {
		return Math.abs(p1[1] - p2[1]) < this.eps;
	}

	pointsSame(p1: Point, p2: Point): boolean {
		return this.pointsSameX(p1, p2) && this.pointsSameY(p1, p2);
	}

	pointsCompare(p1: Point, p2: Point): number {
		// returns -1 if p1 is smaller, 1 if p2 is smaller, 0 if equal
		if (this.pointsSameX(p1, p2))
			return this.pointsSameY(p1, p2) ? 0 : (p1[1] < p2[1] ? -1 : 1);
		return p1[0] < p2[0] ? -1 : 1;
	}

	pointsCollinear(pt1: Point, pt2: Point, pt3: Point): boolean {
		// does pt1->pt2->pt3 make a straight line?
		// essentially this is just checking to see if the slope(pt1->pt2) === slope(pt2->pt3)
		// if slopes are equal, then they must be collinear, because they share pt2
		var dx1 = pt1[0] - pt2[0];
		var dy1 = pt1[1] - pt2[1];
		var dx2 = pt2[0] - pt3[0];
		var dy2 = pt2[1] - pt3[1];
		return Math.abs(dx1 * dy2 - dx2 * dy1) < this.eps;
	}

	linesIntersect(a0: Point, a1: Point, b0: Point, b1: Point): ILinesIntersection {
		// returns false if the lines are coincident (e.g., parallel or on top of each other)
		//
		// returns an object if the lines intersect:
		//   {
		//     pt: [x, y],    where the intersection point is at
		//     alongA: where intersection point is along A,
		//     alongB: where intersection point is along B
		//   }
		//
		//  alongA and alongB will each be one of: -2, -1, 0, 1, 2
		//
		//  with the following meaning:
		//
		//    -2   intersection point is before segment's first point
		//    -1   intersection point is directly on segment's first point
		//     0   intersection point is between segment's first and second points (exclusive)
		//     1   intersection point is directly on segment's second point
		//     2   intersection point is after segment's second point
		var adx = a1[0] - a0[0];
		var ady = a1[1] - a0[1];
		var bdx = b1[0] - b0[0];
		var bdy = b1[1] - b0[1];

		var axb = adx * bdy - ady * bdx;
		if (Math.abs(axb) < this.eps)
			return null; // lines are coincident

		var dx = a0[0] - b0[0];
		var dy = a0[1] - b0[1];

		var A = (bdx * dy - bdy * dx) / axb;
		var B = (adx * dy - ady * dx) / axb;

		var ret = {
			alongA: 0,
			alongB: 0,
			pt: [
				a0[0] + A * adx,
				a0[1] + A * ady
			]
		};

		// categorize where intersection point is along A and B

		if (A <= -this.eps)
			ret.alongA = -2;
		else if (A < this.eps)
			ret.alongA = -1;
		else if (A - 1 <= -this.eps)
			ret.alongA = 0;
		else if (A - 1 < this.eps)
			ret.alongA = 1;
		else
			ret.alongA = 2;

		if (B <= -this.eps)
			ret.alongB = -2;
		else if (B < this.eps)
			ret.alongB = -1;
		else if (B - 1 <= -this.eps)
			ret.alongB = 0;
		else if (B - 1 < this.eps)
			ret.alongB = 1;
		else
			ret.alongB = 2;

		return ret;
	}

	pointInsideRegion(pt: Point, region: Region): boolean {
		var x = pt[0];
		var y = pt[1];
		var last_x = region[region.length - 1][0];
		var last_y = region[region.length - 1][1];
		var inside = false;
		for (var i = 0; i < region.length; i++){
			var curr_x = region[i][0];
			var curr_y = region[i][1];

			// if y is between curr_y and last_y, and
			// x is to the right of the boundary created by the line
			if ((curr_y - y > this.eps) != (last_y - y > this.eps) &&
				(last_x - curr_x) * (y - curr_y) / (last_y - curr_y) + curr_x - x > this.eps)
				inside = !inside

			last_x = curr_x;
			last_y = curr_y;
		}
		return inside;
	}

}
