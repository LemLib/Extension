'use strict';

////////////////////////////////////////////////////////////////
// Settings.js
////////////////////////////////////////////////////////////////

/**
 * Global objects
 */
const decelerationSlider = document.getElementById('decelerationSlider');
const maxSpeedSlider = document.getElementById('maxSpeedSlider');
const multiplierSlider = document.getElementById('multiplierSlider');

const decelerationText = document.getElementById('decelVal');
const maxSpeedText = document.getElementById('maxSpeedVal');
const multiplierText = document.getElementById('multiplierVal');

let mode = 0; // 0: create; 1: debug
let path;
let highlightList = [];
let highlightCircles = [];


/**
 * Path settings
 */
const spacing = 2; // target inches between points


/**
 * Graphics settings
 */
const imgTrueWidth = 147.8377757; // the width of the image in inches
const img = new Image; // background image
img.src = document.currentScript.getAttribute('data-img-src');
const fps = 60; // how many frames to render each second


/**
 * Accessibility settings
 */
const pointRadius = 1;
const pointBorderWidth = 0;
const lineWidth = 1;
const controlPointColor = 'rgba(50, 161, 68, 0.452)';
const controlPointRadius = 5;
const controlPointBorderColor = 'rgba(50, 161, 68, 0.452)';
const controlPointBorderWidth = 0;
const controlLineWidth = 0.5;
const controlLineColor = 'black';

////////////////////////////////////////////////////////////////
// Vector.js
////////////////////////////////////////////////////////////////

/**
 * @brief Class for vectors
 */
class Vector {
  /**
   * @brief Constructor
   * @param {number} x x coordinate
   * @param {number} y y coordinate
   * @param {number} data data
   * @param {number} data2 data2
   */
  constructor(x, y, data = 0, data2 = 0) {
    this.x = x;
    this.y = y;
    this.data = data;
  }

  /**
   * @brief Add two vectors
   * @param {Vector} v1 vector 1
   * @param {Vector} v2 vector 2
   * @return {Vector} sum of v1 and v2
   * @note This is a static class method
   */
  static add(v1, v2) {
    return new Vector(v1.x + v2.x, v1.y + v2.y, 0);
  }

  /**
   * @brief Subtract two vectors
   * @param {Vector} v1 vector 1
   * @param {Vector} v2 vector 2
   * @return {Vector} difference of v1 and v2
   * @note This is a static class method
   */
  static subtract(v1, v2) {
    return new Vector(v1.x - v2.x, v1.y - v2.y, 0);
  }

  /**
   * @brief Multiply a vector by a scalar
   * @param {Vector} v vector
   * @param {number} s scalar
   * @return {Vector} product of v and s
   * @note This is a static class method
   */
  static multiply(v, s) {
    return new Vector(v.x * s, v.y * s, 0);
  }

  /**
   * @brief Divide a vector by a scalar
   * @param {Vector} v vector
   * @param {number} s scalar
   * @return {Vector} quotient of v and s
   * @note This is a static class method
   * @note This method will throw an error if s is 0
   */
  static divide(v, s) {
    if (s === 0) {
      throw new Error('Divide by 0');
    }
    return new Vector(v.x / s, v.y / s, 0);
  }

  /**
   * @brief dot product of two vectors
   * @param {Vector} v1 vector 1
   * @param {Vector} v2 vector 2
   * @return {number} dot product of v1 and v2
   * @note This is a static class method
   */
  static dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
  }

  /**
   * @brief distance between two vectors
   * @param {Vector} v1 vector 1
   * @param {Vector} v2 vector 2
   * @return {number} distance between v1 and v2
   * @note This is a static class method
   */
  static distance(v1, v2) {
    return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) +
        (v1.y - v2.y) * (v1.y - v2.y));
  }

  /**
   * @brief interpolate between two points
   * @param {number} d - the distance
   * @param {Vector} v1 - the first point
   * @param {Vector} v2 - the second point
   * @return {Vector} - the interpolated point
   */
  static interpolate(d, v1, v2) {
    // use trig to find the angle between the two points
    const angle = Math.atan2(v2.y - v1.y, v2.x - v1.x);
    // use the angle to find the x and y components of the vector
    const x = (d * Math.cos(angle)) + v1.x;
    const y = (d * Math.sin(angle)) + v1.y;
    return new Vector(x, y);
  }

  /**
   * @brief get the magnitude of the vector
   * @return {number} magnitude of the vector
   * @note This is a static class method
   */
  get magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
};

////////////////////////////////////////////////////////////////
// Graphics.js
////////////////////////////////////////////////////////////////

const canvas = document.getElementById('fieldCanvas');
const ctx = canvas.getContext('2d');


// constants based on settings
// these are not the settings you are looking for
const imgActualWidth = Number(canvas.attributes.width.value);
const imgHalfActualWidth = imgActualWidth / 2;
const imgPixelsPerInch = imgActualWidth / imgTrueWidth;


/**
 * @brief Line class
 */
class Line {
  static instances = []; // store all instances of the class

  /**
   * @brief constructor
   * @param {Vector} start start point
   * @param {Vector} end end point
   * @param {Number} width line width
   * @param {String} color line color (hex)
   * @param {Bool} visible should the line be visible
   */
  constructor(start, end, width = 1, color = 'black', visible = true) {
    this.start = start;
    this.end = end;
    this.width = width;
    this.color = color;
    this.visible = visible;
    this.index = Line.instances.length;
    Line.instances.push(this);
  }

  /**
   * @brief remove the line from the canvas
   */
  remove() {
    Line.instances.splice(this.index, 1);
    for (let i = this.index; i < Line.instances.length; i++) {
      Line.instances[i].index--;
    }
  }
};


/**
 * @brief Rectangle class
 */
class Rectangle {
  static instances = []; // store all instances of the class

  /**
   * @brief constructor
   * @param {Vector} start start point
   * @param {Vector} end end point
   * @param {String} color fill color (hex)
   * @param {Number} borderWidth border width
   * @param {String} borderColor border color (hex)
   * @param {Bool} visible should the rectangle be visible
   */
  constructor(start, end, color = 'black',
      borderWidth = 0, borderColor = 'black', visible = true) {
    this.start = start;
    this.end = end;
    this.color = color;
    this.borderWidth = borderWidth;
    this.borderColor = borderColor;
    this.visible = visible;
    this.index = Rectangle.instances.length;
    Rectangle.instances.push(this);
  }

  /**
   * @brief check if a shape is contained in the rectangle
   * @param {Shape} shape the shape to check
   * @return {bool} true if it contains the shape, false otherwise
   */
  contains(shape) {
    let left = 0;
    let right = 0;
    if (this.start.x < this.end.x) {
      left = this.start.x;
      right = this.end.x;
    } else {
      left = this.end.x;
      right = this.start.x;
    }
    let top = 0;
    let bottom = 0;
    if (this.start.y < this.end.y) {
      bottom = this.start.y;
      top = this.end.y;
    } else {
      bottom = this.end.y;
      top = this.start.y;
    }

    // check if it contains the shape
    if (shape.center.x > left && shape.center.x < right) {
      if (shape.center.y > bottom && shape.center.y < top) {
        return true;
      }
    }

    // return false by default
    return false;
  }

  /**
   * @brief remove the rectangle from the canvas
   */
  remove() {
    Rectangle.instances.splice(this.index, 1);
    for (let i = this.index; i < Rectangle.instances.length; i++) {
      Rectangle.instances[i].index--;
    }
  }
};


/**
 * @brief Circle class
 */
class Circle {
  static instances = []; // store all instances of the class

  /**
   * @brief constructor
   * @param {Vector} center center point
   * @param {Number} radius radius
   * @param {String} color fill color (hex)
   * @param {Number} borderWidth border width
   * @param {String} borderColor border color (hex)
   * @param {Bool} visible should the circle be visible
   */
  constructor(center, radius, color = 'black',
      borderWidth = 0, borderColor = 'black', visible = true) {
    this.center = center;
    this.radius = radius;
    this.color = color;
    this.borderWidth = borderWidth;
    this.borderColor = borderColor;
    this.visible = visible;
    this.index = Circle.instances.length;
    Circle.instances.push(this);
  }

  /**
   * @brief remove the circle from the canvas
   */
  remove() {
    Circle.instances.splice(this.index, 1);
    for (let i = this.index; i < Circle.instances.length; i++) {
      Circle.instances[i].index--;
    }
  }
}


/**
 * @brief Text class
 */
class SimpleText {
  static instances = []; // store all instances of the class

  /**
   * @brief constructor
   * @param {Vector} position position
   * @param {String} text text
   * @param {String} color text color (hex)
   * @param {Number} size text size
   * @param {String} font text font
   * @param {Bool} visible should the text be visible
   */
  constructor(position, text, color = 'black', size = 12, font = 'Arial',
      visible = true) {
    this.position = position;
    this.text = text;
    this.color = color;
    this.size = size;
    this.font = font;
    this.visible = visible;
    this.index = SimpleText.instances.length;
    SimpleText.instances.push(this);
  }

  /**
   * @brief remove the text from the canvas
   */
  remove() {
    SimpleText.instances.splice(this.index, 1);
    for (let i = this.index; i < SimpleText.instances.length; i++) {
      SimpleText.instances[i].index--;
    }
  }
};


/**
 * @brief convert the mouse position to position in coordinate system
 * @param {Vector} point - the mouse position
 * @return {Vector} - the position in the coordinate system
 */
function pxToCoord(point) {
  const newPoint = new Vector(point.x, point.y);
  newPoint.x = newPoint.x - imgHalfActualWidth;
  newPoint.y = imgActualWidth - newPoint.y - imgHalfActualWidth;
  newPoint.x = newPoint.x / imgPixelsPerInch;
  newPoint.y = newPoint.y / imgPixelsPerInch;
  return newPoint;
};


/**
 * @brief convert a point in the coordinate system to the position on the canvas
 * @param {Vector} point - the point on the coordinate system
 * @return {Vector} - the position on the canvas
 */
function coordToPx(point) {
  const newPoint = new Vector(point.x, point.y);
  newPoint.x = newPoint.x * imgPixelsPerInch;
  newPoint.y = newPoint.y * imgPixelsPerInch;
  newPoint.x = newPoint.x + imgHalfActualWidth;
  newPoint.y = imgActualWidth - newPoint.y - imgHalfActualWidth;
  return newPoint;
};


/**
 * @brief render function
 */
function render() {
  // clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw the background image
  ctx.drawImage(img, 0, 0, img.width, img.height, // source rectangle
      0, 0, canvas.width, canvas.height); // destination rectangle

  // draw all lines
  for (let i = 0; i < Line.instances.length; i++) {
    if (Line.instances[i].visible) {
      const line = Line.instances[i];
      const start = coordToPx(line.start);
      const end = coordToPx(line.end);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.lineWidth = line.width*imgPixelsPerInch;
      ctx.strokeStyle = line.color;
      ctx.stroke();
      ctx.closePath();
    }
  }

  // draw all circles
  for (let i = 0; i < Circle.instances.length; i++) {
    if (Circle.instances[i].visible) {
      const circle = Circle.instances[i];
      const center = coordToPx(circle.center);
      ctx.beginPath();
      ctx.arc(center.x, center.y, circle.radius * imgPixelsPerInch,
          0, 2 * Math.PI);
      ctx.fillStyle = circle.color;
      ctx.fill();
      ctx.lineWidth = circle.borderWidth*imgPixelsPerInch;
      ctx.strokeStyle = circle.borderColor;
      if (circle.borderWidth != 0) {
        ctx.stroke();
      }
      ctx.closePath();
    }
  }

  // draw all rectangles
  for (let i = 0; i < Rectangle.instances.length; i++) {
    if (Rectangle.instances[i].visible) {
      const rect = Rectangle.instances[i];
      const start = coordToPx(rect.start);
      const end = coordToPx(rect.end);
      ctx.beginPath();
      ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
      ctx.fillStyle = rect.color;
      ctx.fill();
      ctx.lineWidth = rect.borderWidth*imgPixelsPerInch;
      ctx.strokeStyle = rect.borderColor;
      if (rect.borderWidth != 0) {
        ctx.stroke();
      }
      ctx.closePath();
    }
  }

  // draw all texts
  for (let i = 0; i < SimpleText.instances.length; i++) {
    if (SimpleText.instances[i].visible) {
      const text = SimpleText.instances[i];
      const position = coordToPx(text.position);
      ctx.beginPath();
      ctx.font = text.size * imgPixelsPerInch + 'px ' + text.font;
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, position.x, position.y);
      ctx.closePath();
    }
  }
}


/**
 * @brief convert an HSl color code to Hex
 * @param {number} h - the hue
 * @param {number} s - the saturation
 * @param {number} l - the lightness
 * @return {string} - the hex color code
 */
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};


// create the newSpeedBox
const newSpeedBox = new Rectangle(new Vector(0, 0), new Vector(0, 0),
    'rgb(177, 127, 238)');
const newSpeedText = new SimpleText(new Vector(0, 0), '', 'black', 8);


/**
 * @brief clear the highlighted points
 */
function clearHighlight() {
  highlightList = [];
  while (highlightCircles.length > 0) {
    highlightCircles.pop().remove();
  }
  newSpeedBox.start = new Vector(0, 0);
  newSpeedBox.end = new Vector(0, 0);
  newSpeedText.text = '';
}

////////////////////////////////////////
// Path.js
////////////////////////////////////////

/**
 * @brief Spline class
 */
class Spline {
    /**
     * @brief constructor
     * @param {Vector} p0 - first point
     * @param {Vector} p1 - second point
     * @param {Vector} p2 - third point
     * @param {Vector} p3 - fourth point
     */
    constructor(p0, p1, p2, p3) {
      this.p0 = p0;
      this.p1 = p1;
      this.p2 = p2;
      this.p3 = p3;
      this.points = [];
    }
  
    /**
     * @brief get the points on the spline
     */
    genPoints() {
      // clear any exiting points
      this.points = [];
      for (let t = 0; t <= 1; t += 0.01) {
        t = parseFloat(t.toPrecision(10));
        const tempIndex = parseFloat((t*100).toPrecision(10));
        const x = (1-t)**3*this.p0.x + 3*t*(1-t)**2*this.p1.x +
            3*t**2*(1-t)*this.p2.x + t**3*this.p3.x;
        const y = (1-t)**3*this.p0.y + 3*t*(1-t)**2*this.p1.y +
            3*t**2*(1-t)*this.p2.y + t**3*this.p3.y;
        this.points.push(new Vector(x, y));
      }
    }
  };
  
  
  /**
   * @brief Path class
   */
  class Path {
    /**
     * @brief constructor
     * @param {Spline} spline - the first spline of the path
     */
    constructor(spline) {
      this.visible = true;
      this.splines = [spline];
      this.points = [];
      this.circles = [];
      this.lines = [];
      this.controlCircles = [];
      this.controlLines = [];
      this.update();
    }
  
    /**
     * @brief add an endpoint to the path
     * @param {Vector} point - the endpoint to add
     */
    addPoint(point) {
      // the first point is the same as the endpoint on the previous spline
      const p0 = this.splines[this.splines.length - 1].p3;
      // calculate the first control point
      // it is mirrored to the last control point of the previous spline
      const oldControl = this.splines[this.splines.length -1].p2;
      const p1 = Vector.interpolate(Vector.distance(oldControl, p0) * 2,
          oldControl, p0);
      // the third point will just be 24 inches above the end point
      const p2 = new Vector(point.x, point.y - 24);
      // the fourth point is the point passed as the function parameter
      const p3 = point;
      // update the path
      this.splines.push(new Spline(p0, p1, p2, p3));
      this.update();
    }
  
    /**
     * @brief remove a point from the path
     * @param {Number} pos the position (0 is back, 1 is front)
     */
    removePoint(pos) {
      if (this.splines.length > 1) {
        if (pos == 1) {
          this.splines.pop();
        } else if (pos == 0) {
          this.splines.shift();
        }
        this.update();
      }
    }
  
    /**
     * @brief calculate the positions of each circle
     */
    calcVisuals() {
      // remove all existing circles
      while (this.circles.length > 0) {
        this.circles[0].remove();
        this.circles.shift();
      }
      // create circles for each point on the path
      for (let i = 0; i < this.points.length; i++) {
        const color = hslToHex((this.points[i].data2/maxSpeedSlider.value)*180,
            100, 50);
        this.circles.push(new Circle(this.points[i], pointRadius,
            color, pointBorderWidth, color));
      }
  
      // remove all existing lines
      while (this.lines.length > 0) {
        this.lines[0].remove();
        this.lines.shift();
      }
      // calculate the lines
      for (let i = 0; i < this.circles.length-1; i++) {
        this.lines.push(new Line(this.circles[i].center, this.circles[i+1].center,
            lineWidth, this.circles[i].color));
      }
  
      // remove all existing control circles
      while (this.controlCircles.length > 0) {
        this.controlCircles[0].remove();
        this.controlCircles.shift();
      }
      // calculate the circles for every control point
      for (let i = 0; i < this.splines.length; i++) {
        if (i == 0) {
          this.controlCircles.push(new Circle(this.splines[i].p0,
              controlPointRadius, controlPointColor,
              controlPointBorderWidth, controlPointBorderColor));
        }
        this.controlCircles.push(new Circle(this.splines[i].p1,
            controlPointRadius, controlPointColor,
            controlPointBorderWidth, controlPointBorderColor));
        this.controlCircles.push(new Circle(this.splines[i].p2,
            controlPointRadius, controlPointColor,
            controlPointBorderWidth, controlPointBorderColor));
        this.controlCircles.push(new Circle(this.splines[i].p3,
            controlPointRadius, controlPointColor,
            controlPointBorderWidth, controlPointBorderColor));
      }
  
      // remove all existing control point lines
      while (this.controlLines.length > 0) {
        this.controlLines[0].remove();
        this.controlLines.shift();
      }
      // calculate the lines between the control points
      for (let i = 0; i < this.splines.length; i++) {
        this.controlLines.push(new Line(this.splines[i].p0, this.splines[i].p1,
            controlLineWidth, controlLineColor));
        this.controlLines.push(new Line(this.splines[i].p2, this.splines[i].p3,
            controlLineWidth, controlLineColor));
      }
    }
  
    /**
     * @brief calculate the deceleration of the robot at each point
     */
    calcDecel() {
      // apply deceleration
      this.points[this.points.length - 1].data2 = 0;
      for (let i = this.points.length-1; i > 0; i--) {
        const p0 = this.points[i];
        const p1 = this.points[i-1];
  
        const dist = Vector.distance(p0, p1);
        const vel = Math.sqrt(p0.data2**2 + 2*decelerationSlider.value*dist);
        this.points[i-1].data2 = Math.min(vel, p1.data2);
      }
    }
  
    /**
     * @brief calculate the speed at all points on the path
     */
    calcSpeed() {
      // generate velocities
      for (let i = 0; i < this.tempPoints.length-1; i++) {
        const p1 = this.tempPoints[i];
        const p2 = this.tempPoints[i+1];
  
        const dist = Vector.distance(p1, p2);
        const vel = Math.min(maxSpeedSlider.value, multiplierSlider.value*dist);
        this.tempPoints[i].data2 = vel;
  
        if (i == this.tempPoints.length - 2) {
          this.tempPoints[i+1].data2 = vel;
        }
      }
    }
  
    /**
     * @brief space out the points evenly
     * @param {Array} tempPoints - points to space out
     */
    spacePoints() {
      // calculate the distance along the path
      let curDist = 0;
      this.tempPoints[0].data = 0;
      for (let i = 1; i < this.tempPoints.length; i++) {
        const p1 = this.tempPoints[i-1];
        const p2 = this.tempPoints[i];
        const dist = Vector.distance(p1, p2);
        curDist += dist;
        this.tempPoints[i].data = curDist;
      }
  
      // calculate the number of points we need
      const numPoints = Math.floor(curDist / spacing);
      const interval = 1 / numPoints;
  
      // map T onto t
      for (let T = 0; T < 1; T += interval) {
        const u = T * this.tempPoints[this.tempPoints.length-1].data;
        // find the index of the point with the largest distance less than u
        let closestIndex = 0;
        for (let i = 0; i < this.tempPoints.length; i++) {
          if (this.tempPoints[i].data <= u) {
            closestIndex = i;
          }
        }
  
        // if we have an exact match, just use that point
        if (this.tempPoints[closestIndex].data == u) {
          this.points.push(this.tempPoints[closestIndex]);
        } else { // otherwise, interpolate
          const p1 = this.tempPoints[closestIndex];
          const p2 = this.tempPoints[closestIndex+1];
          const t = (u - p1.data) / (p2.data - p1.data);
          const x = p1.x + t*(p2.x - p1.x);
          const y = p1.y + t*(p2.y - p1.y);
          const p3 = new Vector(x, y, u);
          // calculate the speed at the new point
          const dist1 = Vector.distance(p1, p3);
          const dist2 = Vector.distance(p2, p3);
          if (dist1 < dist2) {
            p3.data2 = p1.data2;
          } else {
            p3.data2 = p2.data2;
          }
          this.points.push(p3);
        }
      }
      this.points.push(this.tempPoints[this.tempPoints.length-1]);
      // clear the temporary points
      this.tempPoints = [];
    }
  
    /**
     * @brief calculate the points on the path
     */
    calcPoints() {
      // calculate all the points with all the line segments
      this.tempPoints = [];
      for (let i = 0; i < this.splines.length; i++) {
        this.splines[i].genPoints();
        // unless the spline is the last one, remove the last point
        if (i != this.splines.length-1) {
          this.splines[i].points.pop();
        }
        this.tempPoints = this.tempPoints.concat(this.splines[i].points);
        // get rid of the points after we are done with them
        this.splines[i].points = [];
      }
  
      // calculate how far along the path each point is
      let curDistance = 0;
      for (let i = 0; i < this.tempPoints.length; i++) {
        if (i == 0) {
          this.tempPoints[i].data = 0;
        } else {
          const dist = Vector.distance(this.tempPoints[i], this.tempPoints[i-1]);
          curDistance += dist;
          this.tempPoints[i].data = curDistance;
        }
      }
    }
  
    /**
     * @brief update the path
     */
    update() {
      // clear the highlight
      clearHighlight();
      // clear the points
      this.points = [];
      // calculate the points
      this.calcPoints();
      // calculate the speed of each point
      this.calcSpeed();
      // space out the points
      this.spacePoints();
      // calculate the deceleration of each point
      this.calcDecel();
      // calculate the visuals
      this.calcVisuals();
    }
  
    /**
     * @brief set the path visibility
     * @param {Bool} visible - whether the path is visible
     */
    setVisible(visible) {
      this.visible = visible;
      // circles
      for (let i = 0; i < this.circles.length; i++) {
        this.circles[i].visible = visible;
      }
      // lines
      for (let i = 0; i < this.lines.length; i++) {
        this.lines[i].visible = visible;
      }
      // control circles
      for (let i = 0; i < this.controlCircles.length; i++) {
        this.controlCircles[i].visible = visible;
      }
      // control lines
      for (let i = 0; i < this.controlLines.length; i++) {
        this.controlLines[i].visible = visible;
      }
    }
  };
  
////////////////////////////////////////////
// Events.js
////////////////////////////////////////////

const canvasQuery = document.querySelector('canvas');
const highlightRect = new Rectangle(new Vector(0, 0),
    new Vector(0, 0), 'rgba(51, 51, 51, 0.705)');


/**
 * @brief function that returns the position of the mouse on the field
 * @param {Event} event - the event that is triggered (mouse click)
 * @return {Point} - the position of the mouse
 */
function getCursorPosition(event) {
  const rect = canvasQuery.getBoundingClientRect();
  const mousePoint = pxToCoord(new Vector(event.clientX - rect.left,
      event.clientY - rect.top));
  return mousePoint;
};


/**
 * @brief event fired when the mouse is left clicked
 * @param {Event} event - event object
 */
function leftClick(event) {
  if (mode == 0) { // if in create mode
    // clear highlighted points
    clearHighlight();
    const mouse = getCursorPosition(event);
    // check if the mouse hit any of the control points
    let foundPoint = false;
    for (let i = 0; i < path.splines.length; i++) {
      const p0 = path.splines[i].p0;
      const p1 = path.splines[i].p1;
      const p2 = path.splines[i].p2;
      const p3 = path.splines[i].p3;
      if (Vector.distance(mouse, p0) < 5) { // p0 hit
        path.splines[i].p0.data = 1;
        foundPoint = true;
        break;
      } else if (Vector.distance(mouse, p1) < 5) { // p1 hit
        path.splines[i].p1.data = 1;
        foundPoint = true;
        break;
      } else if (Vector.distance(mouse, p2) < 5) { // p2 hit
        path.splines[i].p2.data = 1;
        foundPoint = true;
        break;
      } else if (Vector.distance(mouse, p3) < 5) { // p3 hit
        path.splines[i].p3.data = 1;
        foundPoint = true;
        break;
      }
    }

    // if no point was clicked on, add a new point to the spline
    if (foundPoint == false) {
      path.addPoint(getCursorPosition(event));
    }
  }
}


/**
 * @brief event fired when the mouse is right clicked
 * @param {Event} event - event object
 */
function rightClick(event) {
  if (mode == 0) { // if in create mode
    // clear highlightList
    clearHighlight();
    const mouse = getCursorPosition(event);
    const start = path.splines[0].p0;
    const end = path.splines[path.splines.length-1].p3;
    // if the mouse clicked on the path starting point, remove it
    if (Vector.distance(mouse, start) < 5) {
      path.removePoint(0);
    } else if (Vector.distance(mouse, end) < 5) {
      path.removePoint(1);
    }
  }
}


/**
 * @brief event fired when the mouse is dragged while left clicking
 * @param {Event} event - event object
 * @param {Vector} start - where the mouse started to drag
 */
function leftDrag(event, start) {
  if (mode == 0) { // create mode
    const mouse = getCursorPosition(event);
    // update control point locations if they are being dragged
    for (let i = 0; i < path.splines.length; i++) {
      if (path.splines[i].p0.data == 1) { // p0 needs to be dragged
        const dx = mouse.x - path.splines[i].p0.x;
        const dy = mouse.y - path.splines[i].p0.y;
        path.splines[i].p0 = new Vector(mouse.x, mouse.y, 1);
        path.splines[i].p1.x += dx;
        path.splines[i].p1.y += dy;
        // move the end point of the previous spline if it exists
        if (i > 0) {
          path.splines[i-1].p2.x += dx;
          path.splines[i-1].p2.y += dy;
          path.splines[i-1].p3 = new Vector(mouse.x, mouse.y, 0);
        }
        path.update();
        break;
      } else if (path.splines[i].p1.data == 1) { // p1 needs to be dragged
        path.splines[i].p1 = new Vector(mouse.x, mouse.y, 1);
        // move the second control point on the previous spline if it exists
        if (i > 0) {
          const dist = Vector.distance(path.splines[i].p1, path.splines[i].p0);
          path.splines[i-1].p2 = Vector.interpolate(dist*2, path.splines[i].p1,
              path.splines[i].p0);
        }
        path.update();
        break;
      } else if (path.splines[i].p2.data == 1) { // p2 needs to be dragged
        path.splines[i].p2 = new Vector(mouse.x, mouse.y, 1);
        // move the first control point on the next spline if it exists
        if (i < path.splines.length-1) {
          const dist = Vector.distance(path.splines[i].p2, path.splines[i].p3);
          path.splines[i+1].p1 = Vector.interpolate(dist*2, path.splines[i].p2,
              path.splines[i].p3);
        }
        path.update();
        break;
      } else if (path.splines[i].p3.data == 1) { // p3 needs to be dragged
        const dx = mouse.x - path.splines[i].p3.x;
        const dy = mouse.y - path.splines[i].p3.y;
        path.splines[i].p3 = new Vector(mouse.x, mouse.y, 1);
        path.splines[i].p2.x += dx;
        path.splines[i].p2.y += dy;
        // move the starting point on the next spline, if it exists
        if (i < path.splines.length-1) {
          path.splines[i+1].p0 = new Vector(mouse.x, mouse.y, 0);
          path.splines[i+1].p1.x += dx;
          path.splines[i+1].p1.y += dy;
        }
        path.update();
        break;
      }
    }
  }
}


/**
 * @brief event fired when the mouse is dragged while right clicking
 * @param {Event} event - event object
 * @param {Vector} start - where the mouse started to drag
 */
function rightDrag(event, start) {
  if (mode == 0) {
    highlightRect.start = start;
    highlightRect.end = getCursorPosition(event);
    clearHighlight();
    // add all the highlighted points to the list
    for (let i = 0; i < path.circles.length; i++) {
      if (highlightRect.contains(path.circles[i])) {
        highlightList.push(i);
      }
    }
    for (let i = 0; i < highlightList.length; i++) {
      highlightCircles.push(new Circle(path.points[highlightList[i]],
          1, 'rgba(51, 51, 51, 0)', 1, 'rgba(51, 51, 51, 0.705)'));
    }
  }
}


// mouse position text
const mouseLabel = new SimpleText(new Vector(-70, -70), '0, 0',
    'black', 4, 'Arial');

/**
 * @brief event fired when the mouse is moved
 * @param {Event} event - event object
 */
function mouseMove(event) {
  const mousePoint = getCursorPosition(event);
  mouseLabel.text = Math.round(mousePoint.x) + ', ' + Math.round(mousePoint.y);
}


/**
 * @brief event fired when the mouse is released after left clicking
 * @param {Event} event - event object
 */
function leftRelease(event) {
  if (mode == 0) { // if in create mode
    // set all control points to not dragging
    for (let i = 0; i < path.splines.length; i++) {
      path.splines[i].p0.data = 0;
      path.splines[i].p1.data = 0;
      path.splines[i].p2.data = 0;
      path.splines[i].p3.data = 0;
    }
  }
}


/**
 * @brief event fired when the mouse is released after right clicking
 * @param {Event} event - event object
 */
function rightRelease(event) {
  // if in create mode
  if (mode == 0) {
    // reset highlight square
    highlightRect.start = new Vector(0, 0);
    highlightRect.end = new Vector(0, 0);

    // make a "textbox" appear if the highlight list is not empty
    if (highlightList.length > 0) {
      const mouse = getCursorPosition(event);
      const start = new Vector(mouse.x+5, mouse.y+10);
      const end = new Vector(start.x+15, start.y-10);
      newSpeedBox.start = start;
      newSpeedBox.end = end;
      newSpeedText.position = new Vector(start.x, start.y - 8);
      newSpeedText.text = '100';
    }
  }
}


/**
 * @brief event triggered whenever a keyboard button is pressed
 * @param {Event} event - event object
 */
document.onkeydown = function(event) {
  // decide what to do based on the key pressed
  if (event.key == 'Backspace') {
    if (highlightList.length > 0) {
      if (newSpeedText.text != '') {
        newSpeedText.text =
          newSpeedText.text.substr(0, newSpeedText.text.length - 1);
      }
    }
  } else if (event.key == 'Enter') {
    if (highlightList.length > 0) {
      // change the points on the path
      for (let i = 0; i < highlightList.length; i++) {
        path.points[highlightList[i]].data2 *=
            (parseFloat(newSpeedText.text))/100;
      }
      // semi-update the path and clear the highlight
      path.calcDecel();
      path.calcVisuals();
      clearHighlight();
    }
  } else {
    if (highlightList.length > 0) {
      newSpeedText.text += event.key;
    }
  }
};


const downloadPath = document.getElementById('downloadPathBtn');
/**
 * @brief event fired when the download path button is clicked
 */
downloadPath.onclick = function() {
  // mega string
  let out = '';

  // log path points
  for (let i = 0; i < path.points.length; i++) {
    const x = path.points[i].x;
    const y = path.points[i].y;
    const velocity = path.points[i].data2;
    out += x + ', ' + y + ', ' + velocity + '\n';
  }
  // create a "ghost point" at the end of the path to make stopping nicer
  const lastPoint = path.points[path.points.length-1];
  const lastControl = path.splines[path.splines.length-1].p2;
  const ghostPoint = Vector.interpolate(
      Vector.distance(lastControl, lastPoint) + 20, lastControl, lastPoint);
  out += ghostPoint.x + ', ' + ghostPoint.y + ', 0\n';
  out += 'endData\n';

  // log data the generator uses
  // output slider values
  out += decelerationSlider.value + '\n';
  out += maxSpeedSlider.value + '\n';
  out += multiplierSlider.value + '\n';

  // output path spline control points
  for (let i = 0; i < path.splines.length; i++) {
    const p0 = path.splines[i].p0;
    const p1 = path.splines[i].p1;
    const p2 = path.splines[i].p2;
    const p3 = path.splines[i].p3;
    out += p0.x + ', ' + p0.y + ', ' + p1.x + ', ' + p1.y + ', ' +
        p2.x + ', ' + p2.y + ', ' + p3.x + ', ' + p3.y + '\n';
  }

  // download file
  const blob = new Blob([out], {type: 'text/csv'});
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(out, 'path.txt');
  }
  const elem = window.document.createElement('a');
  elem.href = window.URL.createObjectURL(blob);
  elem.download = 'path.txt';
  document.body.appendChild(elem);
  elem.click();
  document.body.removeChild(elem);
};


const uploadPath = document.getElementById('uploadPathBtn');
/**
 * @brief event fired when the upload path button is clicked
 */
uploadPath.onchange = function() {
  // get the file
  const file = uploadPath.files[0];

  const reader = new FileReader();
  let data = '';

  // event fired when file reading finished
  reader.onload=function() {
    data = reader.result;
    // split the data into lines
    const lines = data.split('\n');

    // find the line where the path data starts
    let i = 0;
    while (lines[i] != 'endData') {
      i++;
    }

    // get the slider values
    decelerationSlider.value = parseFloat(lines[i+1]);
    maxSpeedSlider.value = parseFloat(lines[i+2]);
    multiplierSlider.value = parseFloat(lines[i+3]);
    // update their text values
    decelerationText.innerHTML = decelerationSlider.value;
    maxSpeedText.innerHTML = maxSpeedSlider.value;
    multiplierText.innerHTML = multiplierSlider.value;

    i += 4;

    // read splines
    path.splines = [];
    while (i < lines.length-1) {
      // read spline
      const line = lines[i].split(', ');
      const p1 = new Vector(parseFloat(line[0]), parseFloat(line[1]));
      const p2 = new Vector(parseFloat(line[2]), parseFloat(line[3]));
      const p3 = new Vector(parseFloat(line[4]), parseFloat(line[5]));
      const p4 = new Vector(parseFloat(line[6]), parseFloat(line[7]));
      const spline = new Spline(p1, p2, p3, p4);
      path.splines.push(spline);
      i++;
    }

    // update the path
    path.update();
  };
  reader.readAsText(this.files[0]);
  // remove the file from the input
  uploadPath.value = '';
};


const modeBtn = document.getElementById('modeBtn');
/**
 * @brief event fired when the mode button is clicked
 */
modeBtn.onclick = function() {
  // get necessary html elements
  const createList = document.getElementsByClassName('sliderContainer');
  const debugList = document.getElementsByClassName('debugContainer');
  // set the program mode
  // 0: create; 1: debug
  switch (mode) {
    case 0:
      // set mode to debug
      mode = 1;
      path.setVisible(false);
      // make create elements invisible
      for (let i = 0; i < createList.length; i++) {
        createList[i].style.display='none';
      }
      // make debug elements visible
      for (let i = 0; i < debugList.length; i++) {
        debugList[i].style.display='flex';
      }
      break;
    case 1:
      // set mode to create
      mode = 0;
      path.setVisible(true);
      // make create elements visible
      for (let i = 0; i < createList.length; i++) {
        createList[i].style.display='flex';
      }
      // make debug elements invisible
      for (let i = 0; i < debugList.length; i++) {
        debugList[i].style.display='none';
      }
      break;
  }
};


/**
 * @brief fired when the deceleration slider is changed
 */
decelerationSlider.onchange = function() {
  path.update();
};


/**
 * @brief fired when the maximum speed slider is changed
 */
maxSpeedSlider.onchange = function() {
  path.update();
};


/**
 * @brief fired when the turn multiplier slider is changed
 */
multiplierSlider.onchange = function() {
  path.update();
};


/**
 * Code below this point should not have to be changed
 * Its purpose is to set up the event listeners
 * and call the functions above
 */


// dragging variables
let leftDown = false;
let rightDown = false;
let leftDownStart = new Vector(0, 0);
let rightDownStart = new Vector(0, 0);


/**
 * @brief event fired when the mouse is clicked
 * @param {Event} event - event object
 */
canvasQuery.onmousedown = function(event) {
  if (event.button === 0) {
    leftClick(event);
    leftDown = true;
    leftDownStart = getCursorPosition(event);
  } else if (event.button === 2) {
    rightClick(event);
    rightDown = true;
    rightDownStart = getCursorPosition(event);
  }
};


/**
 * @brief event fired when the mouse is moved
 * @param {Event} event - event object
 */
canvasQuery.onmouseup = function(event) {
  if (leftDown) {
    leftRelease(event);
  }
  if (rightDown) {
    rightRelease(event);
  }
  leftDown = false;
  rightDown = false;
};


/**
 * @brief event fired when the mouse is moved
 * @param {Event} event - event object
 */
canvasQuery.onmousemove = function(event) {
  if (leftDown) {
    leftDrag(event, leftDownStart);
  }
  if (rightDown) {
    rightDrag(event, rightDownStart);
  }
  mouseMove(event);
};

///////////////////////////////
// Main.js
///////////////////////////////

/**
 * @brief initialization
 */
window.onload = function() {
    // create a starting path
    let p0 = new Vector(-32.3, -6.3);
    let p1 = new Vector(-41, 49);
    let p2 = new Vector(-42, 52);
    let p3 = new Vector(5.2, 6.12);
    path = new Path(new Spline(p0, p1, p2, p3));
    // start rendering
    setInterval(render, 1000/fps);
  };