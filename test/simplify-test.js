var assert = require('assert'),
    api = require("../"),
    utils = api.utils;

describe("mapshaper-simplify.js", function() {

  describe("getSimplifyMethod()", function() {
    it ('"weighted" aliases to "weighted_visvalingam"', function() {
      assert.equal(api.internal.getSimplifyMethod({method: 'weighted'}), 'weighted_visvalingam');
    })
    it ('"visvalingam" aliases to "weighted_visvalingam" whem weighting param is present', function() {
      assert.equal(api.internal.getSimplifyMethod({method: 'visvalingam', weighting: 0.5}), 'weighted_visvalingam');
    })
    it ('"weighted_visvalingam" is default', function() {
      assert.equal(api.internal.getSimplifyMethod({}), 'weighted_visvalingam');
    })
  })


  describe('calcPlanarInterval()', function () {
    it('constrained by content width if content is relatively wide', function () {
      var interval = api.internal.calcPlanarInterval(100, 300, 2000, 1000);
      assert.equal(interval, 20);
    })
    it('constrained by content height if content is relatively tall', function () {
      var interval = api.internal.calcPlanarInterval(300, 100, 1000, 2000);
      assert.equal(interval, 20);
    })
    it('constrained by content width if height resolution is 0', function () {
      var interval = api.internal.calcPlanarInterval(100, 0, 2000, 1000);
      assert.equal(interval, 20);
    })
    it('constrained by content height if width resolution is 0', function () {
      var interval = api.internal.calcPlanarInterval(0, 100, 2000, 1000);
      assert.equal(interval, 10);
    })
  })

  describe('calcSphericalInterval()', function () {
    it('world layer uses length of equator in meters when width constrained', function () {
      var bounds = new api.internal.Bounds([-180,-90,180,90]);
      var interval = api.internal.calcSphericalInterval(1000, 1000, bounds);
      var target = api.geom.R * 2 * Math.PI / 1000;
      assert.equal(interval, target);
    })
    it('world layer uses length of meridian in meters when height constrained', function () {
      var bounds = new api.internal.Bounds([-180,-90,180,90]);
      var interval = api.internal.calcSphericalInterval(3000, 1000, bounds);
      var target = api.geom.R * Math.PI / 1000;
      assert.equal(interval, target);
    })
  })

  describe('parseSimplifyResolution()', function () {
    it('parse grid', function () {
      assert.deepEqual(api.internal.parseSimplifyResolution('100x200'), [100, 200]);
    })
    it('parse partial grid', function () {
      assert.deepEqual(api.internal.parseSimplifyResolution('x200'), [0, 200]);
      assert.deepEqual(api.internal.parseSimplifyResolution('100x'), [100, 0]);
    })
    it('accept number', function() {
      assert.deepEqual(api.internal.parseSimplifyResolution(1000), [1000, 1000]);
    })
    it('accept numeric string', function() {
      assert.deepEqual(api.internal.parseSimplifyResolution('1e4'), [10000, 10000]);
    })
    it('reject negative numbers', function() {
      assert.throws(function() {
        api.internal.parseSimplifyResolution('-200');
      });
      assert.throws(function() {
        api.internal.parseSimplifyResolution('-200x200');
      });
      assert.throws(function() {
        api.internal.parseSimplifyResolution('-200x');
      });
      assert.throws(function() {
        api.internal.parseSimplifyResolution('x-200');
      });
    })
  })

  describe('#protectWorldEdges()', function () {
    it('should set world edges equal to highest threshold in each arc', function () {
      var arcs = [[[178, 30], [179, 31], [180, 32], [180, 33]],
          [[-170, 1], [-180, 2], [-160, 2], [-160, 1]],
          [[2, 90], [3, 90], [3, 89], [2, 88]],
          [[3, -79], [4, -84], [3, -90], [4, -80]]];
      var thresholds = [[Infinity, 6, 4, Infinity], [Infinity, 5, 8, Infinity],
        [Infinity, 1, 4, Infinity], [Infinity, 5, 8, Infinity]];
      var data = new api.internal.ArcCollection(arcs).setThresholds(thresholds);
      api.internal.protectWorldEdges(data);

      var expected = [Infinity, 6, 6, Infinity, Infinity, 8, 8, Infinity, Infinity, 4, 4, Infinity, Infinity, 5, 8, Infinity];
      assert.deepEqual(utils.toArray(data.getVertexData().zz), expected);
    })

    it('should not modify arcs if internal vertices do not reach edge', function() {
      var arcs = [[[178, 30], [179, 31], [179.9, 32], [180, 33]],
          [[-180, 1], [-179.0, 2], [-160, 2], [-160, 1]],
          [[2, 90], [3, 89.9], [3, 89], [2, 88]],
          [[3, -79], [4, -84], [3, -89.2], [4, -90]]];
      var thresholds = [[Infinity, 6, 4, Infinity], [Infinity, 5, 8, Infinity],
        [Infinity, 1, 4, Infinity], [Infinity, 5, 8, Infinity]];
      var data = new api.internal.ArcCollection(arcs).setThresholds(thresholds);
      api.internal.protectWorldEdges(data);
      var expected = [Infinity, 6, 4, Infinity, Infinity, 5, 8, Infinity, Infinity, 1, 4, Infinity, Infinity, 5, 8, Infinity];
      assert.deepEqual(utils.toArray(data.getVertexData().zz), expected);
    })
  })
})
