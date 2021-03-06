/**
 * Module dependencies
 */

var within_document = require('within-document')
var classes = require('component-classes')
var events = require('component-events')
var assign = require('object-assign')
var inserted = require('inserted')
var style = require('load-styles')
var adjust = require('adjust')()
var domify = require('domify')
var sliced = require('sliced')

/**
 * Defaults
 */

var defaults = {
  orientation: 'bottom center',
  delay: 300
}

/**
 * Default orientations
 */

var orientations = {
  'bottom right': { x: -20, y: 7 },
  'top right': { x: -20, y: -7 },
  'bottom left': { x: 20, y: 7 },
  'top left': { x: 20, y: -7 },
  'bottom': { x: 0, y: 7 },
  'left': { x: -7, y: 0 },
  'right': { x: 7, y: 0 },
  'top': { x: 0, y: -7 }
}

/**
 * Export `tipp`
 */

module.exports = tipp

/**
 * Template
 */

var template = domify(require('./tipp.html'))

/**
 * Insert tipp styling
 */

style(require('./tipp.css'))

/**
 * Initialize a tipp
 *
 * @param {Element} el
 * @param {String} message
 * @param {Object} options
 * @return {Tipp|Array}
 */

function tipp(el, message, options) {
  if (!arguments.length || typeof el === 'string') {
    var els = sliced(document.querySelectorAll(el || '[tipp]'));
    return els.map(function(el) {
      var msg = message || el.getAttribute('tipp')
      var offset = undefined

      if (el.hasAttribute('tipp-offset')) {
        var op = el.getAttribute('tipp-offset').split(/\s+/)
        offset = { x: Number(op[0]), y: Number(op[1]) }
      }

      return new Tipp(el, msg, {
        orientation: el.getAttribute('tipp-orientation'),
        class: el.getAttribute('tipp-class'),
        offset: offset
      })
    })
  } else {
    return new Tipp(el, message, options)
  }
}

/**
 * Initialize a `Tipp` with the given `content`.
 *
 * @param {Element} el
 * @param {Mixed} message
 * @param {Object} options
 * @api public
 */

function Tipp(el, message, options) {
  if (!(this instanceof Tipp)) return new Tipp(el, message, options)
  options = options || {}

  if (typeof message === 'object') {
    options = message
    message = null
  }

  this.options = assign(defaults, options)
  this.options.offset = options.offset === undefined
    ? orientations[this.options.orientation]
    : options.offset

  this.host = el
  this.container = template.cloneNode(true)
  this.el = this.container.querySelector('.tipp')
  this.inner = this.el.querySelector('.tipp-body')
  this.container_classes = classes(this.container)
  this.classes = classes(this.el)

  if (this.options.class) {
    this.options.class.split(/\s+/).map(function(cls) {
      this.classes.add(cls)
    }, this)
  }

  // add the message
  message = message || el.getAttribute('title')
  if (!message) throw new Error('tipp doesn\'t have any content')
  this.message(message)

  // bind if already in the DOM
  // otherwise wait until it's inserted
  if (within_document(el)) {
    this.bind()
  } else {
    inserted(el, this.bind.bind(this))
  }
}

/**
 * Bind the events
 *
 * @return {Tipp}
 */

Tipp.prototype.bind = function () {
  document.body.appendChild(this.container)

  this.events = events(this.host, this)
  this.events.bind('mouseenter', 'show')
  this.events.bind('mouseleave', 'maybeHide')

  this.tip_events = events(this.container, this)
  this.tip_events.bind('mouseenter', 'cancelHide')
  this.tip_events.bind('mouseleave', 'maybeHide')

  // setup the adjustments
  this.orientation()

  return this
}

/**
 * Set tip `content`.
 *
 * @param {String|Element} content
 * @return {Tipp} self
 * @api public
 */

Tipp.prototype.message = function(content){
  if ('string' == typeof content) content = domify(content)
  this.inner.appendChild(content)
  return this
}

/**
 * Maybe hide
 *
 * @return {Tipp}
 */

Tipp.prototype.maybeHide = function() {
  var self = this
  var delay = this.options.delay

  this.hiding = true

  setTimeout(function() {
    self.hiding && self.hide()
  }, delay)

  return this
}

/**
 * Hide the tipp
 *
 * @return {Tipp}
 */

Tipp.prototype.hide = function() {
  this.container_classes.add('tipp-hide')
  this.classes.add('tipp-hide')
  return this
}

/**
 * Cancel the hiding
 *
 * @return {Tipp}
 */

Tipp.prototype.cancelHide = function() {
  this.hiding = false
  return this
}

/**
 * Show a tipp
 *
 * @return {Tipp}
 */

Tipp.prototype.show = function() {
  this.container_classes.remove('tipp-hide')
  this.classes.remove('tipp-hide')
  this.hiding = false
  return this
}

/**
 * Set the orientation
 *
 * @return {Tipp}
 */

Tipp.prototype.orientation = function() {
  this.adjust = adjust(this.container, this.host, {
    target: this.options.orientation,
    offset: this.options.offset
  })

  return this
};
