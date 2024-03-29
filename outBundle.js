﻿(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.bundle = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = {
    along: require('@turf/along'),
    bearing: require('@turf/bearing'),
    distance: require('@turf/distance'),
    helpers: require('@turf/helpers'),
    nearestPointOnLine: require('@turf/nearest-point-on-line'),
    pointToLineDistance: require('@turf/point-to-line-distance'),
    GeoDataIntegration: require('geo-data-integration'),
    geojsonrbush: require('geojson-rbush')
}
},{"@turf/along":4,"@turf/bearing":6,"@turf/distance":8,"@turf/helpers":9,"@turf/nearest-point-on-line":14,"@turf/point-to-line-distance":15,"geo-data-integration":17,"geojson-rbush":46}],2:[function(require,module,exports){
function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

module.exports = _inheritsLoose;
},{}],3:[function(require,module,exports){
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

module.exports = _interopRequireDefault;
},{}],4:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
var bearing_1 = __importDefault(require("@turf/bearing"));
var destination_1 = __importDefault(require("@turf/destination"));
var distance_1 = __importDefault(require("@turf/distance"));
var helpers_1 = require("@turf/helpers");
var invariant_1 = require("@turf/invariant");
/**
 * Takes a {@link LineString} and returns a {@link Point} at a specified distance along the line.
 *
 * @name along
 * @param {Feature<LineString>} line input line
 * @param {number} distance distance along the line
 * @param {Object} [options] Optional parameters
 * @param {string} [options.units="kilometers"] can be degrees, radians, miles, or kilometers
 * @returns {Feature<Point>} Point `distance` `units` along the line
 * @example
 * var line = turf.lineString([[-83, 30], [-84, 36], [-78, 41]]);
 * var options = {units: 'miles'};
 *
 * var along = turf.along(line, 200, options);
 *
 * //addToMap
 * var addToMap = [along, line]
 */
function along(line, distance, options) {
    if (options === void 0) { options = {}; }
    // Get Coords
    var geom = invariant_1.getGeom(line);
    var coords = geom.coordinates;
    var travelled = 0;
    for (var i = 0; i < coords.length; i++) {
        if (distance >= travelled && i === coords.length - 1) {
            break;
        }
        else if (travelled >= distance) {
            var overshot = distance - travelled;
            if (!overshot) {
                return helpers_1.point(coords[i]);
            }
            else {
                var direction = bearing_1.default(coords[i], coords[i - 1]) - 180;
                var interpolated = destination_1.default(coords[i], overshot, direction, options);
                return interpolated;
            }
        }
        else {
            travelled += distance_1.default(coords[i], coords[i + 1], options);
        }
    }
    return helpers_1.point(coords[coords.length - 1]);
}
exports.default = along;

},{"@turf/bearing":6,"@turf/destination":7,"@turf/distance":8,"@turf/helpers":9,"@turf/invariant":10}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var meta_1 = require("@turf/meta");
/**
 * Takes a set of features, calculates the bbox of all input features, and returns a bounding box.
 *
 * @name bbox
 * @param {GeoJSON} geojson any GeoJSON object
 * @returns {BBox} bbox extent in [minX, minY, maxX, maxY] order
 * @example
 * var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]]);
 * var bbox = turf.bbox(line);
 * var bboxPolygon = turf.bboxPolygon(bbox);
 *
 * //addToMap
 * var addToMap = [line, bboxPolygon]
 */
function bbox(geojson) {
    var result = [Infinity, Infinity, -Infinity, -Infinity];
    meta_1.coordEach(geojson, function (coord) {
        if (result[0] > coord[0]) {
            result[0] = coord[0];
        }
        if (result[1] > coord[1]) {
            result[1] = coord[1];
        }
        if (result[2] < coord[0]) {
            result[2] = coord[0];
        }
        if (result[3] < coord[1]) {
            result[3] = coord[1];
        }
    });
    return result;
}
exports.default = bbox;

},{"@turf/meta":13}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("@turf/helpers");
var invariant_1 = require("@turf/invariant");
// http://en.wikipedia.org/wiki/Haversine_formula
// http://www.movable-type.co.uk/scripts/latlong.html
/**
 * Takes two {@link Point|points} and finds the geographic bearing between them,
 * i.e. the angle measured in degrees from the north line (0 degrees)
 *
 * @name bearing
 * @param {Coord} start starting Point
 * @param {Coord} end ending Point
 * @param {Object} [options={}] Optional parameters
 * @param {boolean} [options.final=false] calculates the final bearing if true
 * @returns {number} bearing in decimal degrees, between -180 and 180 degrees (positive clockwise)
 * @example
 * var point1 = turf.point([-75.343, 39.984]);
 * var point2 = turf.point([-75.534, 39.123]);
 *
 * var bearing = turf.bearing(point1, point2);
 *
 * //addToMap
 * var addToMap = [point1, point2]
 * point1.properties['marker-color'] = '#f00'
 * point2.properties['marker-color'] = '#0f0'
 * point1.properties.bearing = bearing
 */
function bearing(start, end, options) {
    if (options === void 0) { options = {}; }
    // Reverse calculation
    if (options.final === true) {
        return calculateFinalBearing(start, end);
    }
    var coordinates1 = invariant_1.getCoord(start);
    var coordinates2 = invariant_1.getCoord(end);
    var lon1 = helpers_1.degreesToRadians(coordinates1[0]);
    var lon2 = helpers_1.degreesToRadians(coordinates2[0]);
    var lat1 = helpers_1.degreesToRadians(coordinates1[1]);
    var lat2 = helpers_1.degreesToRadians(coordinates2[1]);
    var a = Math.sin(lon2 - lon1) * Math.cos(lat2);
    var b = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    return helpers_1.radiansToDegrees(Math.atan2(a, b));
}
/**
 * Calculates Final Bearing
 *
 * @private
 * @param {Coord} start starting Point
 * @param {Coord} end ending Point
 * @returns {number} bearing
 */
function calculateFinalBearing(start, end) {
    // Swap start & end
    var bear = bearing(end, start);
    bear = (bear + 180) % 360;
    return bear;
}
exports.default = bearing;

},{"@turf/helpers":9,"@turf/invariant":10}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// http://en.wikipedia.org/wiki/Haversine_formula
// http://www.movable-type.co.uk/scripts/latlong.html
var helpers_1 = require("@turf/helpers");
var invariant_1 = require("@turf/invariant");
/**
 * Takes a {@link Point} and calculates the location of a destination point given a distance in
 * degrees, radians, miles, or kilometers; and bearing in degrees.
 * This uses the [Haversine formula](http://en.wikipedia.org/wiki/Haversine_formula) to account for global curvature.
 *
 * @name destination
 * @param {Coord} origin starting point
 * @param {number} distance distance from the origin point
 * @param {number} bearing ranging from -180 to 180
 * @param {Object} [options={}] Optional parameters
 * @param {string} [options.units='kilometers'] miles, kilometers, degrees, or radians
 * @param {Object} [options.properties={}] Translate properties to Point
 * @returns {Feature<Point>} destination point
 * @example
 * var point = turf.point([-75.343, 39.984]);
 * var distance = 50;
 * var bearing = 90;
 * var options = {units: 'miles'};
 *
 * var destination = turf.destination(point, distance, bearing, options);
 *
 * //addToMap
 * var addToMap = [point, destination]
 * destination.properties['marker-color'] = '#f00';
 * point.properties['marker-color'] = '#0f0';
 */
function destination(origin, distance, bearing, options) {
    if (options === void 0) { options = {}; }
    // Handle input
    var coordinates1 = invariant_1.getCoord(origin);
    var longitude1 = helpers_1.degreesToRadians(coordinates1[0]);
    var latitude1 = helpers_1.degreesToRadians(coordinates1[1]);
    var bearingRad = helpers_1.degreesToRadians(bearing);
    var radians = helpers_1.lengthToRadians(distance, options.units);
    // Main
    var latitude2 = Math.asin(Math.sin(latitude1) * Math.cos(radians) +
        Math.cos(latitude1) * Math.sin(radians) * Math.cos(bearingRad));
    var longitude2 = longitude1 + Math.atan2(Math.sin(bearingRad) * Math.sin(radians) * Math.cos(latitude1), Math.cos(radians) - Math.sin(latitude1) * Math.sin(latitude2));
    var lng = helpers_1.radiansToDegrees(longitude2);
    var lat = helpers_1.radiansToDegrees(latitude2);
    return helpers_1.point([lng, lat], options.properties);
}
exports.default = destination;

},{"@turf/helpers":9,"@turf/invariant":10}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var invariant_1 = require("@turf/invariant");
var helpers_1 = require("@turf/helpers");
//http://en.wikipedia.org/wiki/Haversine_formula
//http://www.movable-type.co.uk/scripts/latlong.html
/**
 * Calculates the distance between two {@link Point|points} in degrees, radians, miles, or kilometers.
 * This uses the [Haversine formula](http://en.wikipedia.org/wiki/Haversine_formula) to account for global curvature.
 *
 * @name distance
 * @param {Coord} from origin point
 * @param {Coord} to destination point
 * @param {Object} [options={}] Optional parameters
 * @param {string} [options.units='kilometers'] can be degrees, radians, miles, or kilometers
 * @returns {number} distance between the two points
 * @example
 * var from = turf.point([-75.343, 39.984]);
 * var to = turf.point([-75.534, 39.123]);
 * var options = {units: 'miles'};
 *
 * var distance = turf.distance(from, to, options);
 *
 * //addToMap
 * var addToMap = [from, to];
 * from.properties.distance = distance;
 * to.properties.distance = distance;
 */
function distance(from, to, options) {
    if (options === void 0) { options = {}; }
    var coordinates1 = invariant_1.getCoord(from);
    var coordinates2 = invariant_1.getCoord(to);
    var dLat = helpers_1.degreesToRadians((coordinates2[1] - coordinates1[1]));
    var dLon = helpers_1.degreesToRadians((coordinates2[0] - coordinates1[0]));
    var lat1 = helpers_1.degreesToRadians(coordinates1[1]);
    var lat2 = helpers_1.degreesToRadians(coordinates2[1]);
    var a = Math.pow(Math.sin(dLat / 2), 2) +
        Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
    return helpers_1.radiansToLength(2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)), options.units);
}
exports.default = distance;

},{"@turf/helpers":9,"@turf/invariant":10}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module helpers
 */
/**
 * Earth Radius used with the Harvesine formula and approximates using a spherical (non-ellipsoid) Earth.
 *
 * @memberof helpers
 * @type {number}
 */
exports.earthRadius = 6371008.8;
/**
 * Unit of measurement factors using a spherical (non-ellipsoid) earth radius.
 *
 * @memberof helpers
 * @type {Object}
 */
exports.factors = {
    centimeters: exports.earthRadius * 100,
    centimetres: exports.earthRadius * 100,
    degrees: exports.earthRadius / 111325,
    feet: exports.earthRadius * 3.28084,
    inches: exports.earthRadius * 39.370,
    kilometers: exports.earthRadius / 1000,
    kilometres: exports.earthRadius / 1000,
    meters: exports.earthRadius,
    metres: exports.earthRadius,
    miles: exports.earthRadius / 1609.344,
    millimeters: exports.earthRadius * 1000,
    millimetres: exports.earthRadius * 1000,
    nauticalmiles: exports.earthRadius / 1852,
    radians: 1,
    yards: exports.earthRadius / 1.0936,
};
/**
 * Units of measurement factors based on 1 meter.
 *
 * @memberof helpers
 * @type {Object}
 */
exports.unitsFactors = {
    centimeters: 100,
    centimetres: 100,
    degrees: 1 / 111325,
    feet: 3.28084,
    inches: 39.370,
    kilometers: 1 / 1000,
    kilometres: 1 / 1000,
    meters: 1,
    metres: 1,
    miles: 1 / 1609.344,
    millimeters: 1000,
    millimetres: 1000,
    nauticalmiles: 1 / 1852,
    radians: 1 / exports.earthRadius,
    yards: 1 / 1.0936,
};
/**
 * Area of measurement factors based on 1 square meter.
 *
 * @memberof helpers
 * @type {Object}
 */
exports.areaFactors = {
    acres: 0.000247105,
    centimeters: 10000,
    centimetres: 10000,
    feet: 10.763910417,
    inches: 1550.003100006,
    kilometers: 0.000001,
    kilometres: 0.000001,
    meters: 1,
    metres: 1,
    miles: 3.86e-7,
    millimeters: 1000000,
    millimetres: 1000000,
    yards: 1.195990046,
};
/**
 * Wraps a GeoJSON {@link Geometry} in a GeoJSON {@link Feature}.
 *
 * @name feature
 * @param {Geometry} geometry input geometry
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature} a GeoJSON Feature
 * @example
 * var geometry = {
 *   "type": "Point",
 *   "coordinates": [110, 50]
 * };
 *
 * var feature = turf.feature(geometry);
 *
 * //=feature
 */
function feature(geom, properties, options) {
    if (options === void 0) { options = {}; }
    var feat = { type: "Feature" };
    if (options.id === 0 || options.id) {
        feat.id = options.id;
    }
    if (options.bbox) {
        feat.bbox = options.bbox;
    }
    feat.properties = properties || {};
    feat.geometry = geom;
    return feat;
}
exports.feature = feature;
/**
 * Creates a GeoJSON {@link Geometry} from a Geometry string type & coordinates.
 * For GeometryCollection type use `helpers.geometryCollection`
 *
 * @name geometry
 * @param {string} type Geometry Type
 * @param {Array<any>} coordinates Coordinates
 * @param {Object} [options={}] Optional Parameters
 * @returns {Geometry} a GeoJSON Geometry
 * @example
 * var type = "Point";
 * var coordinates = [110, 50];
 * var geometry = turf.geometry(type, coordinates);
 * // => geometry
 */
function geometry(type, coordinates, options) {
    if (options === void 0) { options = {}; }
    switch (type) {
        case "Point": return point(coordinates).geometry;
        case "LineString": return lineString(coordinates).geometry;
        case "Polygon": return polygon(coordinates).geometry;
        case "MultiPoint": return multiPoint(coordinates).geometry;
        case "MultiLineString": return multiLineString(coordinates).geometry;
        case "MultiPolygon": return multiPolygon(coordinates).geometry;
        default: throw new Error(type + " is invalid");
    }
}
exports.geometry = geometry;
/**
 * Creates a {@link Point} {@link Feature} from a Position.
 *
 * @name point
 * @param {Array<number>} coordinates longitude, latitude position (each in decimal degrees)
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<Point>} a Point feature
 * @example
 * var point = turf.point([-75.343, 39.984]);
 *
 * //=point
 */
function point(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    var geom = {
        type: "Point",
        coordinates: coordinates,
    };
    return feature(geom, properties, options);
}
exports.point = point;
/**
 * Creates a {@link Point} {@link FeatureCollection} from an Array of Point coordinates.
 *
 * @name points
 * @param {Array<Array<number>>} coordinates an array of Points
 * @param {Object} [properties={}] Translate these properties to each Feature
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north]
 * associated with the FeatureCollection
 * @param {string|number} [options.id] Identifier associated with the FeatureCollection
 * @returns {FeatureCollection<Point>} Point Feature
 * @example
 * var points = turf.points([
 *   [-75, 39],
 *   [-80, 45],
 *   [-78, 50]
 * ]);
 *
 * //=points
 */
function points(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    return featureCollection(coordinates.map(function (coords) {
        return point(coords, properties);
    }), options);
}
exports.points = points;
/**
 * Creates a {@link Polygon} {@link Feature} from an Array of LinearRings.
 *
 * @name polygon
 * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<Polygon>} Polygon Feature
 * @example
 * var polygon = turf.polygon([[[-5, 52], [-4, 56], [-2, 51], [-7, 54], [-5, 52]]], { name: 'poly1' });
 *
 * //=polygon
 */
function polygon(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    for (var _i = 0, coordinates_1 = coordinates; _i < coordinates_1.length; _i++) {
        var ring = coordinates_1[_i];
        if (ring.length < 4) {
            throw new Error("Each LinearRing of a Polygon must have 4 or more Positions.");
        }
        for (var j = 0; j < ring[ring.length - 1].length; j++) {
            // Check if first point of Polygon contains two numbers
            if (ring[ring.length - 1][j] !== ring[0][j]) {
                throw new Error("First and last Position are not equivalent.");
            }
        }
    }
    var geom = {
        type: "Polygon",
        coordinates: coordinates,
    };
    return feature(geom, properties, options);
}
exports.polygon = polygon;
/**
 * Creates a {@link Polygon} {@link FeatureCollection} from an Array of Polygon coordinates.
 *
 * @name polygons
 * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygon coordinates
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the FeatureCollection
 * @returns {FeatureCollection<Polygon>} Polygon FeatureCollection
 * @example
 * var polygons = turf.polygons([
 *   [[[-5, 52], [-4, 56], [-2, 51], [-7, 54], [-5, 52]]],
 *   [[[-15, 42], [-14, 46], [-12, 41], [-17, 44], [-15, 42]]],
 * ]);
 *
 * //=polygons
 */
function polygons(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    return featureCollection(coordinates.map(function (coords) {
        return polygon(coords, properties);
    }), options);
}
exports.polygons = polygons;
/**
 * Creates a {@link LineString} {@link Feature} from an Array of Positions.
 *
 * @name lineString
 * @param {Array<Array<number>>} coordinates an array of Positions
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<LineString>} LineString Feature
 * @example
 * var linestring1 = turf.lineString([[-24, 63], [-23, 60], [-25, 65], [-20, 69]], {name: 'line 1'});
 * var linestring2 = turf.lineString([[-14, 43], [-13, 40], [-15, 45], [-10, 49]], {name: 'line 2'});
 *
 * //=linestring1
 * //=linestring2
 */
function lineString(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    if (coordinates.length < 2) {
        throw new Error("coordinates must be an array of two or more positions");
    }
    var geom = {
        type: "LineString",
        coordinates: coordinates,
    };
    return feature(geom, properties, options);
}
exports.lineString = lineString;
/**
 * Creates a {@link LineString} {@link FeatureCollection} from an Array of LineString coordinates.
 *
 * @name lineStrings
 * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north]
 * associated with the FeatureCollection
 * @param {string|number} [options.id] Identifier associated with the FeatureCollection
 * @returns {FeatureCollection<LineString>} LineString FeatureCollection
 * @example
 * var linestrings = turf.lineStrings([
 *   [[-24, 63], [-23, 60], [-25, 65], [-20, 69]],
 *   [[-14, 43], [-13, 40], [-15, 45], [-10, 49]]
 * ]);
 *
 * //=linestrings
 */
function lineStrings(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    return featureCollection(coordinates.map(function (coords) {
        return lineString(coords, properties);
    }), options);
}
exports.lineStrings = lineStrings;
/**
 * Takes one or more {@link Feature|Features} and creates a {@link FeatureCollection}.
 *
 * @name featureCollection
 * @param {Feature[]} features input features
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {FeatureCollection} FeatureCollection of Features
 * @example
 * var locationA = turf.point([-75.343, 39.984], {name: 'Location A'});
 * var locationB = turf.point([-75.833, 39.284], {name: 'Location B'});
 * var locationC = turf.point([-75.534, 39.123], {name: 'Location C'});
 *
 * var collection = turf.featureCollection([
 *   locationA,
 *   locationB,
 *   locationC
 * ]);
 *
 * //=collection
 */
function featureCollection(features, options) {
    if (options === void 0) { options = {}; }
    var fc = { type: "FeatureCollection" };
    if (options.id) {
        fc.id = options.id;
    }
    if (options.bbox) {
        fc.bbox = options.bbox;
    }
    fc.features = features;
    return fc;
}
exports.featureCollection = featureCollection;
/**
 * Creates a {@link Feature<MultiLineString>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiLineString
 * @param {Array<Array<Array<number>>>} coordinates an array of LineStrings
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<MultiLineString>} a MultiLineString feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiLine = turf.multiLineString([[[0,0],[10,10]]]);
 *
 * //=multiLine
 */
function multiLineString(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    var geom = {
        type: "MultiLineString",
        coordinates: coordinates,
    };
    return feature(geom, properties, options);
}
exports.multiLineString = multiLineString;
/**
 * Creates a {@link Feature<MultiPoint>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiPoint
 * @param {Array<Array<number>>} coordinates an array of Positions
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<MultiPoint>} a MultiPoint feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiPt = turf.multiPoint([[0,0],[10,10]]);
 *
 * //=multiPt
 */
function multiPoint(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    var geom = {
        type: "MultiPoint",
        coordinates: coordinates,
    };
    return feature(geom, properties, options);
}
exports.multiPoint = multiPoint;
/**
 * Creates a {@link Feature<MultiPolygon>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiPolygon
 * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygons
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<MultiPolygon>} a multipolygon feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiPoly = turf.multiPolygon([[[[0,0],[0,10],[10,10],[10,0],[0,0]]]]);
 *
 * //=multiPoly
 *
 */
function multiPolygon(coordinates, properties, options) {
    if (options === void 0) { options = {}; }
    var geom = {
        type: "MultiPolygon",
        coordinates: coordinates,
    };
    return feature(geom, properties, options);
}
exports.multiPolygon = multiPolygon;
/**
 * Creates a {@link Feature<GeometryCollection>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name geometryCollection
 * @param {Array<Geometry>} geometries an array of GeoJSON Geometries
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<GeometryCollection>} a GeoJSON GeometryCollection Feature
 * @example
 * var pt = turf.geometry("Point", [100, 0]);
 * var line = turf.geometry("LineString", [[101, 0], [102, 1]]);
 * var collection = turf.geometryCollection([pt, line]);
 *
 * // => collection
 */
function geometryCollection(geometries, properties, options) {
    if (options === void 0) { options = {}; }
    var geom = {
        type: "GeometryCollection",
        geometries: geometries,
    };
    return feature(geom, properties, options);
}
exports.geometryCollection = geometryCollection;
/**
 * Round number to precision
 *
 * @param {number} num Number
 * @param {number} [precision=0] Precision
 * @returns {number} rounded number
 * @example
 * turf.round(120.4321)
 * //=120
 *
 * turf.round(120.4321, 2)
 * //=120.43
 */
function round(num, precision) {
    if (precision === void 0) { precision = 0; }
    if (precision && !(precision >= 0)) {
        throw new Error("precision must be a positive number");
    }
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(num * multiplier) / multiplier;
}
exports.round = round;
/**
 * Convert a distance measurement (assuming a spherical Earth) from radians to a more friendly unit.
 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
 *
 * @name radiansToLength
 * @param {number} radians in radians across the sphere
 * @param {string} [units="kilometers"] can be degrees, radians, miles, or kilometers inches, yards, metres,
 * meters, kilometres, kilometers.
 * @returns {number} distance
 */
function radiansToLength(radians, units) {
    if (units === void 0) { units = "kilometers"; }
    var factor = exports.factors[units];
    if (!factor) {
        throw new Error(units + " units is invalid");
    }
    return radians * factor;
}
exports.radiansToLength = radiansToLength;
/**
 * Convert a distance measurement (assuming a spherical Earth) from a real-world unit into radians
 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
 *
 * @name lengthToRadians
 * @param {number} distance in real units
 * @param {string} [units="kilometers"] can be degrees, radians, miles, or kilometers inches, yards, metres,
 * meters, kilometres, kilometers.
 * @returns {number} radians
 */
function lengthToRadians(distance, units) {
    if (units === void 0) { units = "kilometers"; }
    var factor = exports.factors[units];
    if (!factor) {
        throw new Error(units + " units is invalid");
    }
    return distance / factor;
}
exports.lengthToRadians = lengthToRadians;
/**
 * Convert a distance measurement (assuming a spherical Earth) from a real-world unit into degrees
 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, centimeters, kilometres, feet
 *
 * @name lengthToDegrees
 * @param {number} distance in real units
 * @param {string} [units="kilometers"] can be degrees, radians, miles, or kilometers inches, yards, metres,
 * meters, kilometres, kilometers.
 * @returns {number} degrees
 */
function lengthToDegrees(distance, units) {
    return radiansToDegrees(lengthToRadians(distance, units));
}
exports.lengthToDegrees = lengthToDegrees;
/**
 * Converts any bearing angle from the north line direction (positive clockwise)
 * and returns an angle between 0-360 degrees (positive clockwise), 0 being the north line
 *
 * @name bearingToAzimuth
 * @param {number} bearing angle, between -180 and +180 degrees
 * @returns {number} angle between 0 and 360 degrees
 */
function bearingToAzimuth(bearing) {
    var angle = bearing % 360;
    if (angle < 0) {
        angle += 360;
    }
    return angle;
}
exports.bearingToAzimuth = bearingToAzimuth;
/**
 * Converts an angle in radians to degrees
 *
 * @name radiansToDegrees
 * @param {number} radians angle in radians
 * @returns {number} degrees between 0 and 360 degrees
 */
function radiansToDegrees(radians) {
    var degrees = radians % (2 * Math.PI);
    return degrees * 180 / Math.PI;
}
exports.radiansToDegrees = radiansToDegrees;
/**
 * Converts an angle in degrees to radians
 *
 * @name degreesToRadians
 * @param {number} degrees angle between 0 and 360 degrees
 * @returns {number} angle in radians
 */
function degreesToRadians(degrees) {
    var radians = degrees % 360;
    return radians * Math.PI / 180;
}
exports.degreesToRadians = degreesToRadians;
/**
 * Converts a length to the requested unit.
 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
 *
 * @param {number} length to be converted
 * @param {Units} [originalUnit="kilometers"] of the length
 * @param {Units} [finalUnit="kilometers"] returned unit
 * @returns {number} the converted length
 */
function convertLength(length, originalUnit, finalUnit) {
    if (originalUnit === void 0) { originalUnit = "kilometers"; }
    if (finalUnit === void 0) { finalUnit = "kilometers"; }
    if (!(length >= 0)) {
        throw new Error("length must be a positive number");
    }
    return radiansToLength(lengthToRadians(length, originalUnit), finalUnit);
}
exports.convertLength = convertLength;
/**
 * Converts a area to the requested unit.
 * Valid units: kilometers, kilometres, meters, metres, centimetres, millimeters, acres, miles, yards, feet, inches
 * @param {number} area to be converted
 * @param {Units} [originalUnit="meters"] of the distance
 * @param {Units} [finalUnit="kilometers"] returned unit
 * @returns {number} the converted distance
 */
function convertArea(area, originalUnit, finalUnit) {
    if (originalUnit === void 0) { originalUnit = "meters"; }
    if (finalUnit === void 0) { finalUnit = "kilometers"; }
    if (!(area >= 0)) {
        throw new Error("area must be a positive number");
    }
    var startFactor = exports.areaFactors[originalUnit];
    if (!startFactor) {
        throw new Error("invalid original units");
    }
    var finalFactor = exports.areaFactors[finalUnit];
    if (!finalFactor) {
        throw new Error("invalid final units");
    }
    return (area / startFactor) * finalFactor;
}
exports.convertArea = convertArea;
/**
 * isNumber
 *
 * @param {*} num Number to validate
 * @returns {boolean} true/false
 * @example
 * turf.isNumber(123)
 * //=true
 * turf.isNumber('foo')
 * //=false
 */
function isNumber(num) {
    return !isNaN(num) && num !== null && !Array.isArray(num) && !/^\s*$/.test(num);
}
exports.isNumber = isNumber;
/**
 * isObject
 *
 * @param {*} input variable to validate
 * @returns {boolean} true/false
 * @example
 * turf.isObject({elevation: 10})
 * //=true
 * turf.isObject('foo')
 * //=false
 */
function isObject(input) {
    return (!!input) && (input.constructor === Object);
}
exports.isObject = isObject;
/**
 * Validate BBox
 *
 * @private
 * @param {Array<number>} bbox BBox to validate
 * @returns {void}
 * @throws Error if BBox is not valid
 * @example
 * validateBBox([-180, -40, 110, 50])
 * //=OK
 * validateBBox([-180, -40])
 * //=Error
 * validateBBox('Foo')
 * //=Error
 * validateBBox(5)
 * //=Error
 * validateBBox(null)
 * //=Error
 * validateBBox(undefined)
 * //=Error
 */
function validateBBox(bbox) {
    if (!bbox) {
        throw new Error("bbox is required");
    }
    if (!Array.isArray(bbox)) {
        throw new Error("bbox must be an Array");
    }
    if (bbox.length !== 4 && bbox.length !== 6) {
        throw new Error("bbox must be an Array of 4 or 6 numbers");
    }
    bbox.forEach(function (num) {
        if (!isNumber(num)) {
            throw new Error("bbox must only contain numbers");
        }
    });
}
exports.validateBBox = validateBBox;
/**
 * Validate Id
 *
 * @private
 * @param {string|number} id Id to validate
 * @returns {void}
 * @throws Error if Id is not valid
 * @example
 * validateId([-180, -40, 110, 50])
 * //=Error
 * validateId([-180, -40])
 * //=Error
 * validateId('Foo')
 * //=OK
 * validateId(5)
 * //=OK
 * validateId(null)
 * //=Error
 * validateId(undefined)
 * //=Error
 */
function validateId(id) {
    if (!id) {
        throw new Error("id is required");
    }
    if (["string", "number"].indexOf(typeof id) === -1) {
        throw new Error("id must be a number or a string");
    }
}
exports.validateId = validateId;
// Deprecated methods
function radians2degrees() {
    throw new Error("method has been renamed to `radiansToDegrees`");
}
exports.radians2degrees = radians2degrees;
function degrees2radians() {
    throw new Error("method has been renamed to `degreesToRadians`");
}
exports.degrees2radians = degrees2radians;
function distanceToDegrees() {
    throw new Error("method has been renamed to `lengthToDegrees`");
}
exports.distanceToDegrees = distanceToDegrees;
function distanceToRadians() {
    throw new Error("method has been renamed to `lengthToRadians`");
}
exports.distanceToRadians = distanceToRadians;
function radiansToDistance() {
    throw new Error("method has been renamed to `radiansToLength`");
}
exports.radiansToDistance = radiansToDistance;
function bearingToAngle() {
    throw new Error("method has been renamed to `bearingToAzimuth`");
}
exports.bearingToAngle = bearingToAngle;
function convertDistance() {
    throw new Error("method has been renamed to `convertLength`");
}
exports.convertDistance = convertDistance;

},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("@turf/helpers");
/**
 * Unwrap a coordinate from a Point Feature, Geometry or a single coordinate.
 *
 * @name getCoord
 * @param {Array<number>|Geometry<Point>|Feature<Point>} coord GeoJSON Point or an Array of numbers
 * @returns {Array<number>} coordinates
 * @example
 * var pt = turf.point([10, 10]);
 *
 * var coord = turf.getCoord(pt);
 * //= [10, 10]
 */
function getCoord(coord) {
    if (!coord) {
        throw new Error("coord is required");
    }
    if (!Array.isArray(coord)) {
        if (coord.type === "Feature" && coord.geometry !== null && coord.geometry.type === "Point") {
            return coord.geometry.coordinates;
        }
        if (coord.type === "Point") {
            return coord.coordinates;
        }
    }
    if (Array.isArray(coord) && coord.length >= 2 && !Array.isArray(coord[0]) && !Array.isArray(coord[1])) {
        return coord;
    }
    throw new Error("coord must be GeoJSON Point or an Array of numbers");
}
exports.getCoord = getCoord;
/**
 * Unwrap coordinates from a Feature, Geometry Object or an Array
 *
 * @name getCoords
 * @param {Array<any>|Geometry|Feature} coords Feature, Geometry Object or an Array
 * @returns {Array<any>} coordinates
 * @example
 * var poly = turf.polygon([[[119.32, -8.7], [119.55, -8.69], [119.51, -8.54], [119.32, -8.7]]]);
 *
 * var coords = turf.getCoords(poly);
 * //= [[[119.32, -8.7], [119.55, -8.69], [119.51, -8.54], [119.32, -8.7]]]
 */
function getCoords(coords) {
    if (Array.isArray(coords)) {
        return coords;
    }
    // Feature
    if (coords.type === "Feature") {
        if (coords.geometry !== null) {
            return coords.geometry.coordinates;
        }
    }
    else {
        // Geometry
        if (coords.coordinates) {
            return coords.coordinates;
        }
    }
    throw new Error("coords must be GeoJSON Feature, Geometry Object or an Array");
}
exports.getCoords = getCoords;
/**
 * Checks if coordinates contains a number
 *
 * @name containsNumber
 * @param {Array<any>} coordinates GeoJSON Coordinates
 * @returns {boolean} true if Array contains a number
 */
function containsNumber(coordinates) {
    if (coordinates.length > 1 && helpers_1.isNumber(coordinates[0]) && helpers_1.isNumber(coordinates[1])) {
        return true;
    }
    if (Array.isArray(coordinates[0]) && coordinates[0].length) {
        return containsNumber(coordinates[0]);
    }
    throw new Error("coordinates must only contain numbers");
}
exports.containsNumber = containsNumber;
/**
 * Enforce expectations about types of GeoJSON objects for Turf.
 *
 * @name geojsonType
 * @param {GeoJSON} value any GeoJSON object
 * @param {string} type expected GeoJSON type
 * @param {string} name name of calling function
 * @throws {Error} if value is not the expected type.
 */
function geojsonType(value, type, name) {
    if (!type || !name) {
        throw new Error("type and name required");
    }
    if (!value || value.type !== type) {
        throw new Error("Invalid input to " + name + ": must be a " + type + ", given " + value.type);
    }
}
exports.geojsonType = geojsonType;
/**
 * Enforce expectations about types of {@link Feature} inputs for Turf.
 * Internally this uses {@link geojsonType} to judge geometry types.
 *
 * @name featureOf
 * @param {Feature} feature a feature with an expected geometry type
 * @param {string} type expected GeoJSON type
 * @param {string} name name of calling function
 * @throws {Error} error if value is not the expected type.
 */
function featureOf(feature, type, name) {
    if (!feature) {
        throw new Error("No feature passed");
    }
    if (!name) {
        throw new Error(".featureOf() requires a name");
    }
    if (!feature || feature.type !== "Feature" || !feature.geometry) {
        throw new Error("Invalid input to " + name + ", Feature with geometry required");
    }
    if (!feature.geometry || feature.geometry.type !== type) {
        throw new Error("Invalid input to " + name + ": must be a " + type + ", given " + feature.geometry.type);
    }
}
exports.featureOf = featureOf;
/**
 * Enforce expectations about types of {@link FeatureCollection} inputs for Turf.
 * Internally this uses {@link geojsonType} to judge geometry types.
 *
 * @name collectionOf
 * @param {FeatureCollection} featureCollection a FeatureCollection for which features will be judged
 * @param {string} type expected GeoJSON type
 * @param {string} name name of calling function
 * @throws {Error} if value is not the expected type.
 */
function collectionOf(featureCollection, type, name) {
    if (!featureCollection) {
        throw new Error("No featureCollection passed");
    }
    if (!name) {
        throw new Error(".collectionOf() requires a name");
    }
    if (!featureCollection || featureCollection.type !== "FeatureCollection") {
        throw new Error("Invalid input to " + name + ", FeatureCollection required");
    }
    for (var _i = 0, _a = featureCollection.features; _i < _a.length; _i++) {
        var feature = _a[_i];
        if (!feature || feature.type !== "Feature" || !feature.geometry) {
            throw new Error("Invalid input to " + name + ", Feature with geometry required");
        }
        if (!feature.geometry || feature.geometry.type !== type) {
            throw new Error("Invalid input to " + name + ": must be a " + type + ", given " + feature.geometry.type);
        }
    }
}
exports.collectionOf = collectionOf;
/**
 * Get Geometry from Feature or Geometry Object
 *
 * @param {Feature|Geometry} geojson GeoJSON Feature or Geometry Object
 * @returns {Geometry|null} GeoJSON Geometry Object
 * @throws {Error} if geojson is not a Feature or Geometry Object
 * @example
 * var point = {
 *   "type": "Feature",
 *   "properties": {},
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [110, 40]
 *   }
 * }
 * var geom = turf.getGeom(point)
 * //={"type": "Point", "coordinates": [110, 40]}
 */
function getGeom(geojson) {
    if (geojson.type === "Feature") {
        return geojson.geometry;
    }
    return geojson;
}
exports.getGeom = getGeom;
/**
 * Get GeoJSON object's type, Geometry type is prioritize.
 *
 * @param {GeoJSON} geojson GeoJSON object
 * @param {string} [name="geojson"] name of the variable to display in error message
 * @returns {string} GeoJSON type
 * @example
 * var point = {
 *   "type": "Feature",
 *   "properties": {},
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [110, 40]
 *   }
 * }
 * var geom = turf.getType(point)
 * //="Point"
 */
function getType(geojson, name) {
    if (geojson.type === "FeatureCollection") {
        return "FeatureCollection";
    }
    if (geojson.type === "GeometryCollection") {
        return "GeometryCollection";
    }
    if (geojson.type === "Feature" && geojson.geometry !== null) {
        return geojson.geometry.type;
    }
    return geojson.type;
}
exports.getType = getType;

},{"@turf/helpers":9}],11:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("@turf/helpers");
var invariant_1 = require("@turf/invariant");
var line_segment_1 = __importDefault(require("@turf/line-segment"));
var meta_1 = require("@turf/meta");
var geojson_rbush_1 = __importDefault(require("geojson-rbush"));
/**
 * Takes any LineString or Polygon GeoJSON and returns the intersecting point(s).
 *
 * @name lineIntersect
 * @param {GeoJSON} line1 any LineString or Polygon
 * @param {GeoJSON} line2 any LineString or Polygon
 * @returns {FeatureCollection<Point>} point(s) that intersect both
 * @example
 * var line1 = turf.lineString([[126, -11], [129, -21]]);
 * var line2 = turf.lineString([[123, -18], [131, -14]]);
 * var intersects = turf.lineIntersect(line1, line2);
 *
 * //addToMap
 * var addToMap = [line1, line2, intersects]
 */
function lineIntersect(line1, line2) {
    var unique = {};
    var results = [];
    // First, normalize geometries to features
    // Then, handle simple 2-vertex segments
    if (line1.type === "LineString") {
        line1 = helpers_1.feature(line1);
    }
    if (line2.type === "LineString") {
        line2 = helpers_1.feature(line2);
    }
    if (line1.type === "Feature" &&
        line2.type === "Feature" &&
        line1.geometry !== null &&
        line2.geometry !== null &&
        line1.geometry.type === "LineString" &&
        line2.geometry.type === "LineString" &&
        line1.geometry.coordinates.length === 2 &&
        line2.geometry.coordinates.length === 2) {
        var intersect = intersects(line1, line2);
        if (intersect) {
            results.push(intersect);
        }
        return helpers_1.featureCollection(results);
    }
    // Handles complex GeoJSON Geometries
    var tree = geojson_rbush_1.default();
    tree.load(line_segment_1.default(line2));
    meta_1.featureEach(line_segment_1.default(line1), function (segment) {
        meta_1.featureEach(tree.search(segment), function (match) {
            var intersect = intersects(segment, match);
            if (intersect) {
                // prevent duplicate points https://github.com/Turfjs/turf/issues/688
                var key = invariant_1.getCoords(intersect).join(",");
                if (!unique[key]) {
                    unique[key] = true;
                    results.push(intersect);
                }
            }
        });
    });
    return helpers_1.featureCollection(results);
}
/**
 * Find a point that intersects LineStrings with two coordinates each
 *
 * @private
 * @param {Feature<LineString>} line1 GeoJSON LineString (Must only contain 2 coordinates)
 * @param {Feature<LineString>} line2 GeoJSON LineString (Must only contain 2 coordinates)
 * @returns {Feature<Point>} intersecting GeoJSON Point
 */
function intersects(line1, line2) {
    var coords1 = invariant_1.getCoords(line1);
    var coords2 = invariant_1.getCoords(line2);
    if (coords1.length !== 2) {
        throw new Error("<intersects> line1 must only contain 2 coordinates");
    }
    if (coords2.length !== 2) {
        throw new Error("<intersects> line2 must only contain 2 coordinates");
    }
    var x1 = coords1[0][0];
    var y1 = coords1[0][1];
    var x2 = coords1[1][0];
    var y2 = coords1[1][1];
    var x3 = coords2[0][0];
    var y3 = coords2[0][1];
    var x4 = coords2[1][0];
    var y4 = coords2[1][1];
    var denom = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
    var numeA = ((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3));
    var numeB = ((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3));
    if (denom === 0) {
        if (numeA === 0 && numeB === 0) {
            return null;
        }
        return null;
    }
    var uA = numeA / denom;
    var uB = numeB / denom;
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
        var x = x1 + (uA * (x2 - x1));
        var y = y1 + (uA * (y2 - y1));
        return helpers_1.point([x, y]);
    }
    return null;
}
exports.default = lineIntersect;

},{"@turf/helpers":9,"@turf/invariant":10,"@turf/line-segment":12,"@turf/meta":13,"geojson-rbush":46}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("@turf/helpers");
var invariant_1 = require("@turf/invariant");
var meta_1 = require("@turf/meta");
/**
 * Creates a {@link FeatureCollection} of 2-vertex {@link LineString} segments from a
 * {@link LineString|(Multi)LineString} or {@link Polygon|(Multi)Polygon}.
 *
 * @name lineSegment
 * @param {GeoJSON} geojson GeoJSON Polygon or LineString
 * @returns {FeatureCollection<LineString>} 2-vertex line segments
 * @example
 * var polygon = turf.polygon([[[-50, 5], [-40, -10], [-50, -10], [-40, 5], [-50, 5]]]);
 * var segments = turf.lineSegment(polygon);
 *
 * //addToMap
 * var addToMap = [polygon, segments]
 */
function lineSegment(geojson) {
    if (!geojson) {
        throw new Error("geojson is required");
    }
    var results = [];
    meta_1.flattenEach(geojson, function (feature) {
        lineSegmentFeature(feature, results);
    });
    return helpers_1.featureCollection(results);
}
/**
 * Line Segment
 *
 * @private
 * @param {Feature<LineString|Polygon>} geojson Line or polygon feature
 * @param {Array} results push to results
 * @returns {void}
 */
function lineSegmentFeature(geojson, results) {
    var coords = [];
    var geometry = geojson.geometry;
    if (geometry !== null) {
        switch (geometry.type) {
            case "Polygon":
                coords = invariant_1.getCoords(geometry);
                break;
            case "LineString":
                coords = [invariant_1.getCoords(geometry)];
        }
        coords.forEach(function (coord) {
            var segments = createSegments(coord, geojson.properties);
            segments.forEach(function (segment) {
                segment.id = results.length;
                results.push(segment);
            });
        });
    }
}
/**
 * Create Segments from LineString coordinates
 *
 * @private
 * @param {Array<Array<number>>} coords LineString coordinates
 * @param {*} properties GeoJSON properties
 * @returns {Array<Feature<LineString>>} line segments
 */
function createSegments(coords, properties) {
    var segments = [];
    coords.reduce(function (previousCoords, currentCoords) {
        var segment = helpers_1.lineString([previousCoords, currentCoords], properties);
        segment.bbox = bbox(previousCoords, currentCoords);
        segments.push(segment);
        return currentCoords;
    });
    return segments;
}
/**
 * Create BBox between two coordinates (faster than @turf/bbox)
 *
 * @private
 * @param {Array<number>} coords1 Point coordinate
 * @param {Array<number>} coords2 Point coordinate
 * @returns {BBox} [west, south, east, north]
 */
function bbox(coords1, coords2) {
    var x1 = coords1[0];
    var y1 = coords1[1];
    var x2 = coords2[0];
    var y2 = coords2[1];
    var west = (x1 < x2) ? x1 : x2;
    var south = (y1 < y2) ? y1 : y2;
    var east = (x1 > x2) ? x1 : x2;
    var north = (y1 > y2) ? y1 : y2;
    return [west, south, east, north];
}
exports.default = lineSegment;

},{"@turf/helpers":9,"@turf/invariant":10,"@turf/meta":13}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var helpers = require('@turf/helpers');

/**
 * Callback for coordEach
 *
 * @callback coordEachCallback
 * @param {Array<number>} currentCoord The current coordinate being processed.
 * @param {number} coordIndex The current index of the coordinate being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
 * @param {number} geometryIndex The current index of the Geometry being processed.
 */

/**
 * Iterate over coordinates in any GeoJSON object, similar to Array.forEach()
 *
 * @name coordEach
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentCoord, coordIndex, featureIndex, multiFeatureIndex)
 * @param {boolean} [excludeWrapCoord=false] whether or not to include the final coordinate of LinearRings that wraps the ring in its iteration.
 * @returns {void}
 * @example
 * var features = turf.featureCollection([
 *   turf.point([26, 37], {"foo": "bar"}),
 *   turf.point([36, 53], {"hello": "world"})
 * ]);
 *
 * turf.coordEach(features, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
 *   //=currentCoord
 *   //=coordIndex
 *   //=featureIndex
 *   //=multiFeatureIndex
 *   //=geometryIndex
 * });
 */
function coordEach(geojson, callback, excludeWrapCoord) {
    // Handles null Geometry -- Skips this GeoJSON
    if (geojson === null) return;
    var j, k, l, geometry, stopG, coords,
        geometryMaybeCollection,
        wrapShrink = 0,
        coordIndex = 0,
        isGeometryCollection,
        type = geojson.type,
        isFeatureCollection = type === 'FeatureCollection',
        isFeature = type === 'Feature',
        stop = isFeatureCollection ? geojson.features.length : 1;

    // This logic may look a little weird. The reason why it is that way
    // is because it's trying to be fast. GeoJSON supports multiple kinds
    // of objects at its root: FeatureCollection, Features, Geometries.
    // This function has the responsibility of handling all of them, and that
    // means that some of the `for` loops you see below actually just don't apply
    // to certain inputs. For instance, if you give this just a
    // Point geometry, then both loops are short-circuited and all we do
    // is gradually rename the input until it's called 'geometry'.
    //
    // This also aims to allocate as few resources as possible: just a
    // few numbers and booleans, rather than any temporary arrays as would
    // be required with the normalization approach.
    for (var featureIndex = 0; featureIndex < stop; featureIndex++) {
        geometryMaybeCollection = (isFeatureCollection ? geojson.features[featureIndex].geometry :
            (isFeature ? geojson.geometry : geojson));
        isGeometryCollection = (geometryMaybeCollection) ? geometryMaybeCollection.type === 'GeometryCollection' : false;
        stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

        for (var geomIndex = 0; geomIndex < stopG; geomIndex++) {
            var multiFeatureIndex = 0;
            var geometryIndex = 0;
            geometry = isGeometryCollection ?
                geometryMaybeCollection.geometries[geomIndex] : geometryMaybeCollection;

            // Handles null Geometry -- Skips this geometry
            if (geometry === null) continue;
            coords = geometry.coordinates;
            var geomType = geometry.type;

            wrapShrink = (excludeWrapCoord && (geomType === 'Polygon' || geomType === 'MultiPolygon')) ? 1 : 0;

            switch (geomType) {
            case null:
                break;
            case 'Point':
                if (callback(coords, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
                coordIndex++;
                multiFeatureIndex++;
                break;
            case 'LineString':
            case 'MultiPoint':
                for (j = 0; j < coords.length; j++) {
                    if (callback(coords[j], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
                    coordIndex++;
                    if (geomType === 'MultiPoint') multiFeatureIndex++;
                }
                if (geomType === 'LineString') multiFeatureIndex++;
                break;
            case 'Polygon':
            case 'MultiLineString':
                for (j = 0; j < coords.length; j++) {
                    for (k = 0; k < coords[j].length - wrapShrink; k++) {
                        if (callback(coords[j][k], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
                        coordIndex++;
                    }
                    if (geomType === 'MultiLineString') multiFeatureIndex++;
                    if (geomType === 'Polygon') geometryIndex++;
                }
                if (geomType === 'Polygon') multiFeatureIndex++;
                break;
            case 'MultiPolygon':
                for (j = 0; j < coords.length; j++) {
                    geometryIndex = 0;
                    for (k = 0; k < coords[j].length; k++) {
                        for (l = 0; l < coords[j][k].length - wrapShrink; l++) {
                            if (callback(coords[j][k][l], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
                            coordIndex++;
                        }
                        geometryIndex++;
                    }
                    multiFeatureIndex++;
                }
                break;
            case 'GeometryCollection':
                for (j = 0; j < geometry.geometries.length; j++)
                    if (coordEach(geometry.geometries[j], callback, excludeWrapCoord) === false) return false;
                break;
            default:
                throw new Error('Unknown Geometry Type');
            }
        }
    }
}

/**
 * Callback for coordReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback coordReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Array<number>} currentCoord The current coordinate being processed.
 * @param {number} coordIndex The current index of the coordinate being processed.
 * Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
 * @param {number} geometryIndex The current index of the Geometry being processed.
 */

/**
 * Reduce coordinates in any GeoJSON object, similar to Array.reduce()
 *
 * @name coordReduce
 * @param {FeatureCollection|Geometry|Feature} geojson any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentCoord, coordIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @param {boolean} [excludeWrapCoord=false] whether or not to include the final coordinate of LinearRings that wraps the ring in its iteration.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = turf.featureCollection([
 *   turf.point([26, 37], {"foo": "bar"}),
 *   turf.point([36, 53], {"hello": "world"})
 * ]);
 *
 * turf.coordReduce(features, function (previousValue, currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
 *   //=previousValue
 *   //=currentCoord
 *   //=coordIndex
 *   //=featureIndex
 *   //=multiFeatureIndex
 *   //=geometryIndex
 *   return currentCoord;
 * });
 */
function coordReduce(geojson, callback, initialValue, excludeWrapCoord) {
    var previousValue = initialValue;
    coordEach(geojson, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
        if (coordIndex === 0 && initialValue === undefined) previousValue = currentCoord;
        else previousValue = callback(previousValue, currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex);
    }, excludeWrapCoord);
    return previousValue;
}

/**
 * Callback for propEach
 *
 * @callback propEachCallback
 * @param {Object} currentProperties The current Properties being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 */

/**
 * Iterate over properties in any GeoJSON object, similar to Array.forEach()
 *
 * @name propEach
 * @param {FeatureCollection|Feature} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentProperties, featureIndex)
 * @returns {void}
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * turf.propEach(features, function (currentProperties, featureIndex) {
 *   //=currentProperties
 *   //=featureIndex
 * });
 */
function propEach(geojson, callback) {
    var i;
    switch (geojson.type) {
    case 'FeatureCollection':
        for (i = 0; i < geojson.features.length; i++) {
            if (callback(geojson.features[i].properties, i) === false) break;
        }
        break;
    case 'Feature':
        callback(geojson.properties, 0);
        break;
    }
}


/**
 * Callback for propReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback propReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {*} currentProperties The current Properties being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 */

/**
 * Reduce properties in any GeoJSON object into a single value,
 * similar to how Array.reduce works. However, in this case we lazily run
 * the reduction, so an array of all properties is unnecessary.
 *
 * @name propReduce
 * @param {FeatureCollection|Feature} geojson any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentProperties, featureIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * turf.propReduce(features, function (previousValue, currentProperties, featureIndex) {
 *   //=previousValue
 *   //=currentProperties
 *   //=featureIndex
 *   return currentProperties
 * });
 */
function propReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    propEach(geojson, function (currentProperties, featureIndex) {
        if (featureIndex === 0 && initialValue === undefined) previousValue = currentProperties;
        else previousValue = callback(previousValue, currentProperties, featureIndex);
    });
    return previousValue;
}

/**
 * Callback for featureEach
 *
 * @callback featureEachCallback
 * @param {Feature<any>} currentFeature The current Feature being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 */

/**
 * Iterate over features in any GeoJSON object, similar to
 * Array.forEach.
 *
 * @name featureEach
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentFeature, featureIndex)
 * @returns {void}
 * @example
 * var features = turf.featureCollection([
 *   turf.point([26, 37], {foo: 'bar'}),
 *   turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * turf.featureEach(features, function (currentFeature, featureIndex) {
 *   //=currentFeature
 *   //=featureIndex
 * });
 */
function featureEach(geojson, callback) {
    if (geojson.type === 'Feature') {
        callback(geojson, 0);
    } else if (geojson.type === 'FeatureCollection') {
        for (var i = 0; i < geojson.features.length; i++) {
            if (callback(geojson.features[i], i) === false) break;
        }
    }
}

/**
 * Callback for featureReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback featureReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Feature} currentFeature The current Feature being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 */

/**
 * Reduce features in any GeoJSON object, similar to Array.reduce().
 *
 * @name featureReduce
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentFeature, featureIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = turf.featureCollection([
 *   turf.point([26, 37], {"foo": "bar"}),
 *   turf.point([36, 53], {"hello": "world"})
 * ]);
 *
 * turf.featureReduce(features, function (previousValue, currentFeature, featureIndex) {
 *   //=previousValue
 *   //=currentFeature
 *   //=featureIndex
 *   return currentFeature
 * });
 */
function featureReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    featureEach(geojson, function (currentFeature, featureIndex) {
        if (featureIndex === 0 && initialValue === undefined) previousValue = currentFeature;
        else previousValue = callback(previousValue, currentFeature, featureIndex);
    });
    return previousValue;
}

/**
 * Get all coordinates from any GeoJSON object.
 *
 * @name coordAll
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @returns {Array<Array<number>>} coordinate position array
 * @example
 * var features = turf.featureCollection([
 *   turf.point([26, 37], {foo: 'bar'}),
 *   turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * var coords = turf.coordAll(features);
 * //= [[26, 37], [36, 53]]
 */
function coordAll(geojson) {
    var coords = [];
    coordEach(geojson, function (coord) {
        coords.push(coord);
    });
    return coords;
}

/**
 * Callback for geomEach
 *
 * @callback geomEachCallback
 * @param {Geometry} currentGeometry The current Geometry being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {Object} featureProperties The current Feature Properties being processed.
 * @param {Array<number>} featureBBox The current Feature BBox being processed.
 * @param {number|string} featureId The current Feature Id being processed.
 */

/**
 * Iterate over each geometry in any GeoJSON object, similar to Array.forEach()
 *
 * @name geomEach
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentGeometry, featureIndex, featureProperties, featureBBox, featureId)
 * @returns {void}
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * turf.geomEach(features, function (currentGeometry, featureIndex, featureProperties, featureBBox, featureId) {
 *   //=currentGeometry
 *   //=featureIndex
 *   //=featureProperties
 *   //=featureBBox
 *   //=featureId
 * });
 */
function geomEach(geojson, callback) {
    var i, j, g, geometry, stopG,
        geometryMaybeCollection,
        isGeometryCollection,
        featureProperties,
        featureBBox,
        featureId,
        featureIndex = 0,
        isFeatureCollection = geojson.type === 'FeatureCollection',
        isFeature = geojson.type === 'Feature',
        stop = isFeatureCollection ? geojson.features.length : 1;

    // This logic may look a little weird. The reason why it is that way
    // is because it's trying to be fast. GeoJSON supports multiple kinds
    // of objects at its root: FeatureCollection, Features, Geometries.
    // This function has the responsibility of handling all of them, and that
    // means that some of the `for` loops you see below actually just don't apply
    // to certain inputs. For instance, if you give this just a
    // Point geometry, then both loops are short-circuited and all we do
    // is gradually rename the input until it's called 'geometry'.
    //
    // This also aims to allocate as few resources as possible: just a
    // few numbers and booleans, rather than any temporary arrays as would
    // be required with the normalization approach.
    for (i = 0; i < stop; i++) {

        geometryMaybeCollection = (isFeatureCollection ? geojson.features[i].geometry :
            (isFeature ? geojson.geometry : geojson));
        featureProperties = (isFeatureCollection ? geojson.features[i].properties :
            (isFeature ? geojson.properties : {}));
        featureBBox = (isFeatureCollection ? geojson.features[i].bbox :
            (isFeature ? geojson.bbox : undefined));
        featureId = (isFeatureCollection ? geojson.features[i].id :
            (isFeature ? geojson.id : undefined));
        isGeometryCollection = (geometryMaybeCollection) ? geometryMaybeCollection.type === 'GeometryCollection' : false;
        stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

        for (g = 0; g < stopG; g++) {
            geometry = isGeometryCollection ?
                geometryMaybeCollection.geometries[g] : geometryMaybeCollection;

            // Handle null Geometry
            if (geometry === null) {
                if (callback(null, featureIndex, featureProperties, featureBBox, featureId) === false) return false;
                continue;
            }
            switch (geometry.type) {
            case 'Point':
            case 'LineString':
            case 'MultiPoint':
            case 'Polygon':
            case 'MultiLineString':
            case 'MultiPolygon': {
                if (callback(geometry, featureIndex, featureProperties, featureBBox, featureId) === false) return false;
                break;
            }
            case 'GeometryCollection': {
                for (j = 0; j < geometry.geometries.length; j++) {
                    if (callback(geometry.geometries[j], featureIndex, featureProperties, featureBBox, featureId) === false) return false;
                }
                break;
            }
            default:
                throw new Error('Unknown Geometry Type');
            }
        }
        // Only increase `featureIndex` per each feature
        featureIndex++;
    }
}

/**
 * Callback for geomReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback geomReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Geometry} currentGeometry The current Geometry being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {Object} featureProperties The current Feature Properties being processed.
 * @param {Array<number>} featureBBox The current Feature BBox being processed.
 * @param {number|string} featureId The current Feature Id being processed.
 */

/**
 * Reduce geometry in any GeoJSON object, similar to Array.reduce().
 *
 * @name geomReduce
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentGeometry, featureIndex, featureProperties, featureBBox, featureId)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * turf.geomReduce(features, function (previousValue, currentGeometry, featureIndex, featureProperties, featureBBox, featureId) {
 *   //=previousValue
 *   //=currentGeometry
 *   //=featureIndex
 *   //=featureProperties
 *   //=featureBBox
 *   //=featureId
 *   return currentGeometry
 * });
 */
function geomReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    geomEach(geojson, function (currentGeometry, featureIndex, featureProperties, featureBBox, featureId) {
        if (featureIndex === 0 && initialValue === undefined) previousValue = currentGeometry;
        else previousValue = callback(previousValue, currentGeometry, featureIndex, featureProperties, featureBBox, featureId);
    });
    return previousValue;
}

/**
 * Callback for flattenEach
 *
 * @callback flattenEachCallback
 * @param {Feature} currentFeature The current flattened feature being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
 */

/**
 * Iterate over flattened features in any GeoJSON object, similar to
 * Array.forEach.
 *
 * @name flattenEach
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentFeature, featureIndex, multiFeatureIndex)
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.multiPoint([[40, 30], [36, 53]], {hello: 'world'})
 * ]);
 *
 * turf.flattenEach(features, function (currentFeature, featureIndex, multiFeatureIndex) {
 *   //=currentFeature
 *   //=featureIndex
 *   //=multiFeatureIndex
 * });
 */
function flattenEach(geojson, callback) {
    geomEach(geojson, function (geometry, featureIndex, properties, bbox, id) {
        // Callback for single geometry
        var type = (geometry === null) ? null : geometry.type;
        switch (type) {
        case null:
        case 'Point':
        case 'LineString':
        case 'Polygon':
            if (callback(helpers.feature(geometry, properties, {bbox: bbox, id: id}), featureIndex, 0) === false) return false;
            return;
        }

        var geomType;

        // Callback for multi-geometry
        switch (type) {
        case 'MultiPoint':
            geomType = 'Point';
            break;
        case 'MultiLineString':
            geomType = 'LineString';
            break;
        case 'MultiPolygon':
            geomType = 'Polygon';
            break;
        }

        for (var multiFeatureIndex = 0; multiFeatureIndex < geometry.coordinates.length; multiFeatureIndex++) {
            var coordinate = geometry.coordinates[multiFeatureIndex];
            var geom = {
                type: geomType,
                coordinates: coordinate
            };
            if (callback(helpers.feature(geom, properties), featureIndex, multiFeatureIndex) === false) return false;
        }
    });
}

/**
 * Callback for flattenReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback flattenReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Feature} currentFeature The current Feature being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
 */

/**
 * Reduce flattened features in any GeoJSON object, similar to Array.reduce().
 *
 * @name flattenReduce
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentFeature, featureIndex, multiFeatureIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.multiPoint([[40, 30], [36, 53]], {hello: 'world'})
 * ]);
 *
 * turf.flattenReduce(features, function (previousValue, currentFeature, featureIndex, multiFeatureIndex) {
 *   //=previousValue
 *   //=currentFeature
 *   //=featureIndex
 *   //=multiFeatureIndex
 *   return currentFeature
 * });
 */
function flattenReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    flattenEach(geojson, function (currentFeature, featureIndex, multiFeatureIndex) {
        if (featureIndex === 0 && multiFeatureIndex === 0 && initialValue === undefined) previousValue = currentFeature;
        else previousValue = callback(previousValue, currentFeature, featureIndex, multiFeatureIndex);
    });
    return previousValue;
}

/**
 * Callback for segmentEach
 *
 * @callback segmentEachCallback
 * @param {Feature<LineString>} currentSegment The current Segment being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
 * @param {number} geometryIndex The current index of the Geometry being processed.
 * @param {number} segmentIndex The current index of the Segment being processed.
 * @returns {void}
 */

/**
 * Iterate over 2-vertex line segment in any GeoJSON object, similar to Array.forEach()
 * (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
 *
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON
 * @param {Function} callback a method that takes (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex)
 * @returns {void}
 * @example
 * var polygon = turf.polygon([[[-50, 5], [-40, -10], [-50, -10], [-40, 5], [-50, 5]]]);
 *
 * // Iterate over GeoJSON by 2-vertex segments
 * turf.segmentEach(polygon, function (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
 *   //=currentSegment
 *   //=featureIndex
 *   //=multiFeatureIndex
 *   //=geometryIndex
 *   //=segmentIndex
 * });
 *
 * // Calculate the total number of segments
 * var total = 0;
 * turf.segmentEach(polygon, function () {
 *     total++;
 * });
 */
function segmentEach(geojson, callback) {
    flattenEach(geojson, function (feature, featureIndex, multiFeatureIndex) {
        var segmentIndex = 0;

        // Exclude null Geometries
        if (!feature.geometry) return;
        // (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
        var type = feature.geometry.type;
        if (type === 'Point' || type === 'MultiPoint') return;

        // Generate 2-vertex line segments
        var previousCoords;
        var previousFeatureIndex = 0;
        var previousMultiIndex = 0;
        var prevGeomIndex = 0;
        if (coordEach(feature, function (currentCoord, coordIndex, featureIndexCoord, multiPartIndexCoord, geometryIndex) {
            // Simulating a meta.coordReduce() since `reduce` operations cannot be stopped by returning `false`
            if (previousCoords === undefined || featureIndex > previousFeatureIndex || multiPartIndexCoord > previousMultiIndex || geometryIndex > prevGeomIndex) {
                previousCoords = currentCoord;
                previousFeatureIndex = featureIndex;
                previousMultiIndex = multiPartIndexCoord;
                prevGeomIndex = geometryIndex;
                segmentIndex = 0;
                return;
            }
            var currentSegment = helpers.lineString([previousCoords, currentCoord], feature.properties);
            if (callback(currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) === false) return false;
            segmentIndex++;
            previousCoords = currentCoord;
        }) === false) return false;
    });
}

/**
 * Callback for segmentReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback segmentReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Feature<LineString>} currentSegment The current Segment being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
 * @param {number} geometryIndex The current index of the Geometry being processed.
 * @param {number} segmentIndex The current index of the Segment being processed.
 */

/**
 * Reduce 2-vertex line segment in any GeoJSON object, similar to Array.reduce()
 * (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
 *
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON
 * @param {Function} callback a method that takes (previousValue, currentSegment, currentIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {void}
 * @example
 * var polygon = turf.polygon([[[-50, 5], [-40, -10], [-50, -10], [-40, 5], [-50, 5]]]);
 *
 * // Iterate over GeoJSON by 2-vertex segments
 * turf.segmentReduce(polygon, function (previousSegment, currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
 *   //= previousSegment
 *   //= currentSegment
 *   //= featureIndex
 *   //= multiFeatureIndex
 *   //= geometryIndex
 *   //= segmentInex
 *   return currentSegment
 * });
 *
 * // Calculate the total number of segments
 * var initialValue = 0
 * var total = turf.segmentReduce(polygon, function (previousValue) {
 *     previousValue++;
 *     return previousValue;
 * }, initialValue);
 */
function segmentReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    var started = false;
    segmentEach(geojson, function (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
        if (started === false && initialValue === undefined) previousValue = currentSegment;
        else previousValue = callback(previousValue, currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex);
        started = true;
    });
    return previousValue;
}

/**
 * Callback for lineEach
 *
 * @callback lineEachCallback
 * @param {Feature<LineString>} currentLine The current LineString|LinearRing being processed
 * @param {number} featureIndex The current index of the Feature being processed
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed
 * @param {number} geometryIndex The current index of the Geometry being processed
 */

/**
 * Iterate over line or ring coordinates in LineString, Polygon, MultiLineString, MultiPolygon Features or Geometries,
 * similar to Array.forEach.
 *
 * @name lineEach
 * @param {Geometry|Feature<LineString|Polygon|MultiLineString|MultiPolygon>} geojson object
 * @param {Function} callback a method that takes (currentLine, featureIndex, multiFeatureIndex, geometryIndex)
 * @example
 * var multiLine = turf.multiLineString([
 *   [[26, 37], [35, 45]],
 *   [[36, 53], [38, 50], [41, 55]]
 * ]);
 *
 * turf.lineEach(multiLine, function (currentLine, featureIndex, multiFeatureIndex, geometryIndex) {
 *   //=currentLine
 *   //=featureIndex
 *   //=multiFeatureIndex
 *   //=geometryIndex
 * });
 */
function lineEach(geojson, callback) {
    // validation
    if (!geojson) throw new Error('geojson is required');

    flattenEach(geojson, function (feature, featureIndex, multiFeatureIndex) {
        if (feature.geometry === null) return;
        var type = feature.geometry.type;
        var coords = feature.geometry.coordinates;
        switch (type) {
        case 'LineString':
            if (callback(feature, featureIndex, multiFeatureIndex, 0, 0) === false) return false;
            break;
        case 'Polygon':
            for (var geometryIndex = 0; geometryIndex < coords.length; geometryIndex++) {
                if (callback(helpers.lineString(coords[geometryIndex], feature.properties), featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
            }
            break;
        }
    });
}

/**
 * Callback for lineReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback lineReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Feature<LineString>} currentLine The current LineString|LinearRing being processed.
 * @param {number} featureIndex The current index of the Feature being processed
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed
 * @param {number} geometryIndex The current index of the Geometry being processed
 */

/**
 * Reduce features in any GeoJSON object, similar to Array.reduce().
 *
 * @name lineReduce
 * @param {Geometry|Feature<LineString|Polygon|MultiLineString|MultiPolygon>} geojson object
 * @param {Function} callback a method that takes (previousValue, currentLine, featureIndex, multiFeatureIndex, geometryIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var multiPoly = turf.multiPolygon([
 *   turf.polygon([[[12,48],[2,41],[24,38],[12,48]], [[9,44],[13,41],[13,45],[9,44]]]),
 *   turf.polygon([[[5, 5], [0, 0], [2, 2], [4, 4], [5, 5]]])
 * ]);
 *
 * turf.lineReduce(multiPoly, function (previousValue, currentLine, featureIndex, multiFeatureIndex, geometryIndex) {
 *   //=previousValue
 *   //=currentLine
 *   //=featureIndex
 *   //=multiFeatureIndex
 *   //=geometryIndex
 *   return currentLine
 * });
 */
function lineReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    lineEach(geojson, function (currentLine, featureIndex, multiFeatureIndex, geometryIndex) {
        if (featureIndex === 0 && initialValue === undefined) previousValue = currentLine;
        else previousValue = callback(previousValue, currentLine, featureIndex, multiFeatureIndex, geometryIndex);
    });
    return previousValue;
}

/**
 * Finds a particular 2-vertex LineString Segment from a GeoJSON using `@turf/meta` indexes.
 *
 * Negative indexes are permitted.
 * Point & MultiPoint will always return null.
 *
 * @param {FeatureCollection|Feature|Geometry} geojson Any GeoJSON Feature or Geometry
 * @param {Object} [options={}] Optional parameters
 * @param {number} [options.featureIndex=0] Feature Index
 * @param {number} [options.multiFeatureIndex=0] Multi-Feature Index
 * @param {number} [options.geometryIndex=0] Geometry Index
 * @param {number} [options.segmentIndex=0] Segment Index
 * @param {Object} [options.properties={}] Translate Properties to output LineString
 * @param {BBox} [options.bbox={}] Translate BBox to output LineString
 * @param {number|string} [options.id={}] Translate Id to output LineString
 * @returns {Feature<LineString>} 2-vertex GeoJSON Feature LineString
 * @example
 * var multiLine = turf.multiLineString([
 *     [[10, 10], [50, 30], [30, 40]],
 *     [[-10, -10], [-50, -30], [-30, -40]]
 * ]);
 *
 * // First Segment (defaults are 0)
 * turf.findSegment(multiLine);
 * // => Feature<LineString<[[10, 10], [50, 30]]>>
 *
 * // First Segment of 2nd Multi Feature
 * turf.findSegment(multiLine, {multiFeatureIndex: 1});
 * // => Feature<LineString<[[-10, -10], [-50, -30]]>>
 *
 * // Last Segment of Last Multi Feature
 * turf.findSegment(multiLine, {multiFeatureIndex: -1, segmentIndex: -1});
 * // => Feature<LineString<[[-50, -30], [-30, -40]]>>
 */
function findSegment(geojson, options) {
    // Optional Parameters
    options = options || {};
    if (!helpers.isObject(options)) throw new Error('options is invalid');
    var featureIndex = options.featureIndex || 0;
    var multiFeatureIndex = options.multiFeatureIndex || 0;
    var geometryIndex = options.geometryIndex || 0;
    var segmentIndex = options.segmentIndex || 0;

    // Find FeatureIndex
    var properties = options.properties;
    var geometry;

    switch (geojson.type) {
    case 'FeatureCollection':
        if (featureIndex < 0) featureIndex = geojson.features.length + featureIndex;
        properties = properties || geojson.features[featureIndex].properties;
        geometry = geojson.features[featureIndex].geometry;
        break;
    case 'Feature':
        properties = properties || geojson.properties;
        geometry = geojson.geometry;
        break;
    case 'Point':
    case 'MultiPoint':
        return null;
    case 'LineString':
    case 'Polygon':
    case 'MultiLineString':
    case 'MultiPolygon':
        geometry = geojson;
        break;
    default:
        throw new Error('geojson is invalid');
    }

    // Find SegmentIndex
    if (geometry === null) return null;
    var coords = geometry.coordinates;
    switch (geometry.type) {
    case 'Point':
    case 'MultiPoint':
        return null;
    case 'LineString':
        if (segmentIndex < 0) segmentIndex = coords.length + segmentIndex - 1;
        return helpers.lineString([coords[segmentIndex], coords[segmentIndex + 1]], properties, options);
    case 'Polygon':
        if (geometryIndex < 0) geometryIndex = coords.length + geometryIndex;
        if (segmentIndex < 0) segmentIndex = coords[geometryIndex].length + segmentIndex - 1;
        return helpers.lineString([coords[geometryIndex][segmentIndex], coords[geometryIndex][segmentIndex + 1]], properties, options);
    case 'MultiLineString':
        if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
        if (segmentIndex < 0) segmentIndex = coords[multiFeatureIndex].length + segmentIndex - 1;
        return helpers.lineString([coords[multiFeatureIndex][segmentIndex], coords[multiFeatureIndex][segmentIndex + 1]], properties, options);
    case 'MultiPolygon':
        if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
        if (geometryIndex < 0) geometryIndex = coords[multiFeatureIndex].length + geometryIndex;
        if (segmentIndex < 0) segmentIndex = coords[multiFeatureIndex][geometryIndex].length - segmentIndex - 1;
        return helpers.lineString([coords[multiFeatureIndex][geometryIndex][segmentIndex], coords[multiFeatureIndex][geometryIndex][segmentIndex + 1]], properties, options);
    }
    throw new Error('geojson is invalid');
}

/**
 * Finds a particular Point from a GeoJSON using `@turf/meta` indexes.
 *
 * Negative indexes are permitted.
 *
 * @param {FeatureCollection|Feature|Geometry} geojson Any GeoJSON Feature or Geometry
 * @param {Object} [options={}] Optional parameters
 * @param {number} [options.featureIndex=0] Feature Index
 * @param {number} [options.multiFeatureIndex=0] Multi-Feature Index
 * @param {number} [options.geometryIndex=0] Geometry Index
 * @param {number} [options.coordIndex=0] Coord Index
 * @param {Object} [options.properties={}] Translate Properties to output Point
 * @param {BBox} [options.bbox={}] Translate BBox to output Point
 * @param {number|string} [options.id={}] Translate Id to output Point
 * @returns {Feature<Point>} 2-vertex GeoJSON Feature Point
 * @example
 * var multiLine = turf.multiLineString([
 *     [[10, 10], [50, 30], [30, 40]],
 *     [[-10, -10], [-50, -30], [-30, -40]]
 * ]);
 *
 * // First Segment (defaults are 0)
 * turf.findPoint(multiLine);
 * // => Feature<Point<[10, 10]>>
 *
 * // First Segment of the 2nd Multi-Feature
 * turf.findPoint(multiLine, {multiFeatureIndex: 1});
 * // => Feature<Point<[-10, -10]>>
 *
 * // Last Segment of last Multi-Feature
 * turf.findPoint(multiLine, {multiFeatureIndex: -1, coordIndex: -1});
 * // => Feature<Point<[-30, -40]>>
 */
function findPoint(geojson, options) {
    // Optional Parameters
    options = options || {};
    if (!helpers.isObject(options)) throw new Error('options is invalid');
    var featureIndex = options.featureIndex || 0;
    var multiFeatureIndex = options.multiFeatureIndex || 0;
    var geometryIndex = options.geometryIndex || 0;
    var coordIndex = options.coordIndex || 0;

    // Find FeatureIndex
    var properties = options.properties;
    var geometry;

    switch (geojson.type) {
    case 'FeatureCollection':
        if (featureIndex < 0) featureIndex = geojson.features.length + featureIndex;
        properties = properties || geojson.features[featureIndex].properties;
        geometry = geojson.features[featureIndex].geometry;
        break;
    case 'Feature':
        properties = properties || geojson.properties;
        geometry = geojson.geometry;
        break;
    case 'Point':
    case 'MultiPoint':
        return null;
    case 'LineString':
    case 'Polygon':
    case 'MultiLineString':
    case 'MultiPolygon':
        geometry = geojson;
        break;
    default:
        throw new Error('geojson is invalid');
    }

    // Find Coord Index
    if (geometry === null) return null;
    var coords = geometry.coordinates;
    switch (geometry.type) {
    case 'Point':
        return helpers.point(coords, properties, options);
    case 'MultiPoint':
        if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
        return helpers.point(coords[multiFeatureIndex], properties, options);
    case 'LineString':
        if (coordIndex < 0) coordIndex = coords.length + coordIndex;
        return helpers.point(coords[coordIndex], properties, options);
    case 'Polygon':
        if (geometryIndex < 0) geometryIndex = coords.length + geometryIndex;
        if (coordIndex < 0) coordIndex = coords[geometryIndex].length + coordIndex;
        return helpers.point(coords[geometryIndex][coordIndex], properties, options);
    case 'MultiLineString':
        if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
        if (coordIndex < 0) coordIndex = coords[multiFeatureIndex].length + coordIndex;
        return helpers.point(coords[multiFeatureIndex][coordIndex], properties, options);
    case 'MultiPolygon':
        if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
        if (geometryIndex < 0) geometryIndex = coords[multiFeatureIndex].length + geometryIndex;
        if (coordIndex < 0) coordIndex = coords[multiFeatureIndex][geometryIndex].length - coordIndex;
        return helpers.point(coords[multiFeatureIndex][geometryIndex][coordIndex], properties, options);
    }
    throw new Error('geojson is invalid');
}

exports.coordEach = coordEach;
exports.coordReduce = coordReduce;
exports.propEach = propEach;
exports.propReduce = propReduce;
exports.featureEach = featureEach;
exports.featureReduce = featureReduce;
exports.coordAll = coordAll;
exports.geomEach = geomEach;
exports.geomReduce = geomReduce;
exports.flattenEach = flattenEach;
exports.flattenReduce = flattenReduce;
exports.segmentEach = segmentEach;
exports.segmentReduce = segmentReduce;
exports.lineEach = lineEach;
exports.lineReduce = lineReduce;
exports.findSegment = findSegment;
exports.findPoint = findPoint;

},{"@turf/helpers":9}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bearing_1 = require("@turf/bearing");
var distance_1 = require("@turf/distance");
var destination_1 = require("@turf/destination");
var line_intersect_1 = require("@turf/line-intersect");
var meta_1 = require("@turf/meta");
var helpers_1 = require("@turf/helpers");
var invariant_1 = require("@turf/invariant");
/**
 * Takes a {@link Point} and a {@link LineString} and calculates the closest Point on the (Multi)LineString.
 *
 * @name nearestPointOnLine
 * @param {Geometry|Feature<LineString|MultiLineString>} lines lines to snap to
 * @param {Geometry|Feature<Point>|number[]} pt point to snap from
 * @param {Object} [options={}] Optional parameters
 * @param {string} [options.units='kilometers'] can be degrees, radians, miles, or kilometers
 * @returns {Feature<Point>} closest point on the `line` to `point`. The properties object will contain three values: `index`: closest point was found on nth line part, `dist`: distance between pt and the closest point, `location`: distance along the line between start and the closest point.
 * @example
 * var line = turf.lineString([
 *     [-77.031669, 38.878605],
 *     [-77.029609, 38.881946],
 *     [-77.020339, 38.884084],
 *     [-77.025661, 38.885821],
 *     [-77.021884, 38.889563],
 *     [-77.019824, 38.892368]
 * ]);
 * var pt = turf.point([-77.037076, 38.884017]);
 *
 * var snapped = turf.nearestPointOnLine(line, pt, {units: 'miles'});
 *
 * //addToMap
 * var addToMap = [line, pt, snapped];
 * snapped.properties['marker-color'] = '#00f';
 */
function nearestPointOnLine(lines, pt, options) {
    if (options === void 0) { options = {}; }
    var closestPt = helpers_1.point([Infinity, Infinity], {
        dist: Infinity
    });
    var length = 0.0;
    meta_1.flattenEach(lines, function (line) {
        var coords = invariant_1.getCoords(line);
        for (var i = 0; i < coords.length - 1; i++) {
            //start
            var start = helpers_1.point(coords[i]);
            start.properties.dist = distance_1.default(pt, start, options);
            //stop
            var stop_1 = helpers_1.point(coords[i + 1]);
            stop_1.properties.dist = distance_1.default(pt, stop_1, options);
            // sectionLength
            var sectionLength = distance_1.default(start, stop_1, options);
            //perpendicular
            var heightDistance = Math.max(start.properties.dist, stop_1.properties.dist);
            var direction = bearing_1.default(start, stop_1);
            var perpendicularPt1 = destination_1.default(pt, heightDistance, direction + 90, options);
            var perpendicularPt2 = destination_1.default(pt, heightDistance, direction - 90, options);
            var intersect = line_intersect_1.default(helpers_1.lineString([perpendicularPt1.geometry.coordinates, perpendicularPt2.geometry.coordinates]), helpers_1.lineString([start.geometry.coordinates, stop_1.geometry.coordinates]));
            var intersectPt = null;
            if (intersect.features.length > 0) {
                intersectPt = intersect.features[0];
                intersectPt.properties.dist = distance_1.default(pt, intersectPt, options);
                intersectPt.properties.location = length + distance_1.default(start, intersectPt, options);
            }
            if (start.properties.dist < closestPt.properties.dist) {
                closestPt = start;
                closestPt.properties.index = i;
                closestPt.properties.location = length;
            }
            if (stop_1.properties.dist < closestPt.properties.dist) {
                closestPt = stop_1;
                closestPt.properties.index = i + 1;
                closestPt.properties.location = length + sectionLength;
            }
            if (intersectPt && intersectPt.properties.dist < closestPt.properties.dist) {
                closestPt = intersectPt;
                closestPt.properties.index = i;
            }
            // update length
            length += sectionLength;
        }
    });
    return closestPt;
}
exports.default = nearestPointOnLine;

},{"@turf/bearing":6,"@turf/destination":7,"@turf/distance":8,"@turf/helpers":9,"@turf/invariant":10,"@turf/line-intersect":11,"@turf/meta":13}],15:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
// Taken from http://geomalgorithms.com/a02-_lines.html
var distance_1 = __importDefault(require("@turf/distance"));
var helpers_1 = require("@turf/helpers");
var invariant_1 = require("@turf/invariant");
var meta_1 = require("@turf/meta");
var rhumb_distance_1 = __importDefault(require("@turf/rhumb-distance"));
/**
 * Returns the minimum distance between a {@link Point} and a {@link LineString}, being the distance from a line the
 * minimum distance between the point and any segment of the `LineString`.
 *
 * @name pointToLineDistance
 * @param {Feature<Point>|Array<number>} pt Feature or Geometry
 * @param {Feature<LineString>} line GeoJSON Feature or Geometry
 * @param {Object} [options={}] Optional parameters
 * @param {string} [options.units="kilometers"] can be anything supported by turf/convertLength
 * (ex: degrees, radians, miles, or kilometers)
 * @param {string} [options.method="geodesic"] wether to calculate the distance based on geodesic (spheroid) or
 * planar (flat) method. Valid options are 'geodesic' or 'planar'.
 * @returns {number} distance between point and line
 * @example
 * var pt = turf.point([0, 0]);
 * var line = turf.lineString([[1, 1],[-1, 1]]);
 *
 * var distance = turf.pointToLineDistance(pt, line, {units: 'miles'});
 * //=69.11854715938406
 */
function pointToLineDistance(pt, line, options) {
    if (options === void 0) { options = {}; }
    // Optional parameters
    if (!options.method) {
        options.method = "geodesic";
    }
    if (!options.units) {
        options.units = "kilometers";
    }
    // validation
    if (!pt) {
        throw new Error("pt is required");
    }
    if (Array.isArray(pt)) {
        pt = helpers_1.point(pt);
    }
    else if (pt.type === "Point") {
        pt = helpers_1.feature(pt);
    }
    else {
        invariant_1.featureOf(pt, "Point", "point");
    }
    if (!line) {
        throw new Error("line is required");
    }
    if (Array.isArray(line)) {
        line = helpers_1.lineString(line);
    }
    else if (line.type === "LineString") {
        line = helpers_1.feature(line);
    }
    else {
        invariant_1.featureOf(line, "LineString", "line");
    }
    var distance = Infinity;
    var p = pt.geometry.coordinates;
    meta_1.segmentEach(line, function (segment) {
        var a = segment.geometry.coordinates[0];
        var b = segment.geometry.coordinates[1];
        var d = distanceToSegment(p, a, b, options);
        if (d < distance) {
            distance = d;
        }
    });
    return helpers_1.convertLength(distance, "degrees", options.units);
}
/**
 * Returns the distance between a point P on a segment AB.
 *
 * @private
 * @param {Array<number>} p external point
 * @param {Array<number>} a first segment point
 * @param {Array<number>} b second segment point
 * @param {Object} [options={}] Optional parameters
 * @returns {number} distance
 */
function distanceToSegment(p, a, b, options) {
    var v = [b[0] - a[0], b[1] - a[1]];
    var w = [p[0] - a[0], p[1] - a[1]];
    var c1 = dot(w, v);
    if (c1 <= 0) {
        return calcDistance(p, a, { method: options.method, units: "degrees" });
    }
    var c2 = dot(v, v);
    if (c2 <= c1) {
        return calcDistance(p, b, { method: options.method, units: "degrees" });
    }
    var b2 = c1 / c2;
    var Pb = [a[0] + (b2 * v[0]), a[1] + (b2 * v[1])];
    return calcDistance(p, Pb, { method: options.method, units: "degrees" });
}
function dot(u, v) {
    return (u[0] * v[0] + u[1] * v[1]);
}
function calcDistance(a, b, options) {
    return options.method === "planar" ? rhumb_distance_1.default(a, b, options) : distance_1.default(a, b, options);
}
exports.default = pointToLineDistance;

},{"@turf/distance":8,"@turf/helpers":9,"@turf/invariant":10,"@turf/meta":13,"@turf/rhumb-distance":16}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// https://en.wikipedia.org/wiki/Rhumb_line
var helpers_1 = require("@turf/helpers");
var invariant_1 = require("@turf/invariant");
/**
 * Calculates the distance along a rhumb line between two {@link Point|points} in degrees, radians,
 * miles, or kilometers.
 *
 * @name rhumbDistance
 * @param {Coord} from origin point
 * @param {Coord} to destination point
 * @param {Object} [options] Optional parameters
 * @param {string} [options.units="kilometers"] can be degrees, radians, miles, or kilometers
 * @returns {number} distance between the two points
 * @example
 * var from = turf.point([-75.343, 39.984]);
 * var to = turf.point([-75.534, 39.123]);
 * var options = {units: 'miles'};
 *
 * var distance = turf.rhumbDistance(from, to, options);
 *
 * //addToMap
 * var addToMap = [from, to];
 * from.properties.distance = distance;
 * to.properties.distance = distance;
 */
function rhumbDistance(from, to, options) {
    if (options === void 0) { options = {}; }
    var origin = invariant_1.getCoord(from);
    var destination = invariant_1.getCoord(to);
    // compensate the crossing of the 180th meridian (https://macwright.org/2016/09/26/the-180th-meridian.html)
    // solution from https://github.com/mapbox/mapbox-gl-js/issues/3250#issuecomment-294887678
    destination[0] += (destination[0] - origin[0] > 180) ? -360 : (origin[0] - destination[0] > 180) ? 360 : 0;
    var distanceInMeters = calculateRhumbDistance(origin, destination);
    var distance = helpers_1.convertLength(distanceInMeters, "meters", options.units);
    return distance;
}
/**
 * Returns the distance travelling from ÔÇÿthisÔÇÖ point to destination point along a rhumb line.
 * Adapted from Geodesy: https://github.com/chrisveness/geodesy/blob/master/latlon-spherical.js
 *
 * @private
 * @param   {Array<number>} origin point.
 * @param   {Array<number>} destination point.
 * @param   {number} [radius=6371e3] - (Mean) radius of earth (defaults to radius in metres).
 * @returns {number} Distance in km between this point and destination point (same units as radius).
 *
 * @example
 *     var p1 = new LatLon(51.127, 1.338);
 *     var p2 = new LatLon(50.964, 1.853);
 *     var d = p1.distanceTo(p2); // 40.31 km
 */
function calculateRhumbDistance(origin, destination, radius) {
    // ¤å => phi
    // ╬╗ => lambda
    // ¤ê => psi
    // ╬ö => Delta
    // ╬┤ => delta
    // ╬© => theta
    radius = (radius === undefined) ? helpers_1.earthRadius : Number(radius);
    // see www.edwilliams.org/avform.htm#Rhumb
    var R = radius;
    var phi1 = origin[1] * Math.PI / 180;
    var phi2 = destination[1] * Math.PI / 180;
    var DeltaPhi = phi2 - phi1;
    var DeltaLambda = Math.abs(destination[0] - origin[0]) * Math.PI / 180;
    // if dLon over 180┬░ take shorter rhumb line across the anti-meridian:
    if (DeltaLambda > Math.PI) {
        DeltaLambda -= 2 * Math.PI;
    }
    // on Mercator projection, longitude distances shrink by latitude; q is the 'stretch factor'
    // q becomes ill-conditioned along E-W line (0/0); use empirical tolerance to avoid it
    var DeltaPsi = Math.log(Math.tan(phi2 / 2 + Math.PI / 4) / Math.tan(phi1 / 2 + Math.PI / 4));
    var q = Math.abs(DeltaPsi) > 10e-12 ? DeltaPhi / DeltaPsi : Math.cos(phi1);
    // distance is pythagoras on 'stretched' Mercator projection
    var delta = Math.sqrt(DeltaPhi * DeltaPhi + q * q * DeltaLambda * DeltaLambda); // angular distance in radians
    var dist = delta * R;
    return dist;
}
exports.default = rhumbDistance;

},{"@turf/helpers":9,"@turf/invariant":10}],17:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.tile2boundingBox = exports.getTileXYForLocation = exports.LinesDirectlyToLRPs = exports.internalPrecisionEnum = exports.frcEnum = exports.fowEnum = exports.locationTypeEnum = exports.decoderProperties = exports.configProperties = exports.WegenregisterAntwerpenIntegration = exports.RoutableTilesIntegration = exports.OSMIntegration = exports.GeoJsonIntegration = exports.MapDataBase = exports.Node = exports.Line = exports.RawLineLocationReference = exports.JsonFormat = exports.LineDecoder = exports.LineEncoder = exports.LocationReferencePoint = exports.Location = exports.OpenLREncoder = exports.OpenLRDecoder = void 0;

var _Decoder = _interopRequireDefault(require("./utils/Integration/OpenLR/Decoder"));

exports.OpenLRDecoder = _Decoder.default;

var _Encoder = _interopRequireDefault(require("./utils/Integration/OpenLR/Encoder"));

exports.OpenLREncoder = _Encoder.default;

var _CoderSettings = require("./utils/Integration/OpenLR/coder/CoderSettings");

exports.configProperties = _CoderSettings.configProperties;
exports.decoderProperties = _CoderSettings.decoderProperties;

var _Location = _interopRequireDefault(require("./utils/Integration/OpenLR/coder/Location"));

exports.Location = _Location.default;

var _LocationReferencePoint = _interopRequireDefault(require("./utils/Integration/OpenLR/coder/LocationReferencePoint"));

exports.LocationReferencePoint = _LocationReferencePoint.default;

var _LineEncoder = _interopRequireDefault(require("./utils/Integration/OpenLR/coder/LineEncoder"));

exports.LineEncoder = _LineEncoder.default;

var _LineDecoder = _interopRequireDefault(require("./utils/Integration/OpenLR/coder/LineDecoder"));

exports.LineDecoder = _LineDecoder.default;

var _JsonFormat = _interopRequireDefault(require("./utils/Integration/OpenLR/coder/JsonFormat"));

exports.JsonFormat = _JsonFormat.default;

var _RawLineLocationReference = _interopRequireDefault(require("./utils/Integration/OpenLR/coder/RawLineLocationReference"));

exports.RawLineLocationReference = _RawLineLocationReference.default;

var _Enum = require("./utils/Integration/OpenLR/map/Enum");

exports.locationTypeEnum = _Enum.locationTypeEnum;
exports.fowEnum = _Enum.fowEnum;
exports.frcEnum = _Enum.frcEnum;
exports.internalPrecisionEnum = _Enum.internalPrecisionEnum;

var _Line = _interopRequireDefault(require("./utils/Integration/OpenLR/map/Line"));

exports.Line = _Line.default;

var _Node = _interopRequireDefault(require("./utils/Integration/OpenLR/map/Node"));

exports.Node = _Node.default;

var _MapDataBase = _interopRequireDefault(require("./utils/Integration/OpenLR/map/MapDataBase"));

exports.MapDataBase = _MapDataBase.default;

var _LinesDirectlyToLRPs = require("./utils/Integration/OpenLR/experimental/LinesDirectlyToLRPs");

exports.LinesDirectlyToLRPs = _LinesDirectlyToLRPs.LinesDirectlyToLRPs;

var _GeoJsonIntegration = _interopRequireDefault(require("./utils/Integration/OpenLRIntegration/GeoJsonIntegration"));

exports.GeoJsonIntegration = _GeoJsonIntegration.default;

var _OSMIntegration = _interopRequireDefault(require("./utils/Integration/OpenLRIntegration/OSMIntegration"));

exports.OSMIntegration = _OSMIntegration.default;

var _RoutableTilesIntegration = _interopRequireDefault(require("./utils/Integration/OpenLRIntegration/RoutableTilesIntegration"));

exports.RoutableTilesIntegration = _RoutableTilesIntegration.default;

var _WegenregisterAntwerpenIntegration = _interopRequireDefault(require("./utils/Integration/OpenLRIntegration/WegenregisterAntwerpenIntegration"));

exports.WegenregisterAntwerpenIntegration = _WegenregisterAntwerpenIntegration.default;

var _tileUtils = require("./utils/tileUtils");

exports.getTileXYForLocation = _tileUtils.getTileXYForLocation;
exports.tile2boundingBox = _tileUtils.tile2boundingBox;
},{"./utils/Integration/OpenLR/Decoder":26,"./utils/Integration/OpenLR/Encoder":27,"./utils/Integration/OpenLR/coder/CoderSettings":31,"./utils/Integration/OpenLR/coder/JsonFormat":33,"./utils/Integration/OpenLR/coder/LineDecoder":35,"./utils/Integration/OpenLR/coder/LineEncoder":36,"./utils/Integration/OpenLR/coder/Location":37,"./utils/Integration/OpenLR/coder/LocationReferencePoint":38,"./utils/Integration/OpenLR/coder/RawLineLocationReference":39,"./utils/Integration/OpenLR/experimental/LinesDirectlyToLRPs":40,"./utils/Integration/OpenLR/map/Enum":41,"./utils/Integration/OpenLR/map/Line":42,"./utils/Integration/OpenLR/map/MapDataBase":43,"./utils/Integration/OpenLR/map/Node":44,"./utils/Integration/OpenLRIntegration/GeoJsonIntegration":22,"./utils/Integration/OpenLRIntegration/OSMIntegration":23,"./utils/Integration/OpenLRIntegration/RoutableTilesIntegration":24,"./utils/Integration/OpenLRIntegration/WegenregisterAntwerpenIntegration":25,"./utils/tileUtils":45,"@babel/runtime/helpers/interopRequireDefault":3}],18:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.OsmFowHighwayMapping = void 0;

var _Enum = require("../../OpenLR/map/Enum");

//based on https://wiki.openstreetmap.org/wiki/Key:highway
//and https://wiki.openstreetmap.org/wiki/NL:The_Netherlands_roads_tagging
var OsmFowHighwayMapping = {
  "motorway": _Enum.fowEnum.MULTIPLE_CARRIAGEWAY,
  "trunk": _Enum.fowEnum.MOTORWAY,
  "primary": _Enum.fowEnum.SINGLE_CARRIAGEWAY,
  "secondary": _Enum.fowEnum.SINGLE_CARRIAGEWAY,
  "tertiary": _Enum.fowEnum.SINGLE_CARRIAGEWAY,
  "unclassified": _Enum.fowEnum.SINGLE_CARRIAGEWAY,
  "residential": _Enum.fowEnum.SINGLE_CARRIAGEWAY,
  "motorway_link": _Enum.fowEnum.SLIPROAD,
  "trunk_link": _Enum.fowEnum.SLIPROAD,
  "primary_link": _Enum.fowEnum.SLIPROAD,
  "secondary_link": _Enum.fowEnum.SLIPROAD,
  "tertiary_link": _Enum.fowEnum.SLIPROAD,
  "living_street": _Enum.fowEnum.OTHER,
  "service": _Enum.fowEnum.OTHER,
  "pedestrian": _Enum.fowEnum.OTHER,
  "track": _Enum.fowEnum.OTHER,
  "bus_guideway": _Enum.fowEnum.OTHER,
  "excape": _Enum.fowEnum.OTHER,
  "road": _Enum.fowEnum.OTHER,
  "footway": _Enum.fowEnum.OTHER,
  "bridleway": _Enum.fowEnum.OTHER,
  "steps": _Enum.fowEnum.OTHER,
  "path": _Enum.fowEnum.OTHER,
  "cycleway": _Enum.fowEnum.OTHER,
  "proposed": _Enum.fowEnum.OTHER,
  "construction": _Enum.fowEnum.OTHER,
  "bus_stop": _Enum.fowEnum.OTHER,
  "crossing": _Enum.fowEnum.OTHER,
  "elevator": _Enum.fowEnum.OTHER,
  "emergency_access_point": _Enum.fowEnum.OTHER,
  "give_way": _Enum.fowEnum.OTHER,
  "mini_roundabout": _Enum.fowEnum.ROUNDABOUT,
  "motorway_junction": _Enum.fowEnum.SINGLE_CARRIAGEWAY,
  "passing_place": _Enum.fowEnum.OTHER,
  "rest_area": _Enum.fowEnum.OTHER,
  "speed_camera": _Enum.fowEnum.OTHER,
  "street_lamp": _Enum.fowEnum.OTHER,
  "services": _Enum.fowEnum.OTHER,
  "stop": _Enum.fowEnum.OTHER,
  "traffic_signals": _Enum.fowEnum.OTHER,
  "turning_circle": _Enum.fowEnum.OTHER
};
exports.OsmFowHighwayMapping = OsmFowHighwayMapping;
},{"../../OpenLR/map/Enum":41}],19:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.WegenregisterAntwerpenFowMorfMapping = void 0;

var _Enum = require("../../OpenLR/map/Enum");

//based on https://www.agiv.be/~/media/agiv/producten/mrb/documenten/wegenregister_objectcataloog.pdf
//or https://download.vlaanderen.be/Producten/GetDocument?id=280&title=Data_Wegenregister_v2_0_pdf&x=Data_Wegenregister_v2_0_pdf
var WegenregisterAntwerpenFowMorfMapping = {
  "autosnelweg": _Enum.fowEnum.MOTORWAY,
  "weg met gescheiden rijbanen die geen autosnelweg is": _Enum.fowEnum.MOTORWAY,
  "weg bestaande uit ├®├®n rijbaan": _Enum.fowEnum.SINGLE_CARRIAGEWAY,
  "rotonde": _Enum.fowEnum.ROUNDABOUT,
  "speciale verkeerssituatie": _Enum.fowEnum.OTHER,
  "verkeersplein": _Enum.fowEnum.TRAFFICSQUARE,
  "op- of afrit, behorende tot een nietgelijkgrondse verbinding": _Enum.fowEnum.SLIPROAD,
  "op- of afrit, behorende tot een gelijkgrondse verbinding": _Enum.fowEnum.SLIPROAD,
  "parallelweg": _Enum.fowEnum.SLIPROAD,
  "ventweg": _Enum.fowEnum.SINGLE_CARRIAGEWAY,
  "in- of uitrit van een parking": _Enum.fowEnum.SLIPROAD,
  "in- of uitrit van een dienst": _Enum.fowEnum.SLIPROAD,
  "voetgangerszone": _Enum.fowEnum.OTHER,
  "wandel- of fietsweg, niet toegankelijk voor andere voertuigen": _Enum.fowEnum.OTHER,
  "tramweg, niet toegankelijk voor andere voertuigen": _Enum.fowEnum.OTHER,
  "dienstweg": _Enum.fowEnum.OTHER,
  "aardeweg": _Enum.fowEnum.OTHER,
  "veer": _Enum.fowEnum.OTHER,
  "niet gekend": _Enum.fowEnum.UNDEFINED
};
exports.WegenregisterAntwerpenFowMorfMapping = WegenregisterAntwerpenFowMorfMapping;
},{"../../OpenLR/map/Enum":41}],20:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.OsmFrcHighwayMapping = void 0;

var _Enum = require("../../OpenLR/map/Enum");

//based on https://wiki.openstreetmap.org/wiki/Key:highway
var OsmFrcHighwayMapping = {
  "motorway": _Enum.frcEnum.FRC_0,
  "trunk": _Enum.frcEnum.FRC_1,
  "primary": _Enum.frcEnum.FRC_2,
  "secondary": _Enum.frcEnum.FRC_3,
  "tertiary": _Enum.frcEnum.FRC_4,
  "unclassified": _Enum.frcEnum.FRC_6,
  "residential": _Enum.frcEnum.FRC_5,
  "motorway_link": _Enum.frcEnum.FRC_0,
  "trunk_link": _Enum.frcEnum.FRC_1,
  "primary_link": _Enum.frcEnum.FRC_2,
  "secondary_link": _Enum.frcEnum.FRC_3,
  "tertiary_link": _Enum.frcEnum.FRC_4
};
exports.OsmFrcHighwayMapping = OsmFrcHighwayMapping;
},{"../../OpenLR/map/Enum":41}],21:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.WegenregisterAntwerpenFrcWegcatMapping = void 0;

var _Enum = require("../../OpenLR/map/Enum");

//based on https://www.agiv.be/~/media/agiv/producten/mrb/documenten/wegenregister_objectcataloog.pdf
//or https://download.vlaanderen.be/Producten/GetDocument?id=280&title=Data_Wegenregister_v2_0_pdf&x=Data_Wegenregister_v2_0_pdf
var WegenregisterAntwerpenFrcWegcatMapping = {
  "hoofdweg": _Enum.frcEnum.FRC_0,
  "primaire weg I": _Enum.frcEnum.FRC_1,
  "primaire weg II": _Enum.frcEnum.FRC_2,
  "primaire weg II type 1": _Enum.frcEnum.FRC_2,
  "primaire weg II type 2": _Enum.frcEnum.FRC_3,
  "primaire weg II type 3": _Enum.frcEnum.FRC_3,
  "primaire weg II type 4": _Enum.frcEnum.FRC_0,
  "secundaire weg": _Enum.frcEnum.FRC_4,
  "secundaire weg type 1": _Enum.frcEnum.FRC_4,
  "secundaire weg type 2": _Enum.frcEnum.FRC_5,
  "secundaire weg type 3": _Enum.frcEnum.FRC_5,
  "secundaire weg type 4": _Enum.frcEnum.FRC_5,
  "lokale weg": _Enum.frcEnum.FRC_6,
  "lokale weg type 1": _Enum.frcEnum.FRC_6,
  "lokale weg type 2": _Enum.frcEnum.FRC_6,
  "lokale weg type 3": _Enum.frcEnum.FRC_6,
  "niet gekend": _Enum.frcEnum.FRC_7,
  "niet van toepassing": _Enum.frcEnum.FRC_7
};
exports.WegenregisterAntwerpenFrcWegcatMapping = WegenregisterAntwerpenFrcWegcatMapping;
},{"../../OpenLR/map/Enum":41}],22:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _Line = _interopRequireDefault(require("../OpenLR/map/Line"));

var _Node = _interopRequireDefault(require("../OpenLR/map/Node"));

var GeoJsonIntegration =
/*#__PURE__*/
function () {
  function GeoJsonIntegration() {}

  GeoJsonIntegration.initMapDataBase = function initMapDataBase(mapDataBase, features) {
    var nodesLines = GeoJsonIntegration.getNodesLines(features);
    mapDataBase.setData(nodesLines.lines, nodesLines.nodes); //todo: set bounding box
  };

  GeoJsonIntegration.getNodesLines = function getNodesLines(features) {
    var openLRLines = {};
    var openLRNodes = {};

    for (var i = 0; i < features.length; i++) {
      if (features[i].geometry.type === "LineString") {
        if (features[i].geometry.coordinates.length >= 2) {
          var lat = features[i].geometry.coordinates[0][1];
          var long = features[i].geometry.coordinates[0][0];

          if (openLRNodes[lat + "_" + long] === undefined) {
            openLRNodes[lat + "_" + long] = new _Node.default(lat + "_" + long, lat, long);
          }

          for (var j = 1; j < features[i].geometry.coordinates.length; j++) {
            lat = features[i].geometry.coordinates[j][1];
            long = features[i].geometry.coordinates[j][0];

            if (openLRNodes[lat + "_" + long] === undefined) {
              openLRNodes[lat + "_" + long] = new _Node.default(lat + "_" + long, lat, long);
            }

            var prevLat = features[i].geometry.coordinates[j - 1][1];
            var prevLong = features[i].geometry.coordinates[j - 1][0];
            openLRLines[prevLat + "_" + prevLong + "_" + lat + "_" + long] = new _Line.default(prevLat + "_" + prevLong + "_" + lat + "_" + long, openLRNodes[prevLat + "_" + prevLong], openLRNodes[lat + "_" + long]);
            openLRLines[prevLat + "_" + prevLong + "_" + lat + "_" + long].frc = GeoJsonIntegration.getFRC(features[i].properties);
            openLRLines[prevLat + "_" + prevLong + "_" + lat + "_" + long].fow = GeoJsonIntegration.getFOW(features[i].properties);
          }
        }
      }
    }

    return {
      nodes: openLRNodes,
      lines: openLRLines
    };
  };

  GeoJsonIntegration.getFRC = function getFRC(properties) {
    return undefined;
  };

  GeoJsonIntegration.getFOW = function getFOW(properties) {
    return undefined;
  };

  return GeoJsonIntegration;
}();

exports.default = GeoJsonIntegration;
},{"../OpenLR/map/Line":42,"../OpenLR/map/Node":44,"@babel/runtime/helpers/interopRequireDefault":3}],23:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _Line = _interopRequireDefault(require("../OpenLR/map/Line"));

var _Node = _interopRequireDefault(require("../OpenLR/map/Node"));

var _Enum = require("../OpenLR/map/Enum");

var _OsmFowHighwayMapping = require("./FOWmappings/OsmFowHighwayMapping");

var _OsmFrcHighwayMapping = require("./FRCmappings/OsmFrcHighwayMapping");

var OSMIntegration =
/*#__PURE__*/
function () {
  function OSMIntegration() {}

  OSMIntegration.initMapDataBase = function initMapDataBase(mapDataBase, nodes, ways, relations) {
    var nodesLines = OSMIntegration.getNodesLines(nodes, ways, relations);
    mapDataBase.setData(nodesLines.lines, nodesLines.nodes); //todo: set bounding box
  };

  OSMIntegration.getNodesLines = function getNodesLines(nodes, ways, relations) {
    var openLRLines = {};
    var openLRNodes = {};
    var osmNodes = {};

    for (var id in nodes) {
      if (nodes.hasOwnProperty(id)) {
        var openLRNode = new _Node.default(id, nodes[id]["@_lat"], nodes[id]["@_lon"]);
        osmNodes[openLRNode.getID()] = openLRNode;
      }
    }

    for (var _id in ways) {
      if (ways.hasOwnProperty(_id)) {
        for (var i = 0; i < ways[_id].nd.length - 1; i++) {
          // add a line from this node to the next one
          // the id of the line is created out of the id of the way + underscore + id of the start node (since these lines aren't directly identified in osm)
          var openLRLine = new _Line.default(_id + "_" + ways[_id].nd[i]["@_ref"], osmNodes[ways[_id].nd[i]["@_ref"]], osmNodes[ways[_id].nd[i + 1]["@_ref"]]);
          openLRLine.frc = OSMIntegration.getFRC(ways[_id]);
          openLRLine.fow = OSMIntegration.getFOW(ways[_id]);
          openLRLines[openLRLine.getID()] = openLRLine; // check if OSM does specify if this is strictly a one way street

          var oneWay = false;

          if (Array.isArray(ways[_id].tag)) {
            var _i = 0;
            var oneWayTagFound = false;

            while (!oneWayTagFound && _i < ways[_id].tag.length) {
              if (ways[_id].tag[_i]["@_k"] === "oneway") {
                oneWayTagFound = true;

                if (ways[_id].tag[_i]["@_v"] === "yes") {
                  oneWay = true;
                }
              }

              _i++;
            }
          } else if (ways[_id].tag["@_k"] === "oneway" && ways[_id].tag["@_v"] === "yes") {
            oneWay = true;
          }

          if (!oneWay) {
            // since OSM doesn't have directed lines for it's roads, we will add the line in the other direction, so it is always present both as an input line and an output line in a node
            var reverseOpenLRLine = new _Line.default(_id + "_" + ways[_id].nd[i]["@_ref"] + "_1", osmNodes[ways[_id].nd[i + 1]["@_ref"]], osmNodes[ways[_id].nd[i]["@_ref"]]);
            reverseOpenLRLine.frc = OSMIntegration.getFRC(ways[_id]);
            reverseOpenLRLine.fow = OSMIntegration.getFOW(ways[_id]);
            openLRLines[reverseOpenLRLine.getID()] = reverseOpenLRLine;
          } //since we only want to keep the nodes that are part of the road network, and not the other nodes of OSM, so we will add only those in the openLRNodes map


          openLRNodes[ways[_id].nd[i]["@_ref"]] = osmNodes[ways[_id].nd[i]["@_ref"]];
          openLRNodes[ways[_id].nd[i + 1]["@_ref"]] = osmNodes[ways[_id].nd[i + 1]["@_ref"]];
        }
      }
    }

    return {
      nodes: openLRNodes,
      lines: openLRLines
    };
  }
  /*depricated, old code, only used to test that one way doesn't affect lanes that aren't one way only*/
  ;

  OSMIntegration.initMapDataBaseDeprecatedNoOneWay = function initMapDataBaseDeprecatedNoOneWay(mapDataBase, nodes, ways, relations) {
    var nodesLines = OSMIntegration.getNodesLinesDeprecatedNoOneWay(nodes, ways, relations);
    mapDataBase.setData(nodesLines.lines, nodesLines.nodes);
  };

  OSMIntegration.getNodesLinesDeprecatedNoOneWay = function getNodesLinesDeprecatedNoOneWay(nodes, ways, realtions) {
    var openLRLines = {};
    var openLRNodes = {};
    var osmNodes = {};

    for (var id in nodes) {
      if (nodes.hasOwnProperty(id)) {
        var openLRNode = new _Node.default(id, nodes[id]["@_lat"], nodes[id]["@_lon"]);
        osmNodes[openLRNode.getID()] = openLRNode;
      }
    }

    for (var _id2 in ways) {
      if (ways.hasOwnProperty(_id2)) {
        for (var i = 0; i < ways[_id2].nd.length - 1; i++) {
          // add a line from this node to the next one
          // the id of the line is created out of the id of the way + underscore + id of the start node (since these lines aren't directly identified in osm)
          var openLRLine = new _Line.default(_id2 + "_" + ways[_id2].nd[i]["@_ref"], osmNodes[ways[_id2].nd[i]["@_ref"]], osmNodes[ways[_id2].nd[i + 1]["@_ref"]]);
          openLRLine.frc = OSMIntegration.getFRC(ways[_id2]);
          openLRLine.fow = OSMIntegration.getFOW(ways[_id2]);
          openLRLines[openLRLine.getID()] = openLRLine; // since OSM doesn't have directed lines for it's roads, we will add the line in the other direction, so it is always present both as an input line and an output line in a node

          var reverseOpenLRLine = new _Line.default(_id2 + "_" + ways[_id2].nd[i]["@_ref"] + "_1", osmNodes[ways[_id2].nd[i + 1]["@_ref"]], osmNodes[ways[_id2].nd[i]["@_ref"]]);
          reverseOpenLRLine.frc = OSMIntegration.getFRC(ways[_id2]);
          reverseOpenLRLine.fow = OSMIntegration.getFOW(ways[_id2]);
          openLRLines[reverseOpenLRLine.getID()] = reverseOpenLRLine; //since we only want to keep the nodes that are part of the road network, and not the other nodes of OSM, so we will add only those in the openLRNodes map

          openLRNodes[ways[_id2].nd[i]["@_ref"]] = osmNodes[ways[_id2].nd[i]["@_ref"]];
          openLRNodes[ways[_id2].nd[i + 1]["@_ref"]] = osmNodes[ways[_id2].nd[i + 1]["@_ref"]];
        }
      }
    }

    return {
      nodes: openLRNodes,
      lines: openLRLines
    };
  };

  OSMIntegration.getFRC = function getFRC(osmWay) {
    var value = OSMIntegration._getTagsValues(osmWay, "highway");

    if (value["highway"] !== undefined && _OsmFrcHighwayMapping.OsmFrcHighwayMapping[value["highway"]] !== undefined) {
      return _OsmFrcHighwayMapping.OsmFrcHighwayMapping[value["highway"]];
    } else {
      return _Enum.frcEnum.FRC_7;
    }
  };

  OSMIntegration.getFOW = function getFOW(osmWay) {
    var value = OSMIntegration._getTagsValues(osmWay, "highway", "junction", "area"); // if(value["highway"] !== undefined
    //     && value["highway"] === "pedestrian"
    //     && value["area"] !== undefined
    //     && value["area"] === "yes")
    // {
    //     return fowEnum.TRAFFICSQUARE; //todo: is dit wel correct?
    // }
    // else


    if (value["junction"] !== undefined && value["junction"] === "roundabout") {
      return _Enum.fowEnum.ROUNDABOUT;
    } else if (value["highway"] !== undefined && _OsmFowHighwayMapping.OsmFowHighwayMapping[value["highway"]] !== undefined) {
      return _OsmFowHighwayMapping.OsmFowHighwayMapping[value["highway"]];
    } else {
      return _Enum.fowEnum.UNDEFINED;
    }
  };

  OSMIntegration._getTagsValues = function _getTagsValues(osmWay, tags) {
    var value = {};

    if (Array.isArray(osmWay.tag)) {
      var i = 0;

      while (i < osmWay.tag.length) {
        if (tags.includes(osmWay.tag[i]["@_k"])) {
          if (value[osmWay.tag[i]["@_k"]] !== undefined) {
            console.warn("Multiple '", osmWay.tag[i]["@_k"], "' tags found for way:", osmWay);
          }

          value[osmWay.tag[i]["@_k"]] = osmWay.tag[i]["@_v"];
        }

        i++;
      }
    } else if (tags.includes(osmWay.tag["@_k"])) {
      value[osmWay.tag["@_k"]] = osmWay.tag["@_v"];
    }

    return value;
  };

  return OSMIntegration;
}();

exports.default = OSMIntegration;
},{"../OpenLR/map/Enum":41,"../OpenLR/map/Line":42,"../OpenLR/map/Node":44,"./FOWmappings/OsmFowHighwayMapping":18,"./FRCmappings/OsmFrcHighwayMapping":20,"@babel/runtime/helpers/interopRequireDefault":3}],24:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _Line = _interopRequireDefault(require("../OpenLR/map/Line"));

var _Node = _interopRequireDefault(require("../OpenLR/map/Node"));

var _Enum = require("../OpenLR/map/Enum");

var _OsmFowHighwayMapping = require("./FOWmappings/OsmFowHighwayMapping");

var _OsmFrcHighwayMapping = require("./FRCmappings/OsmFrcHighwayMapping");

var RoutableTilesIntegration =
/*#__PURE__*/
function () {
  function RoutableTilesIntegration() {}

  RoutableTilesIntegration.initMapDataBase = function initMapDataBase(mapDataBase, nodes, ways, relations) {
    var nodesLines = RoutableTilesIntegration.getNodesLines(nodes, ways, relations);
    mapDataBase.setData(nodesLines.lines, nodesLines.nodes); //todo: set bounding box
  };

  RoutableTilesIntegration.getNodesLines = function getNodesLines(nodes, ways, relations) {
    //todo: use relations?
    var openLRLines = {};
    var openLRNodes = {};
    var osmNodes = {};
    var refToNodeId = {};

    for (var id in nodes) {
      if (nodes.hasOwnProperty(id)) {
        var openLRNode = new _Node.default(id, nodes[id].lat, nodes[id].long);
        osmNodes[openLRNode.getID()] = openLRNode;

        for (var i = 0; i < nodes[id].ref.length; i++) {
          refToNodeId[nodes[id].ref[i]] = nodes[id].id;
        }
      }
    }

    for (var _id in ways) {
      if (ways.hasOwnProperty(_id)) {
        for (var _i = 0; _i < ways[_id].nodes.length - 1; _i++) {
          // if(ways[id].highway !== undefined){ //todo: should we filter on highway data?
          // add a line from this node to the next one
          // the id of the line is created out of the id of the way + underscore + id of the start node (since these lines aren't directly identified in RoutableTiles)
          var openLRLine = new _Line.default(_id + "_" + refToNodeId[ways[_id].nodes[_i]], osmNodes[refToNodeId[ways[_id].nodes[_i]]], osmNodes[refToNodeId[ways[_id].nodes[_i + 1]]]);
          openLRLine.frc = RoutableTilesIntegration.getFRC(ways[_id]);
          openLRLine.fow = RoutableTilesIntegration.getFOW(ways[_id]);
          openLRLines[openLRLine.getID()] = openLRLine;

          if (ways[_id].oneway === undefined || ways[_id].oneway === "osm:no") {
            // since OSM doesn't have directed lines for it's roads, we will add the line in the other direction, so it is always present both as an input line and an output line in a node
            var reverseOpenLRLine = new _Line.default(_id + "_" + refToNodeId[ways[_id].nodes[_i]] + "_1", osmNodes[refToNodeId[ways[_id].nodes[_i + 1]]], osmNodes[refToNodeId[ways[_id].nodes[_i]]]);
            reverseOpenLRLine.frc = RoutableTilesIntegration.getFRC(ways[_id]);
            reverseOpenLRLine.fow = RoutableTilesIntegration.getFOW(ways[_id]);
            openLRLines[reverseOpenLRLine.getID()] = reverseOpenLRLine;
          } //since we only want to keep the nodes that are part of the road network, and not the other nodes of OSM, so we will add only those in the openLRNodes map


          openLRNodes[refToNodeId[ways[_id].nodes[_i]]] = osmNodes[refToNodeId[ways[_id].nodes[_i]]];
          openLRNodes[refToNodeId[ways[_id].nodes[_i + 1]]] = osmNodes[refToNodeId[ways[_id].nodes[_i + 1]]]; // }
        }
      }
    }

    return {
      nodes: openLRNodes,
      lines: openLRLines
    };
  };

  RoutableTilesIntegration.getFRC = function getFRC(osmWay) {
    if (osmWay.highway !== undefined && _OsmFrcHighwayMapping.OsmFrcHighwayMapping[osmWay.highway.slice(4)] !== undefined) {
      return _OsmFrcHighwayMapping.OsmFrcHighwayMapping[osmWay.highway.slice(37).toLowerCase()];
    } else {
      return _Enum.frcEnum.FRC_7;
    }
  };

  RoutableTilesIntegration.getFOW = function getFOW(osmWay) {
    // if(osmWay.highway !== undefined
    //     && osmWay.highway === "https://w3id.org/openstreetmap/terms#Pedestrian"
    //     && osmWay.area !== undefined
    //     && osmWay.area === "yes"
    // ){
    //     return fowEnum.TRAFFICSQUARE; //todo: is dit wel correct?
    // }
    // else
    if (osmWay.junction !== undefined && osmWay.junction === "roundabout") {
      return _Enum.fowEnum.ROUNDABOUT;
    } else if (osmWay.highway !== undefined && _OsmFowHighwayMapping.OsmFowHighwayMapping[osmWay.highway.slice(37).toLowerCase()] !== undefined) {
      return _OsmFowHighwayMapping.OsmFowHighwayMapping[osmWay.highway.slice(37).toLowerCase()];
    } else {
      return _Enum.fowEnum.UNDEFINED;
    }
  };

  return RoutableTilesIntegration;
}();

exports.default = RoutableTilesIntegration;
},{"../OpenLR/map/Enum":41,"../OpenLR/map/Line":42,"../OpenLR/map/Node":44,"./FOWmappings/OsmFowHighwayMapping":18,"./FRCmappings/OsmFrcHighwayMapping":20,"@babel/runtime/helpers/interopRequireDefault":3}],25:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _Line = _interopRequireDefault(require("../OpenLR/map/Line"));

var _Node = _interopRequireDefault(require("../OpenLR/map/Node"));

var _WegenregisterAntwerpenFrcWegcatMapping = require("./FRCmappings/WegenregisterAntwerpenFrcWegcatMapping");

var _Enum = require("../OpenLR/map/Enum");

var _WegenregisterAntwerpenFowMorfMapping = require("./FOWmappings/WegenregisterAntwerpenFowMorfMapping");

// import MapDataBase from "../OpenLR/map/MapDataBase";

/*
This class contains a demo implementation for use of openlr in the wegenregister Antwerpen (geojson).
 */
var WegenregisterAntwerpenIntegration =
/*#__PURE__*/
function () {
  function WegenregisterAntwerpenIntegration() {}

  WegenregisterAntwerpenIntegration.initMapDataBase = function initMapDataBase(mapDataBase, features) {
    var nodesLines = WegenregisterAntwerpenIntegration.getNodesLines(features);
    mapDataBase.setData(nodesLines.lines, nodesLines.nodes); //todo: set bounding box
  };

  WegenregisterAntwerpenIntegration.getNodesLines = function getNodesLines(features) {
    var openLRLines = {};
    var openLRNodes = {};

    for (var i = 0; i < features.length; i++) {
      var directionIsUndef = features[i].properties.RIJRICHTING_AUTO === undefined || features[i].properties.RIJRICHTING_AUTO === null; // if(!directionIsUndef){ // skip this if al roads should be added and not only the roads for cars

      if (features[i].geometry.type === "LineString") {
        if (features[i].geometry.coordinates.length >= 2) {
          var lat = features[i].geometry.coordinates[0][1];
          var long = features[i].geometry.coordinates[0][0];

          if (openLRNodes[lat + "_" + long] === undefined) {
            openLRNodes[lat + "_" + long] = new _Node.default(lat + "_" + long, lat, long);
          }

          for (var j = 1; j < features[i].geometry.coordinates.length; j++) {
            lat = features[i].geometry.coordinates[j][1];
            long = features[i].geometry.coordinates[j][0];

            if (openLRNodes[lat + "_" + long] === undefined) {
              openLRNodes[lat + "_" + long] = new _Node.default(lat + "_" + long, lat, long);
            }

            var prevLat = features[i].geometry.coordinates[j - 1][1];
            var prevLong = features[i].geometry.coordinates[j - 1][0];

            if (directionIsUndef || features[i].properties.RIJRICHTING_AUTO === "enkel (mee)" || features[i].properties.RIJRICHTING_AUTO === "dubbel") {
              openLRLines[prevLat + "_" + prevLong + "_" + lat + "_" + long] = new _Line.default(prevLat + "_" + prevLong + "_" + lat + "_" + long, openLRNodes[prevLat + "_" + prevLong], openLRNodes[lat + "_" + long]);
              openLRLines[prevLat + "_" + prevLong + "_" + lat + "_" + long].frc = WegenregisterAntwerpenIntegration.getFRC(features[i].properties);
              openLRLines[prevLat + "_" + prevLong + "_" + lat + "_" + long].fow = WegenregisterAntwerpenIntegration.getFOW(features[i].properties);
            }

            if (directionIsUndef || features[i].properties.RIJRICHTING_AUTO === "enkel (tegen)" || features[i].properties.RIJRICHTING_AUTO === "dubbel") {
              openLRLines[lat + "_" + long + "_" + prevLat + "_" + prevLong] = new _Line.default(lat + "_" + long + "_" + prevLat + "_" + prevLong, openLRNodes[lat + "_" + long], openLRNodes[prevLat + "_" + prevLong]);
              openLRLines[lat + "_" + long + "_" + prevLat + "_" + prevLong].frc = WegenregisterAntwerpenIntegration.getFRC(features[i].properties);
              openLRLines[lat + "_" + long + "_" + prevLat + "_" + prevLong].fow = WegenregisterAntwerpenIntegration.getFOW(features[i].properties);
            }
          }
        }
      } // }

    }

    return {
      nodes: openLRNodes,
      lines: openLRLines
    };
  }
  /***
   * //Depricated Code, only for testing purposes
  static initMapDataBaseDeprecatedNoRoadDirections(mapDataBase,features){
      let nodesLines = WegenregisterAntwerpenIntegration.getNodesLinesDeprecatedNoRoadDirections(features);
      mapDataBase.setData(nodesLines.lines,nodesLines.nodes);
  }
    static getNodesLinesDeprecatedNoRoadDirections(features){
      let openLRLines = {};
      let openLRNodes = {};
      for(let i=0;i<features.length;i++){
            if(features[i].geometry.type === "LineString"){
              if(features[i].geometry.coordinates.length >= 2){
                  let lat = features[i].geometry.coordinates[0][1];
                  let long = features[i].geometry.coordinates[0][0];
                  if(openLRNodes[lat+"_"+long] === undefined){
                      openLRNodes[lat+"_"+long] = new Node(lat+"_"+long,lat,long);
                  }
                  for(let j=1;j<features[i].geometry.coordinates.length;j++){
                      lat = features[i].geometry.coordinates[j][1];
                      long = features[i].geometry.coordinates[j][0];
                      if(openLRNodes[lat+"_"+long] === undefined){
                          openLRNodes[lat+"_"+long] = new Node(lat+"_"+long,lat,long);
                      }
                      let prevLat = features[i].geometry.coordinates[j-1][1];
                      let prevLong = features[i].geometry.coordinates[j-1][0];
                        openLRLines[prevLat+"_"+prevLong+"_"+lat+"_"+long]
                          = new Line(prevLat+"_"+prevLong+"_"+lat+"_"+long,openLRNodes[prevLat+"_"+prevLong],openLRNodes[lat+"_"+long]);
                      openLRLines[prevLat+"_"+prevLong+"_"+lat+"_"+long].frc = WegenregisterAntwerpenIntegration.getFRC(features[i].properties);
                      openLRLines[prevLat+"_"+prevLong+"_"+lat+"_"+long].fow = WegenregisterAntwerpenIntegration.getFOW(features[i].properties);
                        openLRLines[lat+"_"+long+"_"+prevLat+"_"+prevLong]
                          = new Line(lat+"_"+long+"_"+prevLat+"_"+prevLong,openLRNodes[lat+"_"+long],openLRNodes[prevLat+"_"+prevLong]);
                      openLRLines[lat+"_"+long+"_"+prevLat+"_"+prevLong].frc = WegenregisterAntwerpenIntegration.getFRC(features[i].properties);
                      openLRLines[lat+"_"+long+"_"+prevLat+"_"+prevLong].fow = WegenregisterAntwerpenIntegration.getFOW(features[i].properties);
                    }
              }
          }
      }
      return {
          nodes: openLRNodes,
          lines: openLRLines
      }
  }
    static initMapDataBaseDeprecatedAllLineStrings(mapDataBase,features){
      let nodesLines = WegenregisterAntwerpenIntegration.getNodesLinesDeprecatedAllLineStrings(features);
      mapDataBase.setData(nodesLines.lines,nodesLines.nodes);
  }
    static getNodesLinesDeprecatedAllLineStrings(features){
      let openLRLines = {};
      let openLRNodes = {};
      for(let i=0;i<features.length;i++){
            if(features[i].geometry.type === "LineString"){
              if(features[i].geometry.coordinates.length >= 2){
                  let lat = features[i].geometry.coordinates[0][1];
                  let long = features[i].geometry.coordinates[0][0];
                  if(openLRNodes[lat+"_"+long] === undefined){
                      openLRNodes[lat+"_"+long] = new Node(lat+"_"+long,lat,long);
                  }
                  for(let j=1;j<features[i].geometry.coordinates.length;j++){
                      lat = features[i].geometry.coordinates[j][1];
                      long = features[i].geometry.coordinates[j][0];
                      if(openLRNodes[lat+"_"+long] === undefined){
                          openLRNodes[lat+"_"+long] = new Node(lat+"_"+long,lat,long);
                      }
                      let prevLat = features[i].geometry.coordinates[j-1][1];
                      let prevLong = features[i].geometry.coordinates[j-1][0];
                        if(features[i].properties.RIJRICHTING_AUTO === undefined || features[i].properties.RIJRICHTING_AUTO === null || features[i].properties.RIJRICHTING_AUTO === "enkel (mee)" || features[i].properties.RIJRICHTING_AUTO === "dubbel"){
                          openLRLines[prevLat+"_"+prevLong+"_"+lat+"_"+long]
                              = new Line(prevLat+"_"+prevLong+"_"+lat+"_"+long,openLRNodes[prevLat+"_"+prevLong],openLRNodes[lat+"_"+long]);
                          openLRLines[prevLat+"_"+prevLong+"_"+lat+"_"+long].frc = WegenregisterAntwerpenIntegration.getFRC(features[i].properties);
                          openLRLines[prevLat+"_"+prevLong+"_"+lat+"_"+long].fow = WegenregisterAntwerpenIntegration.getFOW(features[i].properties);
                      }
                      if(features[i].properties.RIJRICHTING_AUTO === undefined || features[i].properties.RIJRICHTING_AUTO === null || features[i].properties.RIJRICHTING_AUTO === "enkel (tegen)"  || features[i].properties.RIJRICHTING_AUTO === "dubbel"){
                          openLRLines[lat+"_"+long+"_"+prevLat+"_"+prevLong]
                              = new Line(lat+"_"+long+"_"+prevLat+"_"+prevLong,openLRNodes[lat+"_"+long],openLRNodes[prevLat+"_"+prevLong]);
                          openLRLines[lat+"_"+long+"_"+prevLat+"_"+prevLong].frc = WegenregisterAntwerpenIntegration.getFRC(features[i].properties);
                          openLRLines[lat+"_"+long+"_"+prevLat+"_"+prevLong].fow = WegenregisterAntwerpenIntegration.getFOW(features[i].properties);
                      }
                    }
              }
          }
      }
      return {
          nodes: openLRNodes,
          lines: openLRLines
      }
  }
  */
  ;

  WegenregisterAntwerpenIntegration.getFRC = function getFRC(properties) {
    if (properties !== undefined && properties["WEGCAT"] !== undefined) {
      return _WegenregisterAntwerpenFrcWegcatMapping.WegenregisterAntwerpenFrcWegcatMapping[properties["WEGCAT"]];
    } else {
      return _Enum.frcEnum.FRC_7;
    }
  };

  WegenregisterAntwerpenIntegration.getFOW = function getFOW(properties) {
    if (properties !== undefined && properties["MORF"] !== undefined) {
      return _WegenregisterAntwerpenFowMorfMapping.WegenregisterAntwerpenFowMorfMapping[properties["MORF"]];
    } else {
      return _Enum.frcEnum.FRC_7;
    }
  };

  return WegenregisterAntwerpenIntegration;
}();

exports.default = WegenregisterAntwerpenIntegration;
},{"../OpenLR/map/Enum":41,"../OpenLR/map/Line":42,"../OpenLR/map/Node":44,"./FOWmappings/WegenregisterAntwerpenFowMorfMapping":19,"./FRCmappings/WegenregisterAntwerpenFrcWegcatMapping":21,"@babel/runtime/helpers/interopRequireDefault":3}],26:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _Enum = require("./map/Enum");

var _LineDecoder = _interopRequireDefault(require("./coder/LineDecoder"));

var OpenLRDecoder =
/*#__PURE__*/
function () {
  function OpenLRDecoder() {}

  // static decode(encoded,mapDataBase,decoderProperties){
  //     let decoderProp = {};
  //     let rangeIncreases = 0;
  //     for(let k in decoderProperties){
  //         if(decoderProperties.hasOwnProperty(k)){
  //             decoderProp[k] = decoderProperties[k];
  //         }
  //     }
  //     if(encoded.type === locationTypeEnum.LINE_LOCATION){
  //         try {
  //             return LineDecoder.decode(mapDataBase,encoded.LRPs,encoded.posOffset,encoded.negOffset,decoderProp);
  //         }
  //         catch(e){
  //             if(!decoderProp.alwaysUseProjections){
  //                 // if decoding fails without always using projections,
  //                 // try again with always using projections
  //                 decoderProp.alwaysUseProjections = true;
  //                 return LineDecoder.decode(mapDataBase,encoded.LRPs,encoded.posOffset,encoded.negOffset,decoderProp);
  //             }
  //             else{
  //                 while(rangeIncreases < decoderProp.maxDecodeRetries){
  //                     rangeIncreases++;
  //                     decoderProp.dist = decoderProp.dist * decoderProp.distMultiplierForRetry;
  //                     decoderProp.distanceToNextDiff = decoderProp.distanceToNextDiff * decoderProp.distMultiplierForRetry;
  //                     try {
  //                         return LineDecoder.decode(mapDataBase,encoded.LRPs,encoded.posOffset,encoded.negOffset,decoderProp);
  //                     }
  //                     catch(err){
  //                         if(rangeIncreases >= decoderProp.maxDecodeRetries){
  //                             throw(err)
  //                         }
  //                     }
  //                 }
  //                 throw(e); //re-throw the error
  //             }
  //         }
  //     }
  // }
  // //retry with bigger dist and use no proj and always proj each time
  OpenLRDecoder.decode = function decode(encoded, mapDataBase, decoderProperties) {
    var decoderProp = {};
    var rangeIncreases = 0;

    for (var k in decoderProperties) {
      if (decoderProperties.hasOwnProperty(k)) {
        decoderProp[k] = decoderProperties[k];
      }
    }

    if (decoderProp.maxDecodeRetries === undefined) {
      decoderProp.maxDecodeRetries = 0;
    }

    if (encoded.type === _Enum.locationTypeEnum.LINE_LOCATION) {
      while (rangeIncreases <= decoderProp.maxDecodeRetries) {
        try {
          return _LineDecoder.default.decode(mapDataBase, encoded.LRPs, encoded.posOffset, encoded.negOffset, decoderProp);
        } catch (e) {
          if (!decoderProp.alwaysUseProjections) {
            // if decoding fails without always using projections,
            // try again with always using projections
            decoderProp.alwaysUseProjections = true;
          } else {
            if (decoderProp.dist && decoderProp.distMultiplierForRetry && decoderProp.distanceToNextDiff) {
              rangeIncreases++;

              if (rangeIncreases > decoderProp.maxDecodeRetries) {
                throw e; //re-throw the error
              }

              var oldDist = decoderProp.dist;
              decoderProp.dist = decoderProp.dist * decoderProp.distMultiplierForRetry;
              decoderProp.distanceToNextDiff = decoderProp.distanceToNextDiff + (decoderProp.dist - oldDist) * 2;
              decoderProp.alwaysUseProjections = false;
            } else {
              throw e; //re-throw the error
            }
          }
        }
      }
    }
  } // //no retry mechanism
  // static decode(encoded,mapDataBase,decoderProperties){
  //     let decoderProp = {};
  //     for(let k in decoderProperties){
  //         if(decoderProperties.hasOwnProperty(k)){
  //             decoderProp[k] = decoderProperties[k];
  //         }
  //     }
  //     if(encoded.type === locationTypeEnum.LINE_LOCATION){
  //         return LineDecoder.decode(mapDataBase,encoded.LRPs,encoded.posOffset,encoded.negOffset,decoderProp);
  //     }
  // }
  ;

  return OpenLRDecoder;
}();

exports.default = OpenLRDecoder;
},{"./coder/LineDecoder":35,"./map/Enum":41,"@babel/runtime/helpers/interopRequireDefault":3}],27:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _Enum = require("./map/Enum");

var _LineEncoder = _interopRequireDefault(require("./coder/LineEncoder"));

var _JsonFormat = _interopRequireDefault(require("./coder/JsonFormat"));

var OpenLREncoder =
/*#__PURE__*/
function () {
  function OpenLREncoder() {}

  OpenLREncoder.encode = function encode(location, mapDataBase) {
    if (location.type === _Enum.locationTypeEnum.LINE_LOCATION) {
      var encoded = _LineEncoder.default.encode(mapDataBase, location.locationLines, location.posOffset, location.negOffset); // let result = JsonFormat.exportJson(locationTypeEnum.LINE_LOCATION,encoded.LRPs,encoded.posOffset,encoded.negOffset); //todo, should not happen here, but higher up


      return encoded;
    }
  };

  return OpenLREncoder;
}();

exports.default = OpenLREncoder;
},{"./coder/JsonFormat":33,"./coder/LineEncoder":36,"./map/Enum":41,"@babel/runtime/helpers/interopRequireDefault":3}],28:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _helpers = require("@turf/helpers");

var _GeoJSONRbushSearchTree = _interopRequireDefault(require("./GeoJSONRbushSearchTree"));

var RbushLineSearchTree =
/*#__PURE__*/
function (_GeoJSONRbushSearchTr) {
  (0, _inheritsLoose2.default)(RbushLineSearchTree, _GeoJSONRbushSearchTr);

  function RbushLineSearchTree(lines) {
    var _this;

    _this = _GeoJSONRbushSearchTr.call(this) || this;

    _this.addLines(lines);

    return _this;
  } //one line === Line object


  var _proto = RbushLineSearchTree.prototype;

  _proto.addLines = function addLines(lines) {
    var data = []; //todo: maybe this could already be made in the openlr integration classes to speed this up

    for (var id in lines) {
      if (lines.hasOwnProperty(id)) {
        if (lines[id].getStartNode() === undefined || lines[id].getEndNode() === undefined) {
          throw lines[id];
        }

        data.push((0, _helpers.lineString)([[lines[id].getStartNode().getLongitudeDeg(), lines[id].getStartNode().getLatitudeDeg()], [lines[id].getEndNode().getLongitudeDeg(), lines[id].getEndNode().getLatitudeDeg()]], {
          id: id
        }));
      }
    }

    this.tree.load(data);
  } //todo: remove lines
  ;

  return RbushLineSearchTree;
}(_GeoJSONRbushSearchTree.default);

exports.default = RbushLineSearchTree;
},{"./GeoJSONRbushSearchTree":30,"@babel/runtime/helpers/inheritsLoose":2,"@babel/runtime/helpers/interopRequireDefault":3,"@turf/helpers":9}],29:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _helpers = require("@turf/helpers");

var _GeoJSONRbushSearchTree = _interopRequireDefault(require("./GeoJSONRbushSearchTree"));

var GeoJSONRbushNodeSearchTree =
/*#__PURE__*/
function (_GeoJSONRbushSearchTr) {
  (0, _inheritsLoose2.default)(GeoJSONRbushNodeSearchTree, _GeoJSONRbushSearchTr);

  function GeoJSONRbushNodeSearchTree(nodes) {
    var _this;

    _this = _GeoJSONRbushSearchTr.call(this) || this;

    _this.addNodes(nodes);

    return _this;
  } // one node === Node object


  var _proto = GeoJSONRbushNodeSearchTree.prototype;

  _proto.addNodes = function addNodes(nodes) {
    var data = []; //todo: maybe this could already be made in the openlr integration classes to speed te initialisation up

    for (var id in nodes) {
      if (nodes.hasOwnProperty(id)) {
        if (isNaN(nodes[id].getLongitudeDeg()) || isNaN(nodes[id].getLatitudeDeg())) {
          throw nodes[id];
        }

        var p = (0, _helpers.point)([nodes[id].getLongitudeDeg(), nodes[id].getLatitudeDeg()], {
          id: id
        });
        data.push(p);
      }
    }

    this.tree.load(data);
  } //todo: remove nodes
  ;

  return GeoJSONRbushNodeSearchTree;
}(_GeoJSONRbushSearchTree.default);

exports.default = GeoJSONRbushNodeSearchTree;
},{"./GeoJSONRbushSearchTree":30,"@babel/runtime/helpers/inheritsLoose":2,"@babel/runtime/helpers/interopRequireDefault":3,"@turf/helpers":9}],30:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _geojsonRbush = _interopRequireDefault(require("geojson-rbush"));

var _helpers = require("@turf/helpers");

var GeoJSONRbushSearchTree =
/*#__PURE__*/
function () {
  function GeoJSONRbushSearchTree() {
    this.tree = (0, _geojsonRbush.default)();
  }

  var _proto = GeoJSONRbushSearchTree.prototype;

  _proto.addData = function addData(data) {
    this.tree.load(data);
  } //todo: remove data
  //dist given in meters
  //uses an approximate square bounding box around the given point, so it is possible that nodes/lines/data are returned that
  //are further than dist away. It is still necessary to iterate the returned nodes/lines/data and calculate their real distance.
  ;

  _proto.findCloseBy = function findCloseBy(lat, long, dist) {
    var earthRadius = 6371000;
    var latDiff = this.toDegrees(dist / earthRadius);
    var longDiff = this.toDegrees(dist / (Math.cos(this.toRadians(lat)) * earthRadius));
    var latUpper = lat + latDiff;
    var latLower = lat - latDiff;
    var longUpper = long + longDiff;
    var longLower = long - longDiff;
    var p = (0, _helpers.polygon)([[[longLower, latLower], [longLower, latUpper], [longUpper, latUpper], [longUpper, latLower], [longLower, latLower]]]);
    var r = this.tree.search(p);
    return r.features;
  };

  _proto.toRadians = function toRadians(degrees) {
    return degrees * Math.PI / 180;
  };

  _proto.toDegrees = function toDegrees(radians) {
    return radians / Math.PI * 180;
  };

  return GeoJSONRbushSearchTree;
}();

exports.default = GeoJSONRbushSearchTree;
},{"@babel/runtime/helpers/interopRequireDefault":3,"@turf/helpers":9,"geojson-rbush":46}],31:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.configProperties = exports.decoderProperties = void 0;

var _Enum = require("../map/Enum");

var decoderProperties = {
  dist: 5,
  //maximum distance (in meter) of a candidate node to a LRP
  bearDiff: 60,
  //maximum difference (in degrees) between the bearing of a candidate node and that of a LRP
  frcDiff: 3,
  //maximum difference between the FRC of a candidate node and that of a LRP
  lfrcnpDiff: 3,
  //maximum difference between the lowest FRC until next point of a candidate node and that of a LRP
  distanceToNextDiff: 40,
  //maximum difference (in meter) between the found distance between 2 LRPs and the given distanceToNext of the first LRP
  alwaysUseProjections: false,
  useFrcFow: true,
  distMultiplier: 40,
  frcMultiplier: 35,
  fowMultiplier: 40,
  bearMultiplier: 30,
  maxSPSearchRetries: 200,
  maxDecodeRetries: 2,
  distMultiplierForRetry: 2
};
exports.decoderProperties = decoderProperties;
var configProperties = {
  bearDist: 20,
  // in meter!!
  internalPrecision: _Enum.internalPrecisionEnum.CENTIMETER
};
exports.configProperties = configProperties;
},{"../map/Enum":41}],32:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _heap = _interopRequireDefault(require("heap"));

var _Enum = require("../map/Enum");

var Dijkstra =
/*#__PURE__*/
function () {
  function Dijkstra() {}

  Dijkstra.shortestPath = function shortestPath(startNode, endNode, options) {
    if (startNode.getID() === endNode.getID()) {
      return {
        lines: [],
        length: 0 //integer value in the unit of internal precision!

      };
    }

    var minLengths = {};
    var followedLine = {};
    var heap = new _heap.default(function (a, b) {
      if (a[0] < b[0]) {
        return -1;
      }

      if (b[0] < a[0]) {
        return 1;
      }

      return 0;
    }); // push start node on heap with length 0

    heap.push([0, startNode]);
    minLengths[startNode.getID()] = 0;

    var _loop = function _loop() {
      var heapTop = heap.pop();
      var currentNode = heapTop[1];
      currentNode.getOutgoingLines().forEach(function (line) {
        var length = minLengths[currentNode.getID()] + line.getLength();

        if (length < 0) {
          throw Error("negative line length found for line: " + line.getID());
        }

        var validLine = options === undefined || options.lfrcnp === undefined || options.lfrcnpDiff === undefined || line.getFRC() === undefined ? 1 : 0 || line.getFRC() >= _Enum.frcEnum.FRC_0 && line.getFRC() <= _Enum.frcEnum.FRC_7 && line.getFRC() <= options.lfrcnpDiff + options.lfrcnp;

        if (validLine && (minLengths[line.getEndNode().getID()] === undefined || minLengths[line.getEndNode().getID()] > length)) {
          minLengths[line.getEndNode().getID()] = length;
          followedLine[line.getEndNode().getID()] = line;

          if (minLengths[endNode.getID()] === undefined || length < minLengths[endNode.getID()]) {
            // this Dijkstra algorithm is only interested in the shortest path between the startNode and the endNode,
            // not in the shortest paths between the startNode and any other node, so if a length is already longer
            // than the current shortest path to the endNode, we won't push it to the stack
            if (options !== undefined && options.maxDist !== undefined) {
              // if a max distance is given, the shortest path can not be longer than this max distance
              // (which means that nodes that have a eagle's eye distance longer than this max distance)
              // which means that nodes that have a distance that already is longer than this max distance
              // will never be part of the shortest path we want to calculate
              //
              // , and the shortest path foound in this way would always be discarded
              // since the total distance would always be longer than
              // the max distance (which is the distanceToNextLrp + decoderProperties.dist)
              // OR
              // , (when using in Encoder) we know the shortest path we want in advance and calculate it's
              // length (the length between the very first and very last LRP) and use that as the maximum
              //
              // so we can speed up this SP calculation by not taking these nodes into account
              if (length <= options.maxDist) {
                heap.push([length, line.getEndNode()]);
              }
            } else {
              heap.push([length, line.getEndNode()]);
            }
          }
        }
      });
    };

    while (heap.size() > 0) {
      _loop();
    }

    var shortestPathLines = [];
    var lastStep = endNode;

    while (lastStep.getID() !== startNode.getID() && followedLine[lastStep.getID()] !== undefined) {
      var line = followedLine[lastStep.getID()];
      shortestPathLines.unshift(line);
      lastStep = line.getStartNode();
    } //if length is 0, and lines = [], the startnode was equal to the endnode
    //if length is undefined and lines = [], there isn't a path between the startnode and endnode


    if (minLengths[endNode.getID()] === 0) {
      throw Error("Something went wrong during Shortest Path calculation, probably because lines exist with 0 or negative lengths");
    }

    return {
      lines: shortestPathLines,
      length: minLengths[endNode.getID()] //integer value in meter!

    };
  };

  return Dijkstra;
}();

exports.default = Dijkstra;
},{"../map/Enum":41,"@babel/runtime/helpers/interopRequireDefault":3,"heap":47}],33:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.default = void 0;

var _Enum = require("../map/Enum");

var JsonFormat =
/*#__PURE__*/
function () {
  function JsonFormat() {}

  JsonFormat.exportJson = function exportJson(type, LRPs, posOffset, negOffset) {
    if (type === _Enum.locationTypeEnum.LINE_LOCATION) {
      return this.exportLineLocation(LRPs, posOffset, negOffset);
    }
  };

  JsonFormat.exportLineLocation = function exportLineLocation(LRPs, posOffset, negOffset) {
    var jsonObj = {
      "type": "RawLineLocationReference",
      "properties": {
        "_id": "binary",
        "_locationType": 1,
        "_returnCode": null,
        "_points": {
          "type": "Array",
          "properties": []
        },
        "_offsets": {
          "type": "Offsets",
          "properties": {
            "_pOffset": posOffset,
            "_pOffRelative": 0,
            "_nOffset": negOffset,
            "_nOffRelative": 0,
            "_version": 3
          }
        }
      }
    };

    for (var i = 0; i < LRPs.length; i++) {
      jsonObj.properties["_points"].properties.push({
        "type": "LocationReferencePoint",
        "properties": {
          "_bearing": LRPs[i].bearing,
          "_distanceToNext": LRPs[i].distanceToNext,
          "_frc": LRPs[i].frc,
          "_fow": LRPs[i].fow,
          "_lfrcnp": LRPs[i].lfrcnp,
          "_isLast": LRPs[i].isLast,
          "_longitude": LRPs[i].lat,
          "_latitude": LRPs[i].long,
          "_sequenceNumber": LRPs[i].seqNr
        }
      });
    }

    return jsonObj;
  };

  return JsonFormat;
}();

exports.default = JsonFormat;
},{"../map/Enum":41}],34:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _LocationReferencePoint = _interopRequireDefault(require("./LocationReferencePoint"));

var _Enum = require("../map/Enum");

// import {point} from '@turf/helpers'
// import bearing from '@turf/bearing'
// import {configProperties} from "./CoderSettings";
var LRPNodeHelper =
/*#__PURE__*/
function () {
  function LRPNodeHelper() {}

  LRPNodeHelper.lrpLinesToLRPs = function lrpLinesToLRPs(lrpLines, shortestPaths) {
    if (lrpLines.length < 2) {
      throw Error("not enough LRP lines");
    }

    var LRPs = [];

    for (var i = 0; i < lrpLines.length; i++) {
      var properties = {};
      var isLast = false;
      var frc = lrpLines[i].getFRC();
      var fow = lrpLines[i].getFOW();
      var lat = void 0;
      var long = void 0;
      var distanceToNext = void 0;
      var bearing = void 0;
      var lfrcnp = void 0;

      if (i < lrpLines.length - 1) {
        properties = this.calcProperties(shortestPaths[i].lines, lrpLines[i + 1].getStartNode());
        lat = lrpLines[i].getStartNode().getLatitudeDeg();
        long = lrpLines[i].getStartNode().getLongitudeDeg();
        bearing = lrpLines[i].getBearing();
        lfrcnp = properties.lfrcnp;
        distanceToNext = lrpLines[i].getLength() + properties.pathLength;

        if (i === lrpLines.length - 2 && lrpLines[lrpLines.length - 2].getID() !== lrpLines[lrpLines.length - 1].getID()) {
          distanceToNext += lrpLines[lrpLines.length - 1].getLength();
        }
      } else {
        isLast = true;
        lat = lrpLines[i].getEndNode().getLatitudeDeg();
        long = lrpLines[i].getEndNode().getLongitudeDeg();
        bearing = lrpLines[i].getReverseBearing();
        lfrcnp = _Enum.frcEnum.FRC_7;
        distanceToNext = 0;
      }

      var LRP = new _LocationReferencePoint.default(bearing, distanceToNext, frc, fow, lfrcnp, isLast, lat, long, i + 1);
      LRPs.push(LRP);
    }

    return LRPs;
  };

  LRPNodeHelper.calcProperties = function calcProperties(shortestPath, nextNode) {
    var i = 0;
    var pathLength = 0;
    var leastFRCtillNextPoint = _Enum.frcEnum.FRC_0;
    var frcIsDefined = false;

    while (i < shortestPath.length && shortestPath[i].getStartNode() !== nextNode) {
      pathLength += shortestPath[i].getLength();

      if (shortestPath[i].getFRC() !== undefined && shortestPath[i].getFRC() > leastFRCtillNextPoint) {
        leastFRCtillNextPoint = shortestPath[i].getFRC();
        frcIsDefined = true;
      }

      i++;
    }

    return {
      pathLength: pathLength,
      lfrcnp: frcIsDefined ? leastFRCtillNextPoint : _Enum.frcEnum.FRC_7
    };
  }
  /*
  " The bearing (BEAR) describes the angle between the true North and a line which is defined by the
  coordinate of the LR-point and a coordinate which is BEARDIST along the line defined by the LR-point attributes.
  If the line length is less than BEARDIST then the opposite point of the line is used
  (regardless of BEARDIST). The bearing is measured in degrees and always positive (measuring
  clockwise from North). "
  <- http://www.openlr.org/data/docs/OpenLR-Whitepaper_v1.5.pdf
   */
  // static calcProperties(beardist,node,shortestPath,nextNode){
  //     //find the position beardist meters on the path, unless the next LRP is closer than 20 meters
  //     let i = 0;
  //     let pathLength = 0;
  //     let calcBear = undefined;
  //     let leastFRCtillNextPoint = frcEnum.FRC_7;
  //     while(i < shortestPath.length && shortestPath[i].getStartNode() !== nextNode){
  //         if(calcBear === undefined && pathLength+shortestPath[i].getLength() > 20){
  //             // the bearingdist point lays on this line
  //             let distanceFromLRP = beardist - pathLength;
  //             let bearDistLoc = shortestPath[i].getGeoCoordinateAlongLine(distanceFromLRP);
  //             let lrpPoint = point([node.getLatitudeDeg(), node.getLongitudeDeg()]);
  //             let bearDistPoint = point([bearDistLoc.lat,bearDistLoc.long]);
  //
  //             calcBear = bearing(lrpPoint, bearDistPoint);
  //             if(calcBear < 0){
  //                 // bear is always positive, counterclockwise
  //                 calcBear += 360;
  //             }
  //         }
  //         pathLength += shortestPath[i].getLength();
  //         if(shortestPath[i].getFRC() !== undefined && shortestPath[i].getFRC() < leastFRCtillNextPoint){
  //             leastFRCtillNextPoint = shortestPath[i].getFRC();
  //         }
  //         i++;
  //     }
  //     if(calcBear === undefined){
  //         //means that the next LRP lays earlier than the beardist point
  //         let lrpPoint = point([node.getLatitudeDeg(), node.getLongitudeDeg()]);
  //         let nextLrpPoint = point([nextNode.getLatitudeDeg(), nextNode.getLongitudeDeg()]);
  //
  //         calcBear = bearing(lrpPoint, nextLrpPoint);
  //         if(calcBear < 0){
  //             // bear is always positive, counterclockwise
  //             calcBear += 360;
  //         }
  //     }
  //     return {
  //         bearing: calcBear,
  //         pathLength: pathLength,
  //         lfrcnp: leastFRCtillNextPoint
  //     }
  // }
  //
  // static calcLastLRPProperties(beardist,prevNode,shortestPath,lastNode){
  //     //find the position beardist meters away from the end of the path, unless the previous LRP is closer than 20 meters
  //     let i = 0;
  //     let calcBear = undefined;
  //     let leastFRCtillNextPoint = frcEnum.FRC_0;
  //     while(i < shortestPath.length && shortestPath[i].getStartNode() !== lastNode){
  //         if(shortestPath[i].getFRC() !== undefined && shortestPath[i].getFRC() < leastFRCtillNextPoint){
  //             leastFRCtillNextPoint = shortestPath[i].getFRC();
  //         }
  //         i++;
  //     }
  //     i--;
  //     let reverseLength = 0;
  //     while(i > 0 && calcBear === undefined){
  //         if(reverseLength+shortestPath[i].getLength() > beardist){
  //             // the bearingdist point lays on this line
  //             let distance = reverseLength+shortestPath[i].getLength()-beardist;
  //             let bearDistLoc = shortestPath[i].getGeoCoordinateAlongLine(distance);
  //             let lrpPoint = point([lastNode.getLatitudeDeg(), lastNode.getLongitudeDeg()]);
  //             let bearDistPoint = point([bearDistLoc.lat,bearDistLoc.long]);
  //
  //             calcBear = bearing(lrpPoint, bearDistPoint);
  //             if(calcBear < 0){
  //                 // bear is always positive, counterclockwise
  //                 calcBear += 360;
  //             }
  //         }
  //         i--;
  //     }
  //     if(calcBear === undefined){
  //         //means that the previous LRP lays further than the beardist point
  //         let lrpPoint = point([lastNode.getLatitudeDeg(), lastNode.getLongitudeDeg()]);
  //         let prevLrpPoint = point([prevNode.getLatitudeDeg(), prevNode.getLongitudeDeg()]);
  //
  //         calcBear = bearing(lrpPoint, prevLrpPoint);
  //         if(calcBear < 0){
  //             // bear is always positive, counterclockwise
  //             calcBear += 360;
  //         }
  //     }
  //
  //     return {
  //         bearing: calcBear,
  //         pathLength: 0,
  //         lfrcnp: leastFRCtillNextPoint
  //     }
  // }
  ;

  return LRPNodeHelper;
}();

exports.default = LRPNodeHelper;
},{"../map/Enum":41,"./LocationReferencePoint":38,"@babel/runtime/helpers/interopRequireDefault":3}],35:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _Enum = require("../map/Enum");

var _Dijkstra = _interopRequireDefault(require("./Dijkstra"));

var _CoderSettings = require("./CoderSettings");

var LineDecoder =
/*#__PURE__*/
function () {
  function LineDecoder() {}

  LineDecoder.decode = function decode(mapDataBase, LRPs, posOffset, negOffset, decoderProperties) {
    // 2: For each location reference point find candidate nodes
    var candidateNodes = LineDecoder.findCandidatesOrProjections(mapDataBase, LRPs, decoderProperties); // 3: For each location reference point find candidate lines
    // 4: Rate candidate lines for each location reference point

    var candidateLines = LineDecoder.findCandidateLines(LRPs, candidateNodes, decoderProperties); // 5: Determine shortest-path(s) between two subsequent location reference points
    // 6: Check validity of the calculated shortest-path(s)
    // 7: Concatenate shortest-path(s) to form the location

    var concatShortestPath = LineDecoder.determineShortestPaths(candidateLines, LRPs, decoderProperties); // 7: and trim according to the offsets

    var offsets = {
      posOffset: Math.round(posOffset * _CoderSettings.configProperties.internalPrecision),
      negOffset: Math.round(negOffset * _CoderSettings.configProperties.internalPrecision)
    };
    LineDecoder.trimAccordingToOffsets(concatShortestPath, offsets, decoderProperties);
    return {
      lines: concatShortestPath.shortestPath,
      posOffset: Math.round(offsets.posOffset / _CoderSettings.configProperties.internalPrecision),
      negOffset: Math.round(offsets.negOffset / _CoderSettings.configProperties.internalPrecision)
    };
  };

  LineDecoder.findCandidatesOrProjections = function findCandidatesOrProjections(mapDataBase, LRPs, decoderProperties) {
    var candidates = [];

    var _loop = function _loop(i) {
      candidates[i] = []; //find nodes whereby the coordinates of the candidate nodes are close to the coordinates of the location reference point

      var nodes = mapDataBase.findNodesCloseByCoordinate(LRPs[i].lat, LRPs[i].long, decoderProperties.dist * _CoderSettings.configProperties.internalPrecision); //if no candidate nodes are found
      //the direct search of lines using a projection point may also be executed even if candidate nodes are found. (set in decoderProperties)

      if (nodes.length !== 0) {
        Array.prototype.push.apply(candidates[i], nodes);
      }

      if (nodes.length === 0 || decoderProperties.alwaysUseProjections) {
        //determine candidate line directly by projecting the LRP on a line not far away form the coordinate
        var closeByLines = mapDataBase.findLinesCloseByCoordinate(LRPs[i].lat, LRPs[i].long, decoderProperties.dist * _CoderSettings.configProperties.internalPrecision);

        if (closeByLines.length === 0 && nodes.length === 0) {
          throw Error("No candidate nodes or projected nodes can be found.");
        }

        var projectedPoints = [];
        closeByLines.forEach(function (line) {
          var location = line.line.measureAlongLine(LRPs[i].lat, LRPs[i].long);

          if (location.lat === line.line.getStartNode().getLatitudeDeg() || location.lat === line.line.getEndNode().getLatitudeDeg() || location.long === line.line.getStartNode().getLongitudeDeg() || location.long === line.line.getEndNode().getLongitudeDeg()) {//console.log("The found projection point is the same as the start or end node of the line, so it should already be covered by the findNodesCloseByCoordinate function.");
          } else {
            location.line = line.line;
            location.dist = line.dist;
            projectedPoints.push(location);
          }
        });
        Array.prototype.push.apply(candidates[i], projectedPoints);
      }
    };

    for (var i = 0; i < LRPs.length; i++) {
      _loop(i);
    }

    return candidates;
  } //lat, long and bearing should never be undefined
  ;

  LineDecoder.findCandidateLines = function findCandidateLines(LRPs, candidateNodes, decoderProperties) {
    var candidateLines = [];

    var _loop2 = function _loop2(i) {
      candidateLines[i] = []; //check the outgoing lines of the candidateNodes

      candidateNodes[i].forEach(function (node) {
        if (node.node === undefined) {
          //the node is a projection point
          var bearDiff = i === LRPs.length - 1 ? Math.abs(node.line.getReverseBearing() - LRPs[LRPs.length - 1].bearing) : Math.abs(node.line.getBearing() - LRPs[i].bearing);
          var frcDiff;

          if (decoderProperties.useFrcFow && node.line.getFRC() !== undefined && node.line.getFRC() >= _Enum.frcEnum.FRC_0 && node.line.getFRC() <= _Enum.frcEnum.FRC_7 && LRPs[i].frc !== undefined) {
            frcDiff = Math.abs(node.line.getFRC() - LRPs[i].frc);
          } // note: fow isn't hierarchical, so a difference can't be computed


          if (bearDiff <= decoderProperties.bearDiff && (frcDiff === undefined ? true : frcDiff <= decoderProperties.frcDiff)) {
            //the bearing,frc and fow values are close so this line could be a good candidate
            var candidate = {
              line: node.line,
              bearDiff: bearDiff,
              frcDiff: frcDiff,
              lrpIndex: i,
              projected: true,
              rating: undefined,
              // if the node is projected, not the full length of the line should be taken in the calculation of the distance between LRPs,
              // but only to (or from) the location of the projected point
              distToProjection: node.line.getStartNode().getDistance(node.lat, node.long)
            };
            candidate.rating = LineDecoder.rateCandidateLine(candidate, node.dist, LRPs[candidate.lrpIndex], decoderProperties);
            candidateLines[i].push(candidate);
          }
        } else {
          //the node exists in the database and possibly has multiple outgoing lines
          var lines = i === LRPs.length - 1 ? node.node.getIncomingLines() : node.node.getOutgoingLines(); //for the last LRP, check the incoming lines

          lines.forEach(function (line) {
            var bearDiff = i === LRPs.length - 1 ? Math.abs(line.getReverseBearing() - LRPs[LRPs.length - 1].bearing) : Math.abs(line.getBearing() - LRPs[i].bearing);
            var frcDiff;

            if (decoderProperties.useFrcFow && line.getFRC() !== undefined && line.getFRC() >= _Enum.frcEnum.FRC_0 && line.getFRC() <= _Enum.frcEnum.FRC_7 && LRPs[i].frc !== undefined) {
              frcDiff = Math.abs(line.getFRC() - LRPs[i].frc);
            }

            if (bearDiff <= decoderProperties.bearDiff && (frcDiff === undefined ? true : frcDiff <= decoderProperties.frcDiff)) {
              //the bearing,frc and fow values are close so this line could be a good candidate
              var _candidate = {
                line: line,
                bearDiff: bearDiff,
                frcDiff: frcDiff,
                lrpIndex: i,
                projected: false,
                rating: undefined,
                //if the LRP was not projected, use the node ID to detect if multiple LRPs would be mapped to the same node (WITHOUT PROJECTIONS)
                candidateNodeID: node.node.getID()
              };
              _candidate.rating = LineDecoder.rateCandidateLine(_candidate, node.dist, LRPs[_candidate.lrpIndex], decoderProperties);
              candidateLines[i].push(_candidate);
            }
          });
        }
      }); //if no candidate line can be found for a location reference point, the decoder should
      //report an error and stop further processing

      if (candidateLines[i].length === 0) {
        throw Error("No candidate lines found for LRP");
      }

      LineDecoder.sortLines(candidateLines[i]);
    };

    for (var i = 0; i < LRPs.length; i++) {
      _loop2(i);
    }

    return candidateLines;
  };

  LineDecoder.sortLines = function sortLines(lines) {
    //sort candidate lines on closest matching based on distance, bearing, frc and fow
    lines.sort(function (a, b) {
      //the lower the rating, the better the match is
      return a.rating - b.rating;
    });
  };

  LineDecoder.rateCandidateLine = function rateCandidateLine(candidateLine, distance, lrp, decoderProperties) {
    var rating = 0;
    var maxRating = 0; // the start node, end node for the last location reference point or projection point
    // shall be as close as possible to the coordinates of the location reference point
    // let distance = Math.abs(calcDistance(matchingNode.lat,matchingNode.long,lrp.lat,lrp.long));
    // distance = Math.abs(distance);

    var distanceRating = distance / (decoderProperties.dist * _CoderSettings.configProperties.internalPrecision);
    rating += distanceRating * decoderProperties.distMultiplier;
    maxRating += decoderProperties.distMultiplier; // the functional road class of the candidate line should match the functional road class
    // of the location reference point

    if (decoderProperties.useFrcFow && candidateLine.frcDiff !== undefined) {
      var frcRating = candidateLine.frcDiff / decoderProperties.frcDiff;
      rating += frcRating * decoderProperties.frcMultiplier;
      maxRating += decoderProperties.frcMultiplier;
    } // the form of way of the candidate line should match the form of way of the location reference point
    // form of way isn't hierarchical so it either does or does not match


    if (decoderProperties.useFrcFow && candidateLine.line.getFOW() !== undefined && candidateLine.line.getFOW() >= _Enum.fowEnum.UNDEFINED && candidateLine.line.getFOW() <= _Enum.fowEnum.OTHER && lrp.fow !== undefined && lrp.fow >= _Enum.fowEnum.UNDEFINED && lrp.fow <= _Enum.fowEnum.OTHER) {
      var fowRating = candidateLine.line.getFOW() === lrp.fow ? 0 : 1;
      rating += fowRating * decoderProperties.fowMultiplier;
      maxRating += decoderProperties.fowMultiplier;
    } //the bearing of the candidate line should match indicated bearing angles of the location reference point


    var bearRating = candidateLine.bearDiff / decoderProperties.bearDiff;
    rating += bearRating * decoderProperties.bearMultiplier;
    maxRating += decoderProperties.bearMultiplier;
    return rating / maxRating;
  };

  LineDecoder.findShortestPath = function findShortestPath(startLine, endLine, lfrcnp, decoderProperties, distanceToNext) {
    // if(startLine.startNode === endLine.endNode){
    //     console.log("The first LRP starts in the same point where the second LRP ends. If no valid shortest path is found, retry with projections.");
    // }
    if (startLine.getID() === endLine.getID()) {
      return {
        lines: [],
        length: 0
      };
    } else {
      return _Dijkstra.default.shortestPath(startLine.getEndNode(), endLine.getStartNode(), {
        lfrcnp: decoderProperties.useFrcFow ? lfrcnp : undefined,
        lfrcnpDiff: decoderProperties.useFrcFow ? decoderProperties.lfrcnpDiff : undefined,
        maxDist: distanceToNext !== undefined ? decoderProperties.distanceToNextDiff * _CoderSettings.configProperties.internalPrecision + distanceToNext : undefined
      });
    }
  };

  LineDecoder.calcSPforLRP = function calcSPforLRP(candidateLines, candidateIndexes, lrpIndex, tries, shortestPaths, LRPs, decoderProperties) {
    if (lrpIndex >= LRPs.length - 1) {
      throw Error("SP calculation should not happen for the last LRP");
    }

    var shortestPath = undefined;

    if (candidateIndexes[lrpIndex] === undefined) {
      candidateIndexes[lrpIndex] = 0;
    }

    if (candidateIndexes[lrpIndex + 1] === undefined) {
      candidateIndexes[lrpIndex + 1] = 0;
    }

    var prevEndChanged = false;
    var prevEndCandidateIndex = candidateIndexes[lrpIndex + 1];
    var distanceBetweenLRP = undefined;
    var distanceBetweenLRPCompensation = 0;

    while (shortestPath === undefined //first time shortestPath is always undefined, so this loop runs minimum 1 time
    && tries.count < decoderProperties.maxSPSearchRetries) {
      shortestPath = LineDecoder.findShortestPath(candidateLines[lrpIndex][candidateIndexes[lrpIndex]].line, candidateLines[lrpIndex + 1][candidateIndexes[lrpIndex + 1]].line, LRPs[lrpIndex].lfrcnp, decoderProperties, LRPs[lrpIndex].distanceToNext * _CoderSettings.configProperties.internalPrecision); // if the current and next LRP had the same real (NOT PROJECTED) node, the distance between them should be 0

      if (candidateLines[lrpIndex + 1][candidateIndexes[lrpIndex + 1]].projected === false //the current LRP is not projected
      && candidateLines[lrpIndex][candidateIndexes[lrpIndex]].projected === false //the next LRP is not projected
      && candidateLines[lrpIndex + 1][candidateIndexes[lrpIndex + 1]].candidateNodeID === candidateLines[lrpIndex][candidateIndexes[lrpIndex]].candidateNodeID //their conforming node is the same
      ) {
          // the distance to the next LRP is 0. The findShortestPath method should have returned {lines: [], length: 0}.
          distanceBetweenLRP = 0;
        } else {
        // the total length of the first line can be added to distanceBetweenLRP
        distanceBetweenLRP = candidateLines[lrpIndex][candidateIndexes[lrpIndex]].line.getLength();
      }

      if (candidateLines[lrpIndex][candidateIndexes[lrpIndex]].projected === true) {
        // this first line was found by using a projection, the total distance between this LRP and the next should be lowered
        // by the length at which the projection can be found
        distanceBetweenLRPCompensation += -1 * candidateLines[lrpIndex][candidateIndexes[lrpIndex]].distToProjection;
      }

      if (candidateLines[lrpIndex + 1][candidateIndexes[lrpIndex + 1]].projected === true) {
        // next line was found by using a projection, the total distance between this LRP and the next should be heightened
        // by the length at which the projection can be found
        distanceBetweenLRPCompensation += +1 * candidateLines[lrpIndex + 1][candidateIndexes[lrpIndex + 1]].distToProjection; // if the next line was the same as this line, the length of the line should be subtracted
        // because we already added it's length to distanceBetweenLRP

        if (candidateLines[lrpIndex + 1][candidateIndexes[lrpIndex + 1]].line.getID() === candidateLines[lrpIndex][candidateIndexes[lrpIndex]].line.getID()) {
          distanceBetweenLRP -= candidateLines[lrpIndex + 1][candidateIndexes[lrpIndex + 1]].line.getLength();
        }
      }

      if (lrpIndex === LRPs.length - 2 // if this is the second last LRP
      && candidateLines[lrpIndex + 1][candidateIndexes[lrpIndex + 1]].line.getID() !== candidateLines[lrpIndex][candidateIndexes[lrpIndex]].line.getID() // and the line of this LRP isn't the same as the line of the last LRP (if it would be the same, it's length was already added)
      && candidateLines[lrpIndex + 1][candidateIndexes[lrpIndex + 1]].projected === false // the length of the last line shouldn't be added if it was projected, because it's length is already compensated in distanceBetweenLRPCompensation
      ) {
          distanceBetweenLRP += candidateLines[lrpIndex + 1][candidateIndexes[lrpIndex + 1]].line.getLength();
        }

      if (shortestPath.length !== undefined) {
        //if the shortest path has a length, it should be added to distanceBetweenLRP
        //if it doesn't, the while loop will restart because shortestPath.length === undefined
        distanceBetweenLRP += shortestPath.length;
      } // console.warn(distanceBetweenLRP,distanceBetweenLRPCompensation,LRPs[lrpIndex].distanceToNext,decoderProperties.distanceToNextDiff);


      if (shortestPath === undefined || shortestPath.length === undefined || Math.abs(distanceBetweenLRP + distanceBetweenLRPCompensation - LRPs[lrpIndex].distanceToNext * _CoderSettings.configProperties.internalPrecision) >= decoderProperties.distanceToNextDiff * _CoderSettings.configProperties.internalPrecision) // check validity (step 6 of decoding)
        {
          if (candidateIndexes[lrpIndex + 1] < candidateLines[lrpIndex + 1].length - 1) {
            //we can try a different end line (which has our preference because it can't change previous path calculations)
            candidateIndexes[lrpIndex + 1]++; //manually reset shortestPath to trigger while loop rerun

            shortestPath = undefined;
          } else if (candidateIndexes[lrpIndex] < candidateLines[lrpIndex].length - 1) {
            //we can try a different start line (which might change the end line of the shortest path calculation of our previous LRP)
            candidateIndexes[lrpIndex]++; //we should reset the index of the end line to the previously tried end line
            //is 0 unless this method is called recursively because our end line changed further in the LRP list

            candidateIndexes[lrpIndex + 1] = prevEndCandidateIndex;
            prevEndChanged = true; //manually reset shortestPath to trigger while loop rerun

            shortestPath = undefined;
          } else {
            throw Error("No shortest path could be found between the given LRPs with indexes " + lrpIndex + " and " + (lrpIndex + 1) + " You either tried to decode a loop that isn't present in the current map " + "or you tried decoding a line between two points that are to close together and decoded as a single node");
          }
        }

      tries.count++;
    }

    if (shortestPath === undefined || shortestPath.length === undefined) {
      throw Error("could not construct a shortest path in the given amount of tries between the given LRPs with indexes " + lrpIndex + " and " + (lrpIndex + 1));
    }

    shortestPaths[lrpIndex] = shortestPath;

    if (prevEndChanged && lrpIndex - 1 >= 0) {
      // we changed the start line of for this LRP, which means the end line of the last LRP is changed and it's shortest path should be recalculated
      // this can happen recursively until we reach our first LRP
      // console.log("Start Line adjusted, recalculate path for previous LRP");
      shortestPaths[lrpIndex - 1] = LineDecoder.calcSPforLRP(candidateLines, candidateIndexes, lrpIndex - 1, tries, shortestPaths, LRPs, decoderProperties);
    }
  };

  LineDecoder.determineShortestPaths = function determineShortestPaths(candidateLines, LRPs, decoderProperties) {
    var shortestPaths = [];
    var candidateIndexes = [];
    var tries = {
      count: 0
    };

    for (var i = 0; i < candidateLines.length - 1; i++) {
      LineDecoder.calcSPforLRP(candidateLines, candidateIndexes, i, tries, shortestPaths, LRPs, decoderProperties);
    }

    return LineDecoder.concatSP(shortestPaths, candidateLines, candidateIndexes);
  };

  LineDecoder.concatSP = function concatSP(shortestPaths, candidateLines, candidateIndexes) {
    if (shortestPaths.length !== candidateLines.length - 1) {
      throw Error("length of shortestPaths !== length of candidateLines-1");
    }

    var concatenatedShortestPath = [];

    for (var i = 0; i < shortestPaths.length; i++) {
      if (concatenatedShortestPath.length === 0 || candidateLines[i][candidateIndexes[i]].line.getID() !== concatenatedShortestPath[concatenatedShortestPath.length - 1].getID()) {
        // if the line to add isn't the same as the last line added (could be the same if two LRPs are mapped or projected on the same line)
        concatenatedShortestPath.push(candidateLines[i][candidateIndexes[i]].line); //add the startLine of the LRP (endline if last LRP)
      }

      for (var j = 0; j < shortestPaths[i].lines.length; j++) {
        concatenatedShortestPath.push(shortestPaths[i].lines[j]);
      }
    }

    if (concatenatedShortestPath.length === 0 || candidateLines[candidateLines.length - 1][candidateIndexes[candidateIndexes.length - 1]].line.getID() !== concatenatedShortestPath[concatenatedShortestPath.length - 1].getID()) {
      // if the line to add isn't the same as the last line added (could be the same if two LRPs are mapped or projected on the same line)
      concatenatedShortestPath.push(candidateLines[candidateLines.length - 1][candidateIndexes[candidateIndexes.length - 1]].line); // add the line of the last LRP
    }

    return {
      shortestPath: concatenatedShortestPath,
      posProjDist: candidateLines[0][candidateIndexes[0]].distToProjection === undefined ? 0 : candidateLines[0][candidateIndexes[0]].distToProjection,
      negProjDist: candidateLines[candidateLines.length - 1][candidateIndexes[candidateIndexes.length - 1]].distToProjection === undefined ? 0 : candidateLines[candidateLines.length - 1][candidateIndexes[candidateIndexes.length - 1]].line.getLength() - candidateLines[candidateLines.length - 1][candidateIndexes[candidateIndexes.length - 1]].distToProjection
    };
  } // static trimAccordingToOffsets(concatShortestPath,offsets){
  //     offsets.posOffset+=concatShortestPath.posProjDist;
  //     offsets.negOffset+=concatShortestPath.negProjDist;
  //     if(concatShortestPath.shortestPath.length === 0){
  //         throw Error("can't trim empty path");
  //     }
  //     let firstLine = concatShortestPath.shortestPath[0];
  //     while(offsets.posOffset > 0 && firstLine !== undefined && firstLine.getLength()<=offsets.posOffset){
  //         offsets.posOffset  -= firstLine.getLength();
  //         concatShortestPath.shortestPath.shift();
  //         firstLine = concatShortestPath.shortestPath[0];
  //     }
  //     let lastLine = concatShortestPath.shortestPath[concatShortestPath.shortestPath.length-1];
  //     while(offsets.negOffset > 0 && lastLine !== undefined && lastLine.getLength()<=offsets.negOffset){
  //         offsets.negOffset -= lastLine.getLength();
  //         concatShortestPath.shortestPath.pop();
  //         lastLine = concatShortestPath.shortestPath[concatShortestPath.shortestPath.length-1];
  //     }
  //     if(concatShortestPath.shortestPath.length === 0){
  //         throw Error("The remaining shortest path after trimming according to offsets is empty.");
  //     }
  // }
  // static trimAccordingToOffsets(concatShortestPath,offsets,decoderProperties){
  //     offsets.posOffset+=concatShortestPath.posProjDist;
  //     offsets.negOffset+=concatShortestPath.negProjDist;
  //     if(concatShortestPath.shortestPath.length === 0){
  //         throw Error("can't trim empty path");
  //     }
  //     let firstLine = concatShortestPath.shortestPath[0];
  //     while(offsets.posOffset > 0 && firstLine !== undefined && firstLine.getLength()<=offsets.posOffset && offsets.posOffset-firstLine.getLength() >= (decoderProperties.distanceToNextDiff*decoderProperties.internalPrecision)){
  //         offsets.posOffset  -= firstLine.getLength();
  //         concatShortestPath.shortestPath.shift();
  //         firstLine = concatShortestPath.shortestPath[0];
  //     }
  //     let lastLine = concatShortestPath.shortestPath[concatShortestPath.shortestPath.length-1];
  //     while(offsets.negOffset > 0 && lastLine !== undefined && lastLine.getLength()<=offsets.negOffset && offsets.negOffset-lastLine.getLength() >= (decoderProperties.distanceToNextDiff*decoderProperties.internalPrecision)){
  //         offsets.negOffset -= lastLine.getLength();
  //         concatShortestPath.shortestPath.pop();
  //         lastLine = concatShortestPath.shortestPath[concatShortestPath.shortestPath.length-1];
  //     }
  //     if(concatShortestPath.shortestPath.length === 0){
  //         throw Error("The remaining shortest path after trimming according to offsets is empty.");
  //     }
  // }
  ;

  LineDecoder.trimAccordingToOffsets = function trimAccordingToOffsets(concatShortestPath, offsets) {
    offsets.posOffset += concatShortestPath.posProjDist;
    offsets.negOffset += concatShortestPath.negProjDist;

    if (concatShortestPath.shortestPath.length === 0) {
      throw Error("can't trim empty path");
    }

    var firstLine = concatShortestPath.shortestPath[0];
    var lastLine = concatShortestPath.shortestPath[concatShortestPath.shortestPath.length - 1];
    var posOffsetOverflow = offsets.posOffset > 0 && firstLine !== undefined && firstLine.getLength() <= offsets.posOffset;
    var negOffsetOverflow = offsets.negOffset > 0 && lastLine !== undefined && lastLine.getLength() <= offsets.negOffset;

    while (concatShortestPath.shortestPath.length > 1 && (posOffsetOverflow || negOffsetOverflow)) {
      if (posOffsetOverflow && negOffsetOverflow) {
        var posOverflow = offsets.posOffset - firstLine.getLength();
        var negOverflow = offsets.negOffset - lastLine.getLength();

        if (posOverflow >= negOverflow) {
          //todo: vermoeden dat grotere overflow betekent dat de weg meer naar de andere kant moet liggen, maar zou ook kunnen dat het juist andersom is
          offsets.posOffset -= firstLine.getLength();
          concatShortestPath.shortestPath.shift();
          firstLine = concatShortestPath.shortestPath[0];
        } else {
          offsets.negOffset -= lastLine.getLength();
          concatShortestPath.shortestPath.pop();
          lastLine = concatShortestPath.shortestPath[concatShortestPath.shortestPath.length - 1];
        }
      } else if (posOffsetOverflow) {
        offsets.posOffset -= firstLine.getLength();
        concatShortestPath.shortestPath.shift();
        firstLine = concatShortestPath.shortestPath[0];
      } else if (negOffsetOverflow) {
        offsets.negOffset -= lastLine.getLength();
        concatShortestPath.shortestPath.pop();
        lastLine = concatShortestPath.shortestPath[concatShortestPath.shortestPath.length - 1];
      }

      posOffsetOverflow = offsets.posOffset > 0 && firstLine !== undefined && firstLine.getLength() <= offsets.posOffset;
      negOffsetOverflow = offsets.negOffset > 0 && lastLine !== undefined && lastLine.getLength() <= offsets.negOffset;
    }

    if (concatShortestPath.shortestPath.length === 0) {
      throw Error("The remaining shortest path after trimming according to offsets is empty.");
    }
  };

  return LineDecoder;
}();

exports.default = LineDecoder;
},{"../map/Enum":41,"./CoderSettings":31,"./Dijkstra":32,"@babel/runtime/helpers/interopRequireDefault":3}],36:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _Dijkstra = _interopRequireDefault(require("./Dijkstra"));

var _Enum = require("../map/Enum");

var _LRPNodeHelper = _interopRequireDefault(require("./LRPNodeHelper"));

var _CoderSettings = require("./CoderSettings");

var LineEncoder =
/*#__PURE__*/
function () {
  function LineEncoder() {}

  LineEncoder.encode = function encode(mapDataBase, linesToEncode, posOffset, negOffset) {
    var lines = linesToEncode.slice();
    var lrpLines = [];
    var shortestPaths = [];
    var offsets = {
      posOffset: Math.round(posOffset * _CoderSettings.configProperties.internalPrecision),
      negOffset: Math.round(negOffset * _CoderSettings.configProperties.internalPrecision)
    }; // 1: check validity of the location and offsets to be encoded

    LineEncoder.checkValidityAndAdjustOffsets(lines, offsets); // 2: adjust start and end nodes of the location to represent valid map nodes

    var expanded = this.adjustToValidStartEnd(mapDataBase, lines, offsets); //lines[expanded.front] to lines[lines.length-1-expanded.back] can NOT be used, the full path should be used in SP calculation!!!

    lrpLines.push(lines[0]); // calculate length of the Lines in lines. This can serve as a maxDist value for the Dijkstra algorithm
    // since a node further away than this dist will never be part of any the shortest path

    var maxDist = 0;

    for (var i = 0; i < lines.length; i++) {
      maxDist += lines[i].getLength();
    } // 3: determine coverage of the location by a shortest-path


    var shortestPath; // 4: check whether the calculated shortest-path covers the location completely

    var checkResult;

    if (lines.length === 1) {
      //if there is only line, the sp calculation would return the line in the other direction of the given line (but wouldn't be used further in the algoritm
      shortestPath = {
        lines: [],
        length: 0
      };
      checkResult = {
        fullyCovered: true,
        lrpIndexInSP: 1,
        lrpIndexInLoc: 1
      };
    } else {
      shortestPath = _Dijkstra.default.shortestPath(lines[0].getEndNode(), lines[lines.length - 1].getStartNode(), {
        maxDist: maxDist
      });
      checkResult = this.checkShortestPathCoverage(1, lines, shortestPath.lines, lines.length - 1);
    }

    shortestPaths.push(shortestPath); //location not completely covered, intermediate LRPs needed

    LineEncoder.addLRPsUntilFullyCovered(checkResult, lines, lrpLines, shortestPaths, shortestPath); // 7: concatenate the calculated shortest-paths for a complete coverage of the location and
    // form an ordered list of location reference points (from the start to the end of the location)

    var concatenatedSPResult = this.concatenateAndValidateShortestPaths(lrpLines, shortestPaths, offsets);
    checkResult = this.checkShortestPathCoverage(0, lines, concatenatedSPResult.shortestPath, lines.length);

    if (!checkResult.fullyCovered) {
      throw Error("something went wrong with determining the concatenated shortest path");
    } // 8: check validity of the location reference path. If the location reference path is invalid then
    // go to step 9, if the location reference path is valid, then go to step 10


    while (!concatenatedSPResult.isValid) {
      // 9: add a sufficient number of additional intermediate location reference points if the
      // distance between two location reference points exceeds the maximum distance.
      // Remove the start/end LR-point if the positive/negative offset value exceeds the length
      // of the corresponding path.
      if (concatenatedSPResult.wrongPosOffset) {
        //remove LRP at the front
        this.removeLRPatFront(lrpLines, shortestPaths, lines, offsets, concatenatedSPResult.distanceBetweenFirstTwo);
        concatenatedSPResult = this.concatenateAndValidateShortestPaths(lrpLines, shortestPaths, offsets);
      }

      if (concatenatedSPResult.wrongNegOffset) {
        //remove LRP at the end
        this.removeLRPatEnd(lrpLines, shortestPaths, lines, offsets, concatenatedSPResult.distanceBetweenLastTwo);
        concatenatedSPResult = this.concatenateAndValidateShortestPaths(lrpLines, shortestPaths, offsets);
      }

      if (concatenatedSPResult.wrongIntermediateDistance) {
        //add intermediate LRPs
        this.addIntermediateLRPs(lrpLines, shortestPaths, lines); //todo

        throw Error("not yet supported");
      } //check if the location is still fully covered


      checkResult = this.checkShortestPathCoverage(0, lines, concatenatedSPResult.shortestPath, lines.length);

      if (!checkResult.fullyCovered) {
        throw Error("something went wrong while making the concatenated shortest path valid");
      }
    } // 10: create physical representation of the location reference (json)


    var LRPs = _LRPNodeHelper.default.lrpLinesToLRPs(lrpLines, shortestPaths);

    return {
      type: _Enum.locationTypeEnum.LINE_LOCATION,
      LRPs: LRPs,
      posOffset: Math.round(offsets.posOffset / _CoderSettings.configProperties.internalPrecision),
      negOffset: Math.round(offsets.negOffset / _CoderSettings.configProperties.internalPrecision)
    };
  };

  LineEncoder.checkValidityAndAdjustOffsets = function checkValidityAndAdjustOffsets(lines, offsets) {
    if (lines !== undefined && lines.length > 0) {
      var pathLength = lines[0].getLength();
      var prevLineEndNode = lines[0].getEndNode();
      var i = 1;

      while (i < lines.length && lines[i] !== undefined && lines[i].getStartNode().getID() === prevLineEndNode.getID()) {
        prevLineEndNode = lines[i].getEndNode();
        pathLength += lines[i].getLength();
        i++; //todo: check if also traversable from start to end
      }

      if (i !== lines.length) {
        throw Error("line isn't a connected path");
      }

      if (offsets.posOffset + offsets.negOffset >= pathLength) {
        throw Error("offsets longer than path: path=" + pathLength + " posOffset=" + offsets.posOffset + " negOffset=" + offsets.negOffset);
      } //remove unnecessary start or end lines


      while (lines.length > 0 && offsets.posOffset >= lines[0].getLength()) {
        console.log("first line should be omitted");
        offsets.posOffset -= lines[0].getLength();
        lines.shift();
      }

      while (lines.length > 0 && offsets.negOffset >= lines[lines.length - 1].getLength()) {
        console.log("last line should be omitted");
        offsets.negOffset -= lines[lines.length - 1].getLength();
        lines.pop();
      } //todo vereisten voor binary formaat
      //todo if(pathLength > 15km) ... happens in step 8

    }
  } // if this step fails, the encoding can proceed to the next step
  ;

  LineEncoder.adjustToValidStartEnd = function adjustToValidStartEnd(mapDataBase, lines, offsets) {
    var expanded = {
      front: 0,
      back: 0
    };
    var pathLength = {
      length: 0
    };
    lines.forEach(function (line) {
      pathLength.length += line.getLength();
    }); // check if map has turn restrictions, detect invalid nodes according rule 4 of the whitepaper

    if (!mapDataBase.hasTurnRestrictions() && !mapDataBase.hasTurnRestrictionOnPath(lines)) {
      //todo: why do we need to check this?
      //node is invalid if
      //one line enters and line leaves (note: lines are directed)
      //two lines enter and two lines leave, but they are connected to only 2 adjacent nodes,
      //unless a u-turn is possible at that node
      if (lines[0] !== undefined && lines[lines.length - 1] !== undefined) {
        //start node expansion
        var originalStartLineId = lines[0].getID();

        while (LineEncoder.nodeIsInValid(lines[0].getStartNode()) && !(expanded.front > 0 && lines[0].getID() === originalStartLineId)) //detect an infinite start node expansion
        {
          if (lines[0].getStartNode().getIncomingLines().length === 1) {
            this.expand(lines[0].getStartNode().getIncomingLines()[0], lines, pathLength, offsets, true);
            expanded.front += 1;
          } else if (lines[0].getStartNode().getIncomingLines().length === 2) {
            // one of the outgoing lines is the second line of the location, so expansion should happen in the other direction
            if (lines[0].getStartNode().getIncomingLines()[0].getStartNode().getID() === lines[0].getEndNode().getID()) {
              //expand to the start node of the second incoming line
              this.expand(lines[0].getStartNode().getIncomingLines()[1], lines, pathLength, offsets, true);
              expanded.front += 1;
            } else if (lines[0].getStartNode().getIncomingLines()[1].getStartNode().getID() === lines[0].getEndNode().getID()) {
              //expand to the start node of the first incoming line
              this.expand(lines[0].getStartNode().getIncomingLines()[0], lines, pathLength, offsets, true);
              expanded.front += 1;
            } else {
              console.log("something went wrong at determining the start node expansion node");
            }
          } else {
            console.log("something went wrong with determining if expansion is needed");
          }
        }

        if (expanded.front > 0 && lines[0].getID() === originalStartLineId) {
          // the line lays on a loop without valid nodes, so the line has been expanded with all the lines of the loop
          // these added lines should be removed so only the original line remains
          LineEncoder.undoExpansion(lines, originalStartLineId, expanded, offsets, true);
        }

        var originalEndLineId = lines[lines.length - 1].getID(); //end node expansion

        while (LineEncoder.nodeIsInValid(lines[lines.length - 1].getEndNode()) && !(expanded.back > 0 && lines[lines.length - 1].getID() === originalEndLineId)) // detect an infinite end node expansion
        {
          if (lines[lines.length - 1].getEndNode().getOutgoingLines().length === 1) {
            this.expand(lines[lines.length - 1].getEndNode().getOutgoingLines()[0], lines, pathLength, offsets, false);
            expanded.back += 1;
          } else if (lines[lines.length - 1].getEndNode().getOutgoingLines().length === 2) {
            // one of the incoming lines is the second-last line of the location, so expansion should happen in the other direction
            if (lines[lines.length - 1].getEndNode().getOutgoingLines()[0].getEndNode().getID() === lines[lines.length - 1].getStartNode().getID()) {
              //expand to the start node of the second incoming line
              this.expand(lines[lines.length - 1].getEndNode().getOutgoingLines()[1], lines, pathLength, offsets, false);
              expanded.back += 1;
            } else if (lines[lines.length - 1].getEndNode().getOutgoingLines()[1].getEndNode().getID() === lines[lines.length - 1].getStartNode().getID()) {
              //expand to the start node of the first incoming line
              this.expand(lines[lines.length - 1].getEndNode().getOutgoingLines()[0], lines, pathLength, offsets, false);
              expanded.back += 1;
            } else {
              console.log("something went wrong at determining the end node expansion node");
            }
          } else {
            console.log("something went wrong with determining if expansion is needed");
          }
        }

        if (expanded.back > 0 && lines[lines.length - 1].getID() === originalEndLineId) {
          // the line lays on a loop without valid nodes, so the line has been expanded with all the lines of the loop
          // these added lines should be removed so only the original line remains
          LineEncoder.undoExpansion(lines, originalEndLineId, expanded, offsets, false);
        }
      }
    }

    return expanded; //todo what if there are turn restrictions?
  };

  LineEncoder.nodeIsInValid = function nodeIsInValid(node) {
    var oneInOneOut = node.getIncomingLines().length === 1 && node.getOutgoingLines().length === 1;
    var twoInTwoOut = node.getIncomingLines().length === 2 && node.getOutgoingLines().length === 2;
    var expansionNeeded = false;

    if (oneInOneOut) {
      //if the incoming line starts from the same node as the outgoing line ends, this node has only one sibling (border node in our graph) and thus is a valid node
      expansionNeeded = node.getIncomingLines()[0].getStartNode().getID() !== node.getOutgoingLines()[0].getEndNode().getID();
    } else if (twoInTwoOut) {
      //todo: if a u-turn can be made at the node, the node should be valid: turn restrictions should be known, how to implement these?
      var firstIncomingStartEqFirstOutgoingEnd = node.getIncomingLines()[0].getStartNode().getID() === node.getOutgoingLines()[0].getEndNode().getID();
      var secondIncomingStartEqFirstOutgoingEnd = node.getIncomingLines()[1].getStartNode().getID() === node.getOutgoingLines()[0].getEndNode().getID();
      var firstIncomingStartEqSecondOutgoingEnd = node.getIncomingLines()[0].getStartNode().getID() === node.getOutgoingLines()[1].getEndNode().getID();
      var secondIncomingStartEqSecondOutgoingEnd = node.getIncomingLines()[1].getStartNode().getID() === node.getOutgoingLines()[1].getEndNode().getID();
      expansionNeeded = firstIncomingStartEqFirstOutgoingEnd && secondIncomingStartEqSecondOutgoingEnd || firstIncomingStartEqSecondOutgoingEnd && secondIncomingStartEqFirstOutgoingEnd;
    }

    return expansionNeeded;
  };

  LineEncoder.expand = function expand(lineToAdd, lines, pathLength, offsets, positive) {
    if (pathLength.length + lineToAdd.getLength() < 15000 * _CoderSettings.configProperties.internalPrecision) {
      pathLength.length += lineToAdd.getLength();

      if (positive) {
        offsets.posOffset += lineToAdd.getLength();
        lines.unshift(lineToAdd);
      } else {
        offsets.negOffset += lineToAdd.getLength();
        lines.push(lineToAdd);
      }
    } else {
      console.log("start node expansion aborted because path length exceeding 15000m");
    }
  };

  LineEncoder.undoExpansion = function undoExpansion(lines, originalLineId, expanded, offsets, positive) {
    if (positive) {
      if (lines[0].getID() === originalLineId) {
        // the first line should be the line with the same ID as originalLineId and will be shifted out first
        offsets.posOffset -= lines[0].getLength();
        expanded.front--;
        lines.shift();
      } else {
        throw Error("undoExpansion at start node called but was not needed");
      }

      while (lines[0].getID() !== originalLineId) {
        offsets.posOffset -= lines[0].getLength();
        expanded.front--;
        lines.shift();
      }

      if (expanded.front < 0) {
        throw Error("Something went wrong during reversing the start node expansion.");
      }
    } else {
      if (lines[lines.length - 1].getID() === originalLineId) {
        // the last line should be the line with the same ID as originalLineId and will be popped of first
        offsets.negOffset -= lines[lines.length - 1].getLength();
        expanded.back--;
        lines.pop();
      } else {
        throw Error("undoExpansion at end node called but was not needed");
      }

      while (lines[lines.length - 1].getID() !== originalLineId) {
        offsets.negOffset -= lines[lines.length - 1].getLength();
        expanded.back--;
        lines.pop();
      }

      if (expanded.back < 0) {
        throw Error("Something went wrong during reversing the end node expansion.");
      }
    }
  };

  LineEncoder.checkShortestPathCoverage = function checkShortestPathCoverage(lStartIndex, lines, shortestPath, lEndIndex) {
    //lEndIndex is one greater than the last index to be checked (confer length of an array)
    if (lStartIndex === undefined || lines === undefined || shortestPath === undefined || lEndIndex === undefined) {
      throw Error("One of the parameters is undefined.");
    }

    if (lEndIndex > lines.length) {
      throw Error("lEndIndex can't be greater than lines.length");
    } else if (lStartIndex > lEndIndex) {
      throw Error("lStartIndex can't be greater than lEndIndex");
    }

    var spIndex = 0;
    var lIndex = lStartIndex;

    if (lStartIndex === lEndIndex - 1 && shortestPath.length === 0) {
      return {
        fullyCovered: true,
        lrpIndexInSP: spIndex,
        lrpIndexInLoc: lIndex + 1
      };
    } else {
      while (lIndex < lEndIndex && spIndex < shortestPath.length && lines[lIndex].getID() === shortestPath[spIndex].getID()) {
        spIndex++;
        lIndex++;
      } //if even the first line of the shortest path is not correct, a new LRP (lines[lStartIndex].getStartNode()) should be added that has the lines[lStartIndex] as outgoing line
      //if only the first line of the shortest path is correct, the next line lines[lStartIndex+1] should start in a new LRP
      //so lrpIndexInLoc indicates the index of the line of which the startnode should be a new LRP, because that is the line that didn't match the shortest path


      if (lIndex === lEndIndex && spIndex + lStartIndex === lIndex) {
        return {
          fullyCovered: true,
          lrpIndexInSP: spIndex,
          lrpIndexInLoc: lIndex
        };
      } else {
        return {
          fullyCovered: false,
          lrpIndexInSP: spIndex,
          lrpIndexInLoc: lIndex
        };
      }
    }
  };

  LineEncoder.addLRPsUntilFullyCovered = function addLRPsUntilFullyCovered(prevCheckResult, lines, lrpLines, shortestPaths, prevShortestPath) {
    var checkResult = prevCheckResult;
    var shortestPath = prevShortestPath;

    while (!checkResult.fullyCovered) {
      //calculate the length of the location that should be covered, this can be used to speed up the Dijkstra algorithm
      var maxDist = 0;

      for (var i = checkResult.lrpIndexInLoc + 1; i < lines.length - 1; i++) {
        maxDist += lines[i].getLength();
      } // 5: Determine the position of a new intermediate location reference point so that the part of
      // the location between the start of the shortest-path calculation and the new intermediate
      // is covered completely by a shortest-path.


      if (!this.nodeIsInValid(lines[checkResult.lrpIndexInLoc].getStartNode())) {
        // the node is valid, this means that the shortest path would follow the location reference up until the point of lrpIndexInLoc
        // this point of lrpIndexInLoc can be made into a new LRP
        lrpLines.push(lines[checkResult.lrpIndexInLoc]); // 6: go to step 3 and restart shortest path calculation between the new intermediate location
        // reference point and the end of the location

        shortestPath = _Dijkstra.default.shortestPath(lines[checkResult.lrpIndexInLoc].getEndNode(), lines[lines.length - 1].getStartNode(), {
          maxDist: maxDist
        });
        shortestPaths.push(shortestPath);
        checkResult = this.checkShortestPathCoverage(checkResult.lrpIndexInLoc + 1, lines, shortestPath.lines, lines.length - 1);
      } else {
        // this can happen if the path between two LRPs contains invalid nodes, but there exist a route in the other direction
        // that forms a loop between these LRPs and provides a shorter path.
        // so while the path can't change in an invalid node, a U-turn can be made because the way in the other direction is still shorter
        // we will search for valid nodes on the path to encode that can function as LRPs
        // if no valid nodes can be found, invalid nodes must be used instead
        if (checkResult.lrpIndexInSP !== 0) {
          // this means that the shortest path should have no line in common with the lines to encode between te LRPs
          // if some lines should overlap, it would mean that a point exists were the shortest path and the lines to encode can take another route
          // which would mean that that point would be a valid node and we would not be in the first part of this if else structure
          throw Error("Something went wrong during the covering of the location with shortest paths. The location contains a part of a loop with invalid nodes" + " but the shortest path diverges on this part which would imply the existence of a valid node on this part, which is not possible.");
        } // since the shortest path doesn't have any lines in common with the location, it shouldn't have been pushed on the shortestPaths array


        shortestPaths.pop(); // try to find a valid node on the shortest path that leads to the invalid node !!wrong
        // let validNodeResult = this.findValidNodeOnSP(shortestPath.lines,checkResult.lrpIndexInSP); // wrong function/not needed/never needed since the SP doesn't cover the lines to encode at any point
        // we could add the next line to encode as a LRP. This line does start in an invalid node.
        // lrpLines.push(lines[checkResult.lrpIndexInLoc]);
        // we know there are now more valid nodes on the lines to the next LRP, so we can try to only add 1 invalid LRP by counting the line length to the next LRP
        // and since we know the length of the shortest path, we have to make sure that the line length to the invalid LRP + the length of the shortest path is longer than
        // is bigger than the distance from the invalid LRP to the next LRP. That way, the next shortest path between the invalid LRP and the next LRP wil never return on it's way
        // and will guaranteed cover the lines between the invalid LRP and the next LRP.
        // since the list of lines and the wrong shortest path create a loop, we also have to make sure that the length of the path to the chosen invalid LRP is smaller than
        // the length of the wrong shortest path + the length of the lines between the invalid LRP and the next LRP, because otherwise the wrong shortest path will be the shortest path to this invalid LRP
        // for this we do need to know what next LRP, which can simply be the next valid node that is present in the list of lines. If there is no valid node in the list of lines,
        // because even the last node was invalid (because the network is an infinite loop of invalid nodes), the last node will always function as an LRP.

        checkResult = LineEncoder.findInvalidNodeOnLinesAfterACertainLength(lines, checkResult.lrpIndexInLoc, shortestPath.length, lrpLines, shortestPaths, maxDist);
      }
    } // push the last line of the expanded location to the list of LRPs,
    // even if the expanded location contains only one line: in that case lrpLines contains the line two times


    lrpLines.push(lines[lines.length - 1]);
  };

  LineEncoder.findInvalidNodeOnLinesAfterACertainLength = function findInvalidNodeOnLinesAfterACertainLength(lines, lrpIndexInLoc, shortestPathLength, lrpLines, shortestPaths, maxDist) {
    //todo: not al different cases are tested in unit tests
    var nextValidNode = LineEncoder.findNextValidNode(lines, lrpIndexInLoc);
    var nextValidIndex = nextValidNode.nextValidStartNodeIndexInLoc === undefined ? lines.length - 1 : nextValidNode.nextValidStartNodeIndexInLoc;

    if (nextValidIndex !== lines.length - 1) {
      // there is still a valid node on the location between the current LRP and the last LRP
      var lengthFromLRPToNextLRP = nextValidNode.restLengthOfLines - nextValidNode.lengthToIndex;

      if (nextValidNode.lengthToIndex - shortestPathLength < lengthFromLRPToNextLRP) {
        //the shortest path to this valid location doesn't follow the wrong shortest path to the end LRP
        shortestPaths.push(nextValidNode.spToValidNode);
        lrpLines.push(lines[nextValidIndex]);

        var shortestPath = _Dijkstra.default.shortestPath(lines[nextValidIndex].getEndNode(), lines[lines.length - 1].getStartNode(), {
          maxDist: maxDist
        });

        shortestPaths.push(shortestPath);
        return this.checkShortestPathCoverage(nextValidIndex, lines, shortestPath.lines, lines.length - 1);
      }
    } else {
      // there is no valid node on the location between the current LRP and the last LRP,
      // or there is a valid node, but it doesn't lay in the correct interval
      var lengthToLRP = lines[lrpIndexInLoc].getLength();
      var spLines = [lines[lrpIndexInLoc]];
      var i = lrpIndexInLoc + 1;
      var invalidLRPAdded = false;

      while (i < nextValidIndex && !invalidLRPAdded) {
        var _lengthFromLRPToNextLRP = nextValidNode.restLengthOfLines - lengthToLRP;

        if (lengthToLRP + shortestPathLength > _lengthFromLRPToNextLRP && lengthToLRP - shortestPathLength < _lengthFromLRPToNextLRP) {
          // this line lays on the loop of invalid nodes, at a position were the wrong shortest path would never be
          // taken as part of a shortest path calculation to this line, and the wrong shortest path would never be taken
          // as part of a shortest path calculation from this line to the next LRP
          lrpLines.push(lines[i]);
          shortestPaths.push({
            length: lengthToLRP,
            lines: spLines
          });
          invalidLRPAdded = true;
          spLines = [];
          lengthToLRP = 0;
        } else {
          lengthToLRP += lines[i].getLength();
          spLines.push(lines[i]);
        }

        i++;
      }

      if (invalidLRPAdded) {
        // we added an invalid LRP in the previous while loop, we can loop over the remaining lines to form the shortest path
        // to the next valid LRP and push this on the shortestPaths array
        while (i < nextValidIndex) {
          lengthToLRP += lines[i].getLength();
          spLines.push(lines[i]);
          i++;
        }

        shortestPaths.push({
          length: lengthToLRP,
          lines: spLines
        });

        if (nextValidIndex === lines.length - 1) {
          // the full location to the last line is covered
          return {
            fullyCovered: true,
            lrpIndexInSP: spLines.length - 1,
            lrpIndexInLoc: i
          };
        } else {
          // we should add the next valid LRP and check if the location is covered
          var _shortestPath = _Dijkstra.default.shortestPath(lines[nextValidIndex].getEndNode(), lines[lines.length - 1].getStartNode(), {
            maxDist: maxDist
          });

          shortestPaths.push(_shortestPath);
          return this.checkShortestPathCoverage(nextValidIndex, lines, _shortestPath.lines, lines.length - 1);
        }
      } else {
        // there is no valid or invalid LRP possible in the given distance interval
        // so we simply convert the second line in the list of lines to an lrpLine (starts in an invalid Node)
        // since the first Line is a straight Line, adjacent to the last LRP, the shortest path to the beginning of second Line can not deviate from this first Line
        // there always will be a second Line, otherwise an intermediate LRP wasn't needed because the last LRP and the first Line would already cover the location
        lrpLines.push(lines[lrpIndexInLoc + 1]);
        shortestPaths.push({
          length: lines[lrpIndexInLoc].getLength(),
          lines: [lines[lrpIndexInLoc]]
        });

        var _shortestPath2 = _Dijkstra.default.shortestPath(lines[lrpIndexInLoc + 1].getEndNode(), lines[lines.length - 1].getStartNode(), {
          maxDist: maxDist
        });

        shortestPaths.push(_shortestPath2);
        return this.checkShortestPathCoverage(lrpIndexInLoc + 2, lines, _shortestPath2.lines, lines.length - 1);
      }
    }
  };

  LineEncoder.findNextValidNode = function findNextValidNode(lines, lrpIndexInLoc) {
    // the startnode of lines[lrpIndexInLoc] will be invalid, otherwise this function wouldn't be called
    var nextValidStartNodeIndexInLoc = undefined;
    var lengthOfLines = lines[lrpIndexInLoc].getLength();
    var lengthToIndex = undefined;
    var spLinesToValidNode = [lines[lrpIndexInLoc]];
    var spToValidNode = {};
    var i = lrpIndexInLoc + 1;

    while (i < lines.length) {
      if (nextValidStartNodeIndexInLoc === undefined && !LineEncoder.nodeIsInValid(lines[i].getStartNode())) {
        nextValidStartNodeIndexInLoc = i;
        lengthToIndex = lengthOfLines;
        spToValidNode = {
          lines: spLinesToValidNode,
          length: lengthToIndex
        };
      }

      spLinesToValidNode.push(lines[i]);
      lengthOfLines += lines[i].getLength();
      i++;
    }

    return {
      nextValidStartNodeIndexInLoc: nextValidStartNodeIndexInLoc,
      lengthToIndex: lengthToIndex,
      restLengthOfLines: lengthOfLines,
      spToValidNode: spToValidNode
    };
  };

  LineEncoder.concatenateAndValidateShortestPaths = function concatenateAndValidateShortestPaths(lrpLines, shortestPaths, offsets) {
    if (lrpLines === undefined || shortestPaths === undefined || offsets === undefined) {
      throw Error("Parameters can not be undefined");
    }

    var isValid = true;
    var distanceBetweenFirstTwoLength = lrpLines[0].getLength();
    var distanceBetweenLastTwoLength = lrpLines[lrpLines.length - 1].getLength();
    var wrongPosOffset = false;
    var wrongNegOffset = false;
    var wrongIntermediateOffset = false;

    if (lrpLines.length - 1 === shortestPaths.length) {
      var shortestPath = [];

      if (lrpLines.length === 2 && lrpLines[0].getID() === lrpLines[1].getID()) {
        // lines contains only one line, so the first 2 lines in lrpLines are the same
        // the second lrp line should not be pushed on the shortestPath
        shortestPath.push(lrpLines[0]);
      } else {
        for (var i = 0; i < shortestPaths.length; i++) {
          shortestPath.push(lrpLines[i]);

          if (i === shortestPaths.length - 1) {
            distanceBetweenLastTwoLength += lrpLines[i].getLength();
          }

          var a = 0;
          var lengthBetweenLRPs = lrpLines[i].getLength(); //while the start node of a line is not the next LRP node, this line can be added
          //otherwise we should add the lines of the shortest path of that LRP node

          while (shortestPaths[i].lines !== undefined && shortestPaths[i].lines[a] !== undefined && shortestPaths[i].lines[a].getStartNode().getID() !== lrpLines[i + 1].getStartNode().getID()) {
            shortestPath.push(shortestPaths[i].lines[a]);
            lengthBetweenLRPs += shortestPaths[i].lines[a].getLength();

            if (i === 0) {
              distanceBetweenFirstTwoLength += shortestPaths[i].lines[a].getLength();
            }

            if (i === shortestPaths.length - 1) {
              distanceBetweenLastTwoLength += shortestPaths[i].lines[a].getLength();
            }

            a++;
          }

          if (lengthBetweenLRPs >= 15000 * _CoderSettings.configProperties.internalPrecision) {
            isValid = false;
            wrongIntermediateOffset = true;
          }
        }

        shortestPath.push(lrpLines[lrpLines.length - 1]); //add the line incoming in the last LRP

        if (lrpLines.length === 2) {
          distanceBetweenFirstTwoLength += lrpLines[lrpLines.length - 1].getLength();
        }
      }

      if (distanceBetweenFirstTwoLength >= 15000 * _CoderSettings.configProperties.internalPrecision || distanceBetweenLastTwoLength >= 15000 * _CoderSettings.configProperties.internalPrecision) {
        isValid = false;
        wrongIntermediateOffset = true;
      } //check if offset values are shorter then the distance between the first two/last two location reference points


      if (offsets.posOffset >= distanceBetweenFirstTwoLength) {
        // can happen if we added extra intermediate LRPs on invalid nodes
        isValid = false;
        wrongPosOffset = true;
      } else if (offsets.negOffset >= distanceBetweenLastTwoLength) {
        // can happen if we added extra intermediate LRPs on invalid nodes
        isValid = false;
        wrongNegOffset = true;
      }

      return {
        shortestPath: shortestPath,
        isValid: isValid,
        wrongPosOffset: wrongPosOffset,
        wrongNegOffset: wrongNegOffset,
        wrongIntermediateDistance: wrongIntermediateOffset,
        distanceBetweenFirstTwo: distanceBetweenFirstTwoLength,
        distanceBetweenLastTwo: distanceBetweenLastTwoLength
      };
    } else {
      throw Error("the amount of shortest paths is not one less than the amount of lrp nodes");
    }
  };

  LineEncoder.removeLRPatFront = function removeLRPatFront(lrpLines, shortestPaths, lines, offsets, length) {
    if (lrpLines.length > 0 && offsets.posOffset >= length) {
      offsets.posOffset -= length;
      lrpLines.shift();
      shortestPaths.shift();

      while (lines[0].getID() !== lrpLines[0].getID()) {
        lines.shift();
      }
    } else {
      throw Error("unnecessary removing of LRP at front");
    }
  };

  LineEncoder.removeLRPatEnd = function removeLRPatEnd(lrpLines, shortestPaths, lines, offsets, length) {
    if (lrpLines.length > 0 && offsets.negOffset >= length) {
      offsets.negOffset -= length;
      lrpLines.pop();
      shortestPaths.pop();

      while (lines[lines.length - 1].getID() !== lrpLines[lrpLines.length - 1].getID()) {
        lines.pop();
      }
    } else {
      throw Error("unnecessary removing of LRP at end");
    }
  };

  LineEncoder.addIntermediateLRPs = function addIntermediateLRPs(lrpLines, shortestPaths, lines) {
    //todo
    console.warn("todo addIntermediateLRPs");
  };

  return LineEncoder;
}();

exports.default = LineEncoder;
},{"../map/Enum":41,"./CoderSettings":31,"./Dijkstra":32,"./LRPNodeHelper":34,"@babel/runtime/helpers/interopRequireDefault":3}],37:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.default = void 0;

var Location = function Location(type, ID) {
  this.type = type;
  this.locationLines = [];
  this.ID = ID; // this.poiLine = {};

  this.posOffset = 0;
  this.negOffset = 0; // this.pointLocation = {};
  // this.accesPoint = {};
  // this.cornerPoints = {};
  // this.lowerLeftPoint = {};
  // this.upperRightPoint = {};
  // this.centerPoint = {};
  // this.radius = {};
  // this.numberOfColumns = 0;
  // this.numberOfRows = 0;
  // this.hasPosOffset = false;
  // this.hasNegOffset = false;
  // this.orientation = {};
  // this.sideOfRoad = {};
};

exports.default = Location;
},{}],38:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.default = void 0;

var _CoderSettings = require("./CoderSettings");

var LocationReferencePoint = function LocationReferencePoint(bearing, distanceToNext, frc, fow, lfrcnp, islast, lat, lon, seqNr) {
  this.bearing = Math.round(bearing);
  this.distanceToNext = Math.round(distanceToNext / _CoderSettings.configProperties.internalPrecision);
  this.frc = frc;
  this.fow = fow;
  this.lfrcnp = lfrcnp;
  this.isLast = islast;
  this.lat = Number(Math.round(lat + 'e5') + 'e-5');
  this.long = Number(Math.round(lon + 'e5') + 'e-5');
  this.seqNr = seqNr;
};

exports.default = LocationReferencePoint;
},{"./CoderSettings":31}],39:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.default = void 0;

var RawLineLocationReference = function RawLineLocationReference(LRPs, posOffset, negOffset) {
  this.type = "RawLineLocationReference";
  this.properties = {
    "_id": "binary",
    "_locationType": 1,
    "_returnCode": null,
    "_points": {
      "type": "Array",
      "properties": []
    },
    "_offsets": {
      "type": "Offsets",
      "properties": {
        "_pOffset": posOffset,
        "_pOffRelative": 0,
        "_nOffset": negOffset,
        "_nOffRelative": 0,
        "_version": 3
      }
    }
  };

  for (var i = 0; i < LRPs.length; i++) {
    this.properties["_points"].properties.push({
      "type": "LocationReferencePoint",
      "properties": {
        "_bearing": LRPs[i].bearing,
        "_distanceToNext": LRPs[i].distanceToNext,
        "_frc": LRPs[i].frc,
        "_fow": LRPs[i].fow,
        "_lfrcnp": LRPs[i].lfrcnp,
        "_isLast": LRPs[i].isLast,
        "_longitude": LRPs[i].lat,
        "_latitude": LRPs[i].lon,
        "_sequenceNumber": LRPs[i].seqNr
      }
    });
  }
};

exports.default = RawLineLocationReference;
},{}],40:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.LinesDirectlyToLRPs = LinesDirectlyToLRPs;

var _LRPNodeHelper = _interopRequireDefault(require("../coder/LRPNodeHelper"));

var _Enum = require("../map/Enum");

/**
 * function that takes lines and directly makes LRPs of them, without running through all the encoding steps
 * Can be used to skip the encoding completely. These LRPs can be decoded, but lack the benefit of the encoding.
 * The encoding step reduces the amount of LRPs to the bare minimum, which doesn't happen when using this method.
 * So if this method is used on 20 lines of which only the very first and last end points are valid, this method will return
 * 20 LRPs, wile the encoding would only return 2 LRPs. So use this method only on a small amount of lines.
 * @param lines
 * @returns {{LRPs: *, posOffset: number, negOffset: number, type: number}}
 * @constructor
 */
function LinesDirectlyToLRPs(lines) {
  if (lines.length === 0) {
    throw Error("The array of lines is empty");
  }

  var shortestPaths = [];
  var encLines = lines.length >= 2 ? lines : [lines[0], lines[0]];

  for (var i = 0; i < encLines.length - 1; i++) {
    shortestPaths.push({
      lines: [],
      length: 0
    });
  }

  return {
    LRPs: _LRPNodeHelper.default.lrpLinesToLRPs(encLines, shortestPaths),
    posOffset: 0,
    negOffset: 0,
    type: _Enum.locationTypeEnum.LINE_LOCATION
  };
}
},{"../coder/LRPNodeHelper":34,"../map/Enum":41,"@babel/runtime/helpers/interopRequireDefault":3}],41:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.internalPrecisionEnum = exports.locationTypeEnum = exports.frcEnum = exports.fowEnum = void 0;
var fowEnum = Object.freeze({
  "UNDEFINED": 0,
  // The physical road type is unknown.
  "MOTORWAY": 1,
  // A Motorway is defined as a road permitted for motorized vehicles only in combination with a prescribed minimum speed.
  "MULTIPLE_CARRIAGEWAY": 2,
  // A multiple carriageway is defined as a road with physically separated carriageways regardless of the number of lanes.
  "SINGLE_CARRIAGEWAY": 3,
  // All roads without separate carriageways are considered as roads with a single carriageway.
  "ROUNDABOUT": 4,
  // A Roundabout is a road which forms a ring on which traffic travelling in only one direction is allowed.
  "TRAFFICSQUARE": 5,
  // A Traffic Square is an open area (partly) enclosed by roads which is used for non-traffic purposes and which is not a Roundabout.
  "SLIPROAD": 6,
  // A Slip Road is a road especially designed to enter or leave a line.
  "OTHER": 7 // The physical road type is known but does not fit into one of the other categories.

});
exports.fowEnum = fowEnum;
var frcEnum = Object.freeze({
  "FRC_0": 0,
  // Main road.
  "FRC_1": 1,
  // First class road.
  "FRC_2": 2,
  // Second class road.
  "FRC_3": 3,
  // Third class road.
  "FRC_4": 4,
  // Forth class road.
  "FRC_5": 5,
  // Fifth class road.
  "FRC_6": 6,
  // Sixth class road.
  "FRC_7": 7 // Other class road.

});
exports.frcEnum = frcEnum;
var locationTypeEnum = Object.freeze({
  "UNKNOWN": 0,
  "LINE_LOCATION": 1,
  "GEO_COORDINATES": 2,
  "POINT_ALONG_LINE": 3,
  "POI_WITH_ACCESS_POINT": 4,
  "CIRCLE": 5,
  "POLYGON": 6,
  "CLOSED_LINE": 7,
  "RECTANGLE": 8,
  "GRID": 9
});
exports.locationTypeEnum = locationTypeEnum;
var internalPrecisionEnum = Object.freeze({
  "METER": 1,
  "CENTIMETER": 100
});
exports.internalPrecisionEnum = internalPrecisionEnum;
},{}],42:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _pointToLineDistance = _interopRequireDefault(require("@turf/point-to-line-distance"));

var _nearestPointOnLine = _interopRequireDefault(require("@turf/nearest-point-on-line"));

var _along = _interopRequireDefault(require("@turf/along"));

var _helpers = require("@turf/helpers");

var _index = _interopRequireDefault(require("@turf/distance/index"));

var _bearing = _interopRequireDefault(require("@turf/bearing"));

var _Enum = require("./Enum");

var _CoderSettings = require("../coder/CoderSettings");

var Line =
/*#__PURE__*/
function () {
  function Line(id, startNode, endNode, options) {
    this.startNode = startNode;
    this.endNode = endNode;
    this.id = id;
    this.fow = _Enum.fowEnum.UNDEFINED;
    this.frc = _Enum.frcEnum.FRC_7;
    this.lineLength = undefined;
    this.turnRestriction = undefined;
    this.bearing = undefined;
    this.reverseBearing = undefined;
    startNode.outgoingLines.push(this);
    endNode.incomingLines.push(this);
    this.internalPrecision = _CoderSettings.configProperties.internalPrecision;
  }

  var _proto = Line.prototype;

  _proto.getStartNode = function getStartNode() {
    return this.startNode;
  };

  _proto.getEndNode = function getEndNode() {
    return this.endNode;
  };

  _proto.getFOW = function getFOW() {
    return this.fow;
  };

  _proto.getFRC = function getFRC() {
    return this.frc;
  };

  _proto.getLength = function getLength() {
    if (this.lineLength === undefined && this.startNode !== undefined && this.endNode !== undefined) {
      var from = (0, _helpers.point)([this.startNode.getLongitudeDeg(), this.startNode.getLatitudeDeg()]);
      var to = (0, _helpers.point)([this.endNode.getLongitudeDeg(), this.endNode.getLatitudeDeg()]);

      if (this.internalPrecision === _Enum.internalPrecisionEnum.CENTIMETER) {
        this.lineLength = Math.round((0, _index.default)(from, to, {
          units: "centimeters"
        })); //work with integer values in centimeter
      } else {
        this.lineLength = Math.round((0, _index.default)(from, to, {
          units: "meters"
        })); //work with integer values in meter
      }

      if (this.lineLength === 0) {
        this.lineLength = 1; //but minimum value should be 1
      }
    }

    return this.lineLength;
  };

  _proto.getID = function getID() {
    return this.id;
  };

  _proto.getTurnRestriction = function getTurnRestriction() {
    return this.turnRestriction;
  };

  _proto.getGeoCoordinateAlongLine = function getGeoCoordinateAlongLine(distanceAlong) {
    if (Math.abs(distanceAlong) > this.getLength()) {
      var front = distanceAlong >= 0;
      console.log("Line shorter than " + distanceAlong + ". The latitude and longitude of " + (front ? "startNode" : "endNode") + " are returned");

      if (front) {
        return {
          lat: this.endNode.getLatitudeDeg(),
          long: this.endNode.getLongitudeDeg()
        };
      } else {
        return {
          lat: this.startNode.getLatitudeDeg(),
          long: this.startNode.getLongitudeDeg()
        };
      }
    }

    var line = (0, _helpers.lineString)([[this.startNode.getLongitudeDeg(), this.startNode.getLatitudeDeg()], [this.endNode.getLongitudeDeg(), this.endNode.getLatitudeDeg()]]);
    var distAlong;

    if (this.internalPrecision === _Enum.internalPrecisionEnum.CENTIMETER) {
      distAlong = (0, _along.default)(line, distanceAlong, {
        units: 'centimeters'
      });
    } else {
      distAlong = (0, _along.default)(line, distanceAlong, {
        units: 'meters'
      });
    } //return distAlong.geometry;


    return {
      lat: distAlong.geometry.coordinates[1],
      long: distAlong.geometry.coordinates[0]
    };
  };

  _proto.distanceToPoint = function distanceToPoint(lat, long) {
    var pt = (0, _helpers.point)([long, lat]);
    var line = (0, _helpers.lineString)([[this.startNode.getLongitudeDeg(), this.startNode.getLatitudeDeg()], [this.endNode.getLongitudeDeg(), this.endNode.getLatitudeDeg()]]);

    if (this.internalPrecision === _Enum.internalPrecisionEnum.CENTIMETER) {
      return Math.round((0, _pointToLineDistance.default)(pt, line, {
        units: 'centimeters'
      }));
    } else {
      return Math.round((0, _pointToLineDistance.default)(pt, line, {
        units: 'meters'
      }));
    }
  };

  _proto.measureAlongLine = function measureAlongLine(lat, long) {
    var pt = (0, _helpers.point)([long, lat]);
    var line = (0, _helpers.lineString)([[this.startNode.getLongitudeDeg(), this.startNode.getLatitudeDeg()], [this.endNode.getLongitudeDeg(), this.endNode.getLatitudeDeg()]]);
    var snapped = (0, _nearestPointOnLine.default)(line, pt, {
      units: 'meters'
    });
    return {
      lat: snapped.geometry.coordinates[1],
      long: snapped.geometry.coordinates[0]
    };
  };

  _proto.getBearing = function getBearing() {
    if (this.bearing === undefined) {
      var startNode = (0, _helpers.point)([this.startNode.getLongitudeDeg(), this.startNode.getLatitudeDeg()]);
      var bearPoint;

      if (this.getLength() <= _CoderSettings.configProperties.bearDist * _CoderSettings.configProperties.internalPrecision) {
        bearPoint = (0, _helpers.point)([this.endNode.getLongitudeDeg(), this.endNode.getLatitudeDeg()]);
      } else {
        var bearDistLoc = this.getGeoCoordinateAlongLine(_CoderSettings.configProperties.bearDist * _CoderSettings.configProperties.internalPrecision);
        bearPoint = (0, _helpers.point)([bearDistLoc.long, bearDistLoc.lat]);
      }

      var calcBear = (0, _bearing.default)(startNode, bearPoint); // bear is always positive, counterclockwise

      calcBear = (calcBear + 360.0) % 360.0;
      this.bearing = Math.round(calcBear);
    }

    return this.bearing;
  };

  _proto.getReverseBearing = function getReverseBearing() {
    if (this.reverseBearing === undefined) {
      var startNode = (0, _helpers.point)([this.endNode.getLongitudeDeg(), this.endNode.getLatitudeDeg()]);
      var bearPoint;

      if (this.getLength() <= _CoderSettings.configProperties.bearDist * _CoderSettings.configProperties.internalPrecision) {
        bearPoint = (0, _helpers.point)([this.startNode.getLongitudeDeg(), this.startNode.getLatitudeDeg()]);
      } else {
        var bearDistLoc = this.getGeoCoordinateAlongLine(this.getLength() - _CoderSettings.configProperties.bearDist * _CoderSettings.configProperties.internalPrecision);
        bearPoint = (0, _helpers.point)([bearDistLoc.long, bearDistLoc.lat]);
      }

      var calcBear = (0, _bearing.default)(startNode, bearPoint); // bear is always positive, counterclockwise

      calcBear = (calcBear + 360.0) % 360.0;
      this.reverseBearing = Math.round(calcBear);
    }

    return this.reverseBearing;
  };

  return Line;
}();

exports.default = Line;
},{"../coder/CoderSettings":31,"./Enum":41,"@babel/runtime/helpers/interopRequireDefault":3,"@turf/along":4,"@turf/bearing":6,"@turf/distance/index":8,"@turf/helpers":9,"@turf/nearest-point-on-line":14,"@turf/point-to-line-distance":15}],43:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _GeoJSONRbushNodeSearchTree = _interopRequireDefault(require("../SearchTree/GeoJSONRbushNodeSearchTree"));

var _GeoJSONRbushLineSearchTree = _interopRequireDefault(require("../SearchTree/GeoJSONRbushLineSearchTree"));

var _CoderSettings = require("../coder/CoderSettings");

var MapDataBase =
/*#__PURE__*/
function () {
  function MapDataBase(lines, nodes, boundingBox, turnRestrictions) {
    if (lines === void 0) {
      lines = {};
    }

    if (nodes === void 0) {
      nodes = {};
    }

    if (boundingBox === void 0) {
      boundingBox = {
        left: undefined,
        top: undefined,
        right: undefined,
        bottom: undefined
      };
    }

    if (turnRestrictions === void 0) {
      turnRestrictions = false;
    }

    this.turnResctrictions = turnRestrictions;
    this.mapBoundingBox = boundingBox;
    this.lines = lines;
    this.nodes = nodes;
    this.nodeSearchTree = new _GeoJSONRbushNodeSearchTree.default(nodes);
    this.lineSearchTree = new _GeoJSONRbushLineSearchTree.default(lines);
    this.internalPrecision = _CoderSettings.configProperties.internalPrecision;
  }

  var _proto = MapDataBase.prototype;

  _proto.setData = function setData(lines, nodes, boundingBox, turnRestrictions) {
    if (lines === void 0) {
      lines = {};
    }

    if (nodes === void 0) {
      nodes = {};
    }

    if (boundingBox === void 0) {
      boundingBox = {
        left: undefined,
        top: undefined,
        right: undefined,
        bottom: undefined
      };
    }

    if (turnRestrictions === void 0) {
      turnRestrictions = false;
    }

    this.turnResctrictions = turnRestrictions;
    this.mapBoundingBox = boundingBox;
    this.lines = lines;
    this.nodes = nodes;
    this.nodeSearchTree = new _GeoJSONRbushNodeSearchTree.default(nodes);
    this.lineSearchTree = new _GeoJSONRbushLineSearchTree.default(lines);
  };

  _proto.hasTurnRestrictions = function hasTurnRestrictions() {
    return this.turnResctrictions;
  };

  _proto.getLine = function getLine(id) {
    return this.lines[id];
  };

  _proto.getNode = function getNode(id) {
    return this.nodes[id];
  };

  _proto.findNodesCloseByCoordinate = function findNodesCloseByCoordinate(lat, long, dist) {
    var _this = this;

    var resNodes = [];
    var range = Math.round(dist / this.internalPrecision);
    var possibleNodes = this.nodeSearchTree.findCloseBy(lat, long, range);
    possibleNodes.forEach(function (node) {
      var distance = _this.nodes[node.properties.id].getDistance(lat, long);

      if (distance <= dist) {
        resNodes.push({
          node: _this.nodes[node.properties.id],
          dist: distance
        });
      }
    });
    return resNodes;
  };

  _proto.findLinesCloseByCoordinate = function findLinesCloseByCoordinate(lat, long, dist) {
    var _this2 = this;

    var resLines = [];
    var range = Math.round(dist / this.internalPrecision);
    var possibleLines = this.lineSearchTree.findCloseBy(lat, long, range);
    possibleLines.forEach(function (line) {
      var distance = _this2.lines[line.properties.id].distanceToPoint(lat, long);

      if (distance <= dist) {
        resLines.push({
          line: _this2.lines[line.properties.id],
          dist: distance
        });
      }
    });
    return resLines;
  };

  _proto.hasTurnRestrictionOnPath = function hasTurnRestrictionOnPath(lineList) {
    //todo: how to implement turn restrictions? is it a property of nodes or of lines or both?
    if (!this.turnResctrictions) {
      //if database has no turn restrictions, a line should also have no turn restrictions
      return this.turnResctrictions;
    } //https://wiki.openstreetmap.org/wiki/Relation:restriction


    var i = 0;

    while (i < lineList.length && lineList[i].getTurnRestriction() !== undefined) {
      i++;
    }

    return i === lineList.length;
  };

  _proto.getAllNodes = function getAllNodes() {
    return this.nodes;
  };

  _proto.getAllLines = function getAllLines() {
    return this.lines;
  };

  _proto.getMapBoundingBox = function getMapBoundingBox() {
    return this.mapBoundingBox;
  };

  _proto.getNumberOfNodes = function getNumberOfNodes() {
    return this.numberOfNodes;
  };

  _proto.getNumberOfLines = function getNumberOfLines() {
    return this.numberOfLines;
  };

  _proto.addData = function addData(lines, nodes, boundingBox) {
    if (lines === void 0) {
      lines = {};
    }

    if (nodes === void 0) {
      nodes = {};
    }

    if (boundingBox === void 0) {
      boundingBox = {
        left: undefined,
        top: undefined,
        right: undefined,
        bottom: undefined
      };
    }

    //todo: speed this up
    //maybe change lines and nodes to not contain references, but only ids
    var nodesAdded = {};
    var linesAdded = {};

    for (var key in nodes) {
      if (nodes.hasOwnProperty(key)) {
        if (this.nodes[key] === undefined) {
          //this node was not yet present
          this.nodes[key] = nodes[key];
          nodesAdded[key] = nodes[key];
        }
      }
    }

    for (var _key in lines) {
      if (lines.hasOwnProperty(_key)) {
        if (this.lines[_key] === undefined) {
          //this line was not yet present
          lines[_key].startNode = this.nodes[lines[_key].getStartNode().getID()];

          if (nodesAdded[lines[_key].getStartNode().getID()] === undefined) {
            // if this node wasn't just added, this node was already present, so the line should still
            // be added to it's outgoing lines
            this.nodes[lines[_key].getStartNode().getID()].outgoingLines.push(lines[_key]);
          }

          lines[_key].endNode = this.nodes[lines[_key].getEndNode().getID()];

          if (nodesAdded[lines[_key].getEndNode().getID()] === undefined) {
            // if this node wasn't just added, this node was already present, so the line should still
            // be added to it's incoming lines
            this.nodes[lines[_key].getEndNode().getID()].incomingLines.push(lines[_key]);
          }

          this.lines[lines[_key].getID()] = lines[_key];
          linesAdded[_key] = lines[_key];
        }
      }
    }

    this.nodeSearchTree.addNodes(nodesAdded);
    this.lineSearchTree.addLines(linesAdded); //todo: adjust bounding box
  } //todo: remove data
  ;

  return MapDataBase;
}();

exports.default = MapDataBase;
},{"../SearchTree/GeoJSONRbushLineSearchTree":28,"../SearchTree/GeoJSONRbushNodeSearchTree":29,"../coder/CoderSettings":31,"@babel/runtime/helpers/interopRequireDefault":3}],44:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _distance = _interopRequireDefault(require("@turf/distance"));

var _helpers = require("@turf/helpers");

var _CoderSettings = require("../coder/CoderSettings");

var _Enum = require("./Enum");

var Node =
/*#__PURE__*/
function () {
  function Node(id, lat, long, incomingLines, outgoingLines) {
    if (id === void 0) {
      id = 0;
    }

    if (lat === void 0) {
      lat = 0;
    }

    if (long === void 0) {
      long = 0;
    }

    if (incomingLines === void 0) {
      incomingLines = [];
    }

    if (outgoingLines === void 0) {
      outgoingLines = [];
    }

    this.id = id;
    this.lat = lat;
    this.long = long;
    this.incomingLines = incomingLines;
    this.outgoingLines = outgoingLines;
    this.setLines(incomingLines, outgoingLines);
    this.internalPrecision = _CoderSettings.configProperties.internalPrecision;
  }

  var _proto = Node.prototype;

  _proto.setLines = function setLines(incomingLines, outgoingLines) {
    this.incomingLines = incomingLines;
    this.outgoingLines = outgoingLines;
  };

  _proto.getLatitudeDeg = function getLatitudeDeg() {
    return this.lat;
  };

  _proto.getLongitudeDeg = function getLongitudeDeg() {
    return this.long;
  };

  _proto.getOutgoingLines = function getOutgoingLines() {
    return this.outgoingLines;
  };

  _proto.getIncomingLines = function getIncomingLines() {
    return this.incomingLines;
  };

  _proto.getID = function getID() {
    return this.id;
  };

  _proto.getDistance = function getDistance(lat, long) {
    var from = (0, _helpers.point)([this.long, this.lat]);
    var to = (0, _helpers.point)([long, lat]);

    if (this.internalPrecision === _Enum.internalPrecisionEnum.CENTIMETER) {
      return Math.round((0, _distance.default)(from, to, {
        units: "centimeters"
      }));
    } else {
      return Math.round((0, _distance.default)(from, to, {
        units: "meters"
      }));
    }
  };

  return Node;
}();

exports.default = Node;
},{"../coder/CoderSettings":31,"./Enum":41,"@babel/runtime/helpers/interopRequireDefault":3,"@turf/distance":8,"@turf/helpers":9}],45:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.getTileXYForLocation = getTileXYForLocation;
exports.tile2boundingBox = tile2boundingBox;

function getTileXYForLocation(latitude, longitude, zoom) {
  var x = _long2tile(longitude, zoom);

  var y = _lat2tile(latitude, zoom);

  return {
    x: x,
    y: y
  };
}

function tile2boundingBox(x, y, zoom) {
  var north = _tile2lat(y, zoom);

  var south = _tile2lat(y + 1, zoom);

  var west = _tile2long(x, zoom);

  var east = _tile2long(x + 1, zoom);

  return {
    latUpper: north,
    longLower: west,
    latLower: south,
    longUpper: east
  };
}
/*
https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29
 */


function _long2tile(lon, zoom) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}

function _lat2tile(lat, zoom) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
}

function _tile2long(x, z) {
  return x / Math.pow(2, z) * 360 - 180;
}

function _tile2lat(y, z) {
  var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}
},{}],46:[function(require,module,exports){
var rbush = require('rbush');
var helpers = require('@turf/helpers');
var meta = require('@turf/meta');
var turfBBox = require('@turf/bbox').default;
var featureEach = meta.featureEach;
var coordEach = meta.coordEach;
var polygon = helpers.polygon;
var featureCollection = helpers.featureCollection;

/**
 * GeoJSON implementation of [RBush](https://github.com/mourner/rbush#rbush) spatial index.
 *
 * @name rbush
 * @param {number} [maxEntries=9] defines the maximum number of entries in a tree node. 9 (used by default) is a
 * reasonable choice for most applications. Higher value means faster insertion and slower search, and vice versa.
 * @returns {RBush} GeoJSON RBush
 * @example
 * var geojsonRbush = require('geojson-rbush').default;
 * var tree = geojsonRbush();
 */
function geojsonRbush(maxEntries) {
    var tree = rbush(maxEntries);
    /**
     * [insert](https://github.com/mourner/rbush#data-format)
     *
     * @param {Feature} feature insert single GeoJSON Feature
     * @returns {RBush} GeoJSON RBush
     * @example
     * var poly = turf.polygon([[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]);
     * tree.insert(poly)
     */
    tree.insert = function (feature) {
        if (feature.type !== 'Feature') throw new Error('invalid feature');
        feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
        return rbush.prototype.insert.call(this, feature);
    };

    /**
     * [load](https://github.com/mourner/rbush#bulk-inserting-data)
     *
     * @param {FeatureCollection|Array<Feature>} features load entire GeoJSON FeatureCollection
     * @returns {RBush} GeoJSON RBush
     * @example
     * var polys = turf.polygons([
     *     [[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]],
     *     [[[-93, 32], [-83, 32], [-83, 39], [-93, 39], [-93, 32]]]
     * ]);
     * tree.load(polys);
     */
    tree.load = function (features) {
        var load = [];
        // Load an Array of Features
        if (Array.isArray(features)) {
            features.forEach(function (feature) {
                if (feature.type !== 'Feature') throw new Error('invalid features');
                feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
                load.push(feature);
            });
        } else {
            // Load a FeatureCollection
            featureEach(features, function (feature) {
                if (feature.type !== 'Feature') throw new Error('invalid features');
                feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
                load.push(feature);
            });
        }
        return rbush.prototype.load.call(this, load);
    };

    /**
     * [remove](https://github.com/mourner/rbush#removing-data)
     *
     * @param {Feature} feature remove single GeoJSON Feature
     * @param {Function} equals Pass a custom equals function to compare by value for removal.
     * @returns {RBush} GeoJSON RBush
     * @example
     * var poly = turf.polygon([[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]);
     *
     * tree.remove(poly);
     */
    tree.remove = function (feature, equals) {
        if (feature.type !== 'Feature') throw new Error('invalid feature');
        feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
        return rbush.prototype.remove.call(this, feature, equals);
    };

    /**
     * [clear](https://github.com/mourner/rbush#removing-data)
     *
     * @returns {RBush} GeoJSON Rbush
     * @example
     * tree.clear()
     */
    tree.clear = function () {
        return rbush.prototype.clear.call(this);
    };

    /**
     * [search](https://github.com/mourner/rbush#search)
     *
     * @param {BBox|FeatureCollection|Feature} geojson search with GeoJSON
     * @returns {FeatureCollection} all features that intersects with the given GeoJSON.
     * @example
     * var poly = turf.polygon([[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]);
     *
     * tree.search(poly);
     */
    tree.search = function (geojson) {
        var features = rbush.prototype.search.call(this, this.toBBox(geojson));
        return featureCollection(features);
    };

    /**
     * [collides](https://github.com/mourner/rbush#collisions)
     *
     * @param {BBox|FeatureCollection|Feature} geojson collides with GeoJSON
     * @returns {boolean} true if there are any items intersecting the given GeoJSON, otherwise false.
     * @example
     * var poly = turf.polygon([[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]);
     *
     * tree.collides(poly);
     */
    tree.collides = function (geojson) {
        return rbush.prototype.collides.call(this, this.toBBox(geojson));
    };

    /**
     * [all](https://github.com/mourner/rbush#search)
     *
     * @returns {FeatureCollection} all the features in RBush
     * @example
     * tree.all()
     */
    tree.all = function () {
        var features = rbush.prototype.all.call(this);
        return featureCollection(features);
    };

    /**
     * [toJSON](https://github.com/mourner/rbush#export-and-import)
     *
     * @returns {any} export data as JSON object
     * @example
     * var exported = tree.toJSON()
     */
    tree.toJSON = function () {
        return rbush.prototype.toJSON.call(this);
    };

    /**
     * [fromJSON](https://github.com/mourner/rbush#export-and-import)
     *
     * @param {any} json import previously exported data
     * @returns {RBush} GeoJSON RBush
     * @example
     * var exported = {
     *   "children": [
     *     {
     *       "type": "Feature",
     *       "geometry": {
     *         "type": "Point",
     *         "coordinates": [110, 50]
     *       },
     *       "properties": {},
     *       "bbox": [110, 50, 110, 50]
     *     }
     *   ],
     *   "height": 1,
     *   "leaf": true,
     *   "minX": 110,
     *   "minY": 50,
     *   "maxX": 110,
     *   "maxY": 50
     * }
     * tree.fromJSON(exported)
     */
    tree.fromJSON = function (json) {
        return rbush.prototype.fromJSON.call(this, json);
    };

    /**
     * Converts GeoJSON to {minX, minY, maxX, maxY} schema
     *
     * @private
     * @param {BBox|FeatureCollection|Feature} geojson feature(s) to retrieve BBox from
     * @returns {Object} converted to {minX, minY, maxX, maxY}
     */
    tree.toBBox = function (geojson) {
        var bbox;
        if (geojson.bbox) bbox = geojson.bbox;
        else if (Array.isArray(geojson) && geojson.length === 4) bbox = geojson;
        else if (Array.isArray(geojson) && geojson.length === 6) bbox = [geojson[0], geojson[1], geojson[3], geojson[4]];
        else if (geojson.type === 'Feature') bbox = turfBBox(geojson);
        else if (geojson.type === 'FeatureCollection') bbox = turfBBox(geojson);
        else throw new Error('invalid geojson')

        return {
            minX: bbox[0],
            minY: bbox[1],
            maxX: bbox[2],
            maxY: bbox[3]
        };
    };
    return tree;
}

module.exports = geojsonRbush;
module.exports.default = geojsonRbush;

},{"@turf/bbox":5,"@turf/helpers":9,"@turf/meta":13,"rbush":50}],47:[function(require,module,exports){
module.exports = require('./lib/heap');

},{"./lib/heap":48}],48:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
(function() {
  var Heap, defaultCmp, floor, heapify, heappop, heappush, heappushpop, heapreplace, insort, min, nlargest, nsmallest, updateItem, _siftdown, _siftup;

  floor = Math.floor, min = Math.min;


  /*
  Default comparison function to be used
   */

  defaultCmp = function(x, y) {
    if (x < y) {
      return -1;
    }
    if (x > y) {
      return 1;
    }
    return 0;
  };


  /*
  Insert item x in list a, and keep it sorted assuming a is sorted.
  
  If x is already in a, insert it to the right of the rightmost x.
  
  Optional args lo (default 0) and hi (default a.length) bound the slice
  of a to be searched.
   */

  insort = function(a, x, lo, hi, cmp) {
    var mid;
    if (lo == null) {
      lo = 0;
    }
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (lo < 0) {
      throw new Error('lo must be non-negative');
    }
    if (hi == null) {
      hi = a.length;
    }
    while (lo < hi) {
      mid = floor((lo + hi) / 2);
      if (cmp(x, a[mid]) < 0) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return ([].splice.apply(a, [lo, lo - lo].concat(x)), x);
  };


  /*
  Push item onto heap, maintaining the heap invariant.
   */

  heappush = function(array, item, cmp) {
    if (cmp == null) {
      cmp = defaultCmp;
    }
    array.push(item);
    return _siftdown(array, 0, array.length - 1, cmp);
  };


  /*
  Pop the smallest item off the heap, maintaining the heap invariant.
   */

  heappop = function(array, cmp) {
    var lastelt, returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    lastelt = array.pop();
    if (array.length) {
      returnitem = array[0];
      array[0] = lastelt;
      _siftup(array, 0, cmp);
    } else {
      returnitem = lastelt;
    }
    return returnitem;
  };


  /*
  Pop and return the current smallest value, and add the new item.
  
  This is more efficient than heappop() followed by heappush(), and can be
  more appropriate when using a fixed size heap. Note that the value
  returned may be larger than item! That constrains reasonable use of
  this routine unless written as part of a conditional replacement:
      if item > array[0]
        item = heapreplace(array, item)
   */

  heapreplace = function(array, item, cmp) {
    var returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    returnitem = array[0];
    array[0] = item;
    _siftup(array, 0, cmp);
    return returnitem;
  };


  /*
  Fast version of a heappush followed by a heappop.
   */

  heappushpop = function(array, item, cmp) {
    var _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (array.length && cmp(array[0], item) < 0) {
      _ref = [array[0], item], item = _ref[0], array[0] = _ref[1];
      _siftup(array, 0, cmp);
    }
    return item;
  };


  /*
  Transform list into a heap, in-place, in O(array.length) time.
   */

  heapify = function(array, cmp) {
    var i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    _ref1 = (function() {
      _results1 = [];
      for (var _j = 0, _ref = floor(array.length / 2); 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--){ _results1.push(_j); }
      return _results1;
    }).apply(this).reverse();
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      i = _ref1[_i];
      _results.push(_siftup(array, i, cmp));
    }
    return _results;
  };


  /*
  Update the position of the given item in the heap.
  This function should be called every time the item is being modified.
   */

  updateItem = function(array, item, cmp) {
    var pos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    pos = array.indexOf(item);
    if (pos === -1) {
      return;
    }
    _siftdown(array, 0, pos, cmp);
    return _siftup(array, pos, cmp);
  };


  /*
  Find the n largest elements in a dataset.
   */

  nlargest = function(array, n, cmp) {
    var elem, result, _i, _len, _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    result = array.slice(0, n);
    if (!result.length) {
      return result;
    }
    heapify(result, cmp);
    _ref = array.slice(n);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      heappushpop(result, elem, cmp);
    }
    return result.sort(cmp).reverse();
  };


  /*
  Find the n smallest elements in a dataset.
   */

  nsmallest = function(array, n, cmp) {
    var elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (n * 10 <= array.length) {
      result = array.slice(0, n).sort(cmp);
      if (!result.length) {
        return result;
      }
      los = result[result.length - 1];
      _ref = array.slice(n);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        if (cmp(elem, los) < 0) {
          insort(result, elem, 0, null, cmp);
          result.pop();
          los = result[result.length - 1];
        }
      }
      return result;
    }
    heapify(array, cmp);
    _results = [];
    for (i = _j = 0, _ref1 = min(n, array.length); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      _results.push(heappop(array, cmp));
    }
    return _results;
  };

  _siftdown = function(array, startpos, pos, cmp) {
    var newitem, parent, parentpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    newitem = array[pos];
    while (pos > startpos) {
      parentpos = (pos - 1) >> 1;
      parent = array[parentpos];
      if (cmp(newitem, parent) < 0) {
        array[pos] = parent;
        pos = parentpos;
        continue;
      }
      break;
    }
    return array[pos] = newitem;
  };

  _siftup = function(array, pos, cmp) {
    var childpos, endpos, newitem, rightpos, startpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    endpos = array.length;
    startpos = pos;
    newitem = array[pos];
    childpos = 2 * pos + 1;
    while (childpos < endpos) {
      rightpos = childpos + 1;
      if (rightpos < endpos && !(cmp(array[childpos], array[rightpos]) < 0)) {
        childpos = rightpos;
      }
      array[pos] = array[childpos];
      pos = childpos;
      childpos = 2 * pos + 1;
    }
    array[pos] = newitem;
    return _siftdown(array, startpos, pos, cmp);
  };

  Heap = (function() {
    Heap.push = heappush;

    Heap.pop = heappop;

    Heap.replace = heapreplace;

    Heap.pushpop = heappushpop;

    Heap.heapify = heapify;

    Heap.updateItem = updateItem;

    Heap.nlargest = nlargest;

    Heap.nsmallest = nsmallest;

    function Heap(cmp) {
      this.cmp = cmp != null ? cmp : defaultCmp;
      this.nodes = [];
    }

    Heap.prototype.push = function(x) {
      return heappush(this.nodes, x, this.cmp);
    };

    Heap.prototype.pop = function() {
      return heappop(this.nodes, this.cmp);
    };

    Heap.prototype.peek = function() {
      return this.nodes[0];
    };

    Heap.prototype.contains = function(x) {
      return this.nodes.indexOf(x) !== -1;
    };

    Heap.prototype.replace = function(x) {
      return heapreplace(this.nodes, x, this.cmp);
    };

    Heap.prototype.pushpop = function(x) {
      return heappushpop(this.nodes, x, this.cmp);
    };

    Heap.prototype.heapify = function() {
      return heapify(this.nodes, this.cmp);
    };

    Heap.prototype.updateItem = function(x) {
      return updateItem(this.nodes, x, this.cmp);
    };

    Heap.prototype.clear = function() {
      return this.nodes = [];
    };

    Heap.prototype.empty = function() {
      return this.nodes.length === 0;
    };

    Heap.prototype.size = function() {
      return this.nodes.length;
    };

    Heap.prototype.clone = function() {
      var heap;
      heap = new Heap();
      heap.nodes = this.nodes.slice(0);
      return heap;
    };

    Heap.prototype.toArray = function() {
      return this.nodes.slice(0);
    };

    Heap.prototype.insert = Heap.prototype.push;

    Heap.prototype.top = Heap.prototype.peek;

    Heap.prototype.front = Heap.prototype.peek;

    Heap.prototype.has = Heap.prototype.contains;

    Heap.prototype.copy = Heap.prototype.clone;

    return Heap;

  })();

  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      return define([], factory);
    } else if (typeof exports === 'object') {
      return module.exports = factory();
    } else {
      return root.Heap = factory();
    }
  })(this, function() {
    return Heap;
  });

}).call(this);

},{}],49:[function(require,module,exports){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.quickselect = factory());
}(this, (function () { 'use strict';

function quickselect(arr, k, left, right, compare) {
    quickselectStep(arr, k, left || 0, right || (arr.length - 1), compare || defaultCompare);
}

function quickselectStep(arr, k, left, right, compare) {

    while (right > left) {
        if (right - left > 600) {
            var n = right - left + 1;
            var m = k - left + 1;
            var z = Math.log(n);
            var s = 0.5 * Math.exp(2 * z / 3);
            var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
            var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
            var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
            quickselectStep(arr, k, newLeft, newRight, compare);
        }

        var t = arr[k];
        var i = left;
        var j = right;

        swap(arr, left, k);
        if (compare(arr[right], t) > 0) swap(arr, left, right);

        while (i < j) {
            swap(arr, i, j);
            i++;
            j--;
            while (compare(arr[i], t) < 0) i++;
            while (compare(arr[j], t) > 0) j--;
        }

        if (compare(arr[left], t) === 0) swap(arr, left, j);
        else {
            j++;
            swap(arr, j, right);
        }

        if (j <= k) left = j + 1;
        if (k <= j) right = j - 1;
    }
}

function swap(arr, i, j) {
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
}

function defaultCompare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

return quickselect;

})));

},{}],50:[function(require,module,exports){
'use strict';

module.exports = rbush;
module.exports.default = rbush;

var quickselect = require('quickselect');

function rbush(maxEntries, format) {
    if (!(this instanceof rbush)) return new rbush(maxEntries, format);

    // max entries in a node is 9 by default; min node fill is 40% for best performance
    this._maxEntries = Math.max(4, maxEntries || 9);
    this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));

    if (format) {
        this._initFormat(format);
    }

    this.clear();
}

rbush.prototype = {

    all: function () {
        return this._all(this.data, []);
    },

    search: function (bbox) {

        var node = this.data,
            result = [],
            toBBox = this.toBBox;

        if (!intersects(bbox, node)) return result;

        var nodesToSearch = [],
            i, len, child, childBBox;

        while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {

                child = node.children[i];
                childBBox = node.leaf ? toBBox(child) : child;

                if (intersects(bbox, childBBox)) {
                    if (node.leaf) result.push(child);
                    else if (contains(bbox, childBBox)) this._all(child, result);
                    else nodesToSearch.push(child);
                }
            }
            node = nodesToSearch.pop();
        }

        return result;
    },

    collides: function (bbox) {

        var node = this.data,
            toBBox = this.toBBox;

        if (!intersects(bbox, node)) return false;

        var nodesToSearch = [],
            i, len, child, childBBox;

        while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {

                child = node.children[i];
                childBBox = node.leaf ? toBBox(child) : child;

                if (intersects(bbox, childBBox)) {
                    if (node.leaf || contains(bbox, childBBox)) return true;
                    nodesToSearch.push(child);
                }
            }
            node = nodesToSearch.pop();
        }

        return false;
    },

    load: function (data) {
        if (!(data && data.length)) return this;

        if (data.length < this._minEntries) {
            for (var i = 0, len = data.length; i < len; i++) {
                this.insert(data[i]);
            }
            return this;
        }

        // recursively build the tree with the given data from scratch using OMT algorithm
        var node = this._build(data.slice(), 0, data.length - 1, 0);

        if (!this.data.children.length) {
            // save as is if tree is empty
            this.data = node;

        } else if (this.data.height === node.height) {
            // split root if trees have the same height
            this._splitRoot(this.data, node);

        } else {
            if (this.data.height < node.height) {
                // swap trees if inserted one is bigger
                var tmpNode = this.data;
                this.data = node;
                node = tmpNode;
            }

            // insert the small tree into the large tree at appropriate level
            this._insert(node, this.data.height - node.height - 1, true);
        }

        return this;
    },

    insert: function (item) {
        if (item) this._insert(item, this.data.height - 1);
        return this;
    },

    clear: function () {
        this.data = createNode([]);
        return this;
    },

    remove: function (item, equalsFn) {
        if (!item) return this;

        var node = this.data,
            bbox = this.toBBox(item),
            path = [],
            indexes = [],
            i, parent, index, goingUp;

        // depth-first iterative tree traversal
        while (node || path.length) {

            if (!node) { // go up
                node = path.pop();
                parent = path[path.length - 1];
                i = indexes.pop();
                goingUp = true;
            }

            if (node.leaf) { // check current node
                index = findItem(item, node.children, equalsFn);

                if (index !== -1) {
                    // item found, remove the item and condense tree upwards
                    node.children.splice(index, 1);
                    path.push(node);
                    this._condense(path);
                    return this;
                }
            }

            if (!goingUp && !node.leaf && contains(node, bbox)) { // go down
                path.push(node);
                indexes.push(i);
                i = 0;
                parent = node;
                node = node.children[0];

            } else if (parent) { // go right
                i++;
                node = parent.children[i];
                goingUp = false;

            } else node = null; // nothing found
        }

        return this;
    },

    toBBox: function (item) { return item; },

    compareMinX: compareNodeMinX,
    compareMinY: compareNodeMinY,

    toJSON: function () { return this.data; },

    fromJSON: function (data) {
        this.data = data;
        return this;
    },

    _all: function (node, result) {
        var nodesToSearch = [];
        while (node) {
            if (node.leaf) result.push.apply(result, node.children);
            else nodesToSearch.push.apply(nodesToSearch, node.children);

            node = nodesToSearch.pop();
        }
        return result;
    },

    _build: function (items, left, right, height) {

        var N = right - left + 1,
            M = this._maxEntries,
            node;

        if (N <= M) {
            // reached leaf level; return leaf
            node = createNode(items.slice(left, right + 1));
            calcBBox(node, this.toBBox);
            return node;
        }

        if (!height) {
            // target height of the bulk-loaded tree
            height = Math.ceil(Math.log(N) / Math.log(M));

            // target number of root entries to maximize storage utilization
            M = Math.ceil(N / Math.pow(M, height - 1));
        }

        node = createNode([]);
        node.leaf = false;
        node.height = height;

        // split the items into M mostly square tiles

        var N2 = Math.ceil(N / M),
            N1 = N2 * Math.ceil(Math.sqrt(M)),
            i, j, right2, right3;

        multiSelect(items, left, right, N1, this.compareMinX);

        for (i = left; i <= right; i += N1) {

            right2 = Math.min(i + N1 - 1, right);

            multiSelect(items, i, right2, N2, this.compareMinY);

            for (j = i; j <= right2; j += N2) {

                right3 = Math.min(j + N2 - 1, right2);

                // pack each entry recursively
                node.children.push(this._build(items, j, right3, height - 1));
            }
        }

        calcBBox(node, this.toBBox);

        return node;
    },

    _chooseSubtree: function (bbox, node, level, path) {

        var i, len, child, targetNode, area, enlargement, minArea, minEnlargement;

        while (true) {
            path.push(node);

            if (node.leaf || path.length - 1 === level) break;

            minArea = minEnlargement = Infinity;

            for (i = 0, len = node.children.length; i < len; i++) {
                child = node.children[i];
                area = bboxArea(child);
                enlargement = enlargedArea(bbox, child) - area;

                // choose entry with the least area enlargement
                if (enlargement < minEnlargement) {
                    minEnlargement = enlargement;
                    minArea = area < minArea ? area : minArea;
                    targetNode = child;

                } else if (enlargement === minEnlargement) {
                    // otherwise choose one with the smallest area
                    if (area < minArea) {
                        minArea = area;
                        targetNode = child;
                    }
                }
            }

            node = targetNode || node.children[0];
        }

        return node;
    },

    _insert: function (item, level, isNode) {

        var toBBox = this.toBBox,
            bbox = isNode ? item : toBBox(item),
            insertPath = [];

        // find the best node for accommodating the item, saving all nodes along the path too
        var node = this._chooseSubtree(bbox, this.data, level, insertPath);

        // put the item into the node
        node.children.push(item);
        extend(node, bbox);

        // split on node overflow; propagate upwards if necessary
        while (level >= 0) {
            if (insertPath[level].children.length > this._maxEntries) {
                this._split(insertPath, level);
                level--;
            } else break;
        }

        // adjust bboxes along the insertion path
        this._adjustParentBBoxes(bbox, insertPath, level);
    },

    // split overflowed node into two
    _split: function (insertPath, level) {

        var node = insertPath[level],
            M = node.children.length,
            m = this._minEntries;

        this._chooseSplitAxis(node, m, M);

        var splitIndex = this._chooseSplitIndex(node, m, M);

        var newNode = createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
        newNode.height = node.height;
        newNode.leaf = node.leaf;

        calcBBox(node, this.toBBox);
        calcBBox(newNode, this.toBBox);

        if (level) insertPath[level - 1].children.push(newNode);
        else this._splitRoot(node, newNode);
    },

    _splitRoot: function (node, newNode) {
        // split root node
        this.data = createNode([node, newNode]);
        this.data.height = node.height + 1;
        this.data.leaf = false;
        calcBBox(this.data, this.toBBox);
    },

    _chooseSplitIndex: function (node, m, M) {

        var i, bbox1, bbox2, overlap, area, minOverlap, minArea, index;

        minOverlap = minArea = Infinity;

        for (i = m; i <= M - m; i++) {
            bbox1 = distBBox(node, 0, i, this.toBBox);
            bbox2 = distBBox(node, i, M, this.toBBox);

            overlap = intersectionArea(bbox1, bbox2);
            area = bboxArea(bbox1) + bboxArea(bbox2);

            // choose distribution with minimum overlap
            if (overlap < minOverlap) {
                minOverlap = overlap;
                index = i;

                minArea = area < minArea ? area : minArea;

            } else if (overlap === minOverlap) {
                // otherwise choose distribution with minimum area
                if (area < minArea) {
                    minArea = area;
                    index = i;
                }
            }
        }

        return index;
    },

    // sorts node children by the best axis for split
    _chooseSplitAxis: function (node, m, M) {

        var compareMinX = node.leaf ? this.compareMinX : compareNodeMinX,
            compareMinY = node.leaf ? this.compareMinY : compareNodeMinY,
            xMargin = this._allDistMargin(node, m, M, compareMinX),
            yMargin = this._allDistMargin(node, m, M, compareMinY);

        // if total distributions margin value is minimal for x, sort by minX,
        // otherwise it's already sorted by minY
        if (xMargin < yMargin) node.children.sort(compareMinX);
    },

    // total margin of all possible split distributions where each node is at least m full
    _allDistMargin: function (node, m, M, compare) {

        node.children.sort(compare);

        var toBBox = this.toBBox,
            leftBBox = distBBox(node, 0, m, toBBox),
            rightBBox = distBBox(node, M - m, M, toBBox),
            margin = bboxMargin(leftBBox) + bboxMargin(rightBBox),
            i, child;

        for (i = m; i < M - m; i++) {
            child = node.children[i];
            extend(leftBBox, node.leaf ? toBBox(child) : child);
            margin += bboxMargin(leftBBox);
        }

        for (i = M - m - 1; i >= m; i--) {
            child = node.children[i];
            extend(rightBBox, node.leaf ? toBBox(child) : child);
            margin += bboxMargin(rightBBox);
        }

        return margin;
    },

    _adjustParentBBoxes: function (bbox, path, level) {
        // adjust bboxes along the given tree path
        for (var i = level; i >= 0; i--) {
            extend(path[i], bbox);
        }
    },

    _condense: function (path) {
        // go through the path, removing empty nodes and updating bboxes
        for (var i = path.length - 1, siblings; i >= 0; i--) {
            if (path[i].children.length === 0) {
                if (i > 0) {
                    siblings = path[i - 1].children;
                    siblings.splice(siblings.indexOf(path[i]), 1);

                } else this.clear();

            } else calcBBox(path[i], this.toBBox);
        }
    },

    _initFormat: function (format) {
        // data format (minX, minY, maxX, maxY accessors)

        // uses eval-type function compilation instead of just accepting a toBBox function
        // because the algorithms are very sensitive to sorting functions performance,
        // so they should be dead simple and without inner calls

        var compareArr = ['return a', ' - b', ';'];

        this.compareMinX = new Function('a', 'b', compareArr.join(format[0]));
        this.compareMinY = new Function('a', 'b', compareArr.join(format[1]));

        this.toBBox = new Function('a',
            'return {minX: a' + format[0] +
            ', minY: a' + format[1] +
            ', maxX: a' + format[2] +
            ', maxY: a' + format[3] + '};');
    }
};

function findItem(item, items, equalsFn) {
    if (!equalsFn) return items.indexOf(item);

    for (var i = 0; i < items.length; i++) {
        if (equalsFn(item, items[i])) return i;
    }
    return -1;
}

// calculate node's bbox from bboxes of its children
function calcBBox(node, toBBox) {
    distBBox(node, 0, node.children.length, toBBox, node);
}

// min bounding rectangle of node children from k to p-1
function distBBox(node, k, p, toBBox, destNode) {
    if (!destNode) destNode = createNode(null);
    destNode.minX = Infinity;
    destNode.minY = Infinity;
    destNode.maxX = -Infinity;
    destNode.maxY = -Infinity;

    for (var i = k, child; i < p; i++) {
        child = node.children[i];
        extend(destNode, node.leaf ? toBBox(child) : child);
    }

    return destNode;
}

function extend(a, b) {
    a.minX = Math.min(a.minX, b.minX);
    a.minY = Math.min(a.minY, b.minY);
    a.maxX = Math.max(a.maxX, b.maxX);
    a.maxY = Math.max(a.maxY, b.maxY);
    return a;
}

function compareNodeMinX(a, b) { return a.minX - b.minX; }
function compareNodeMinY(a, b) { return a.minY - b.minY; }

function bboxArea(a)   { return (a.maxX - a.minX) * (a.maxY - a.minY); }
function bboxMargin(a) { return (a.maxX - a.minX) + (a.maxY - a.minY); }

function enlargedArea(a, b) {
    return (Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX)) *
           (Math.max(b.maxY, a.maxY) - Math.min(b.minY, a.minY));
}

function intersectionArea(a, b) {
    var minX = Math.max(a.minX, b.minX),
        minY = Math.max(a.minY, b.minY),
        maxX = Math.min(a.maxX, b.maxX),
        maxY = Math.min(a.maxY, b.maxY);

    return Math.max(0, maxX - minX) *
           Math.max(0, maxY - minY);
}

function contains(a, b) {
    return a.minX <= b.minX &&
           a.minY <= b.minY &&
           b.maxX <= a.maxX &&
           b.maxY <= a.maxY;
}

function intersects(a, b) {
    return b.minX <= a.maxX &&
           b.minY <= a.maxY &&
           b.maxX >= a.minX &&
           b.maxY >= a.minY;
}

function createNode(children) {
    return {
        children: children,
        height: 1,
        leaf: true,
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
    };
}

// sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
// combines selection algorithm with binary divide & conquer approach

function multiSelect(arr, left, right, n, compare) {
    var stack = [left, right],
        mid;

    while (stack.length) {
        right = stack.pop();
        left = stack.pop();

        if (right - left <= n) continue;

        mid = left + Math.ceil((right - left) / n / 2) * n;
        quickselect(arr, mid, left, right, compare);

        stack.push(left, mid, mid, right);
    }
}

},{"quickselect":49}]},{},[1])(1)
});
