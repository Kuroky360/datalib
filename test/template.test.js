'use strict';

var assert = require('chai').assert;
var template = require('../src/template');

describe('template', function() {

  it('should handle zero interpolants', function() {
    var f = template('hello');
    assert.equal('hello', f({}));
  });
  
  it('should handle a single interpolant', function() {
    var f = template('{{a}}');
    assert.equal('hello', f({a: 'hello'}));

    f = template('hello {{a}}');
    assert.equal('hello there', f({a: 'there'}));

    f = template('{{a}} there');
    assert.equal('hello there', f({a: 'hello'}));
  });
  
  it('should handle nested property interpolants', function() {
    var f = template('hello {{a.b}}');
    assert.equal('hello there', f({a: {b:'there'}}));
  });

  it('should handle multiple interpolants', function() {
    var f = template('hello {{a}} {{b}}');
    assert.equal('hello there friend', f({a: 'there', b: 'friend'}));
  });

  it('should handle escape characters', function() {
    var f = template('\"{{a}}\"');
    assert.equal('\"hello\"', f({a: 'hello'}));

    f = template('\'{{a}}\'');
    assert.equal('\'hello\'', f({a: 'hello'}));
  });

  it('should handle lower filter', function() {
    var f = template('hello {{a|lower}}');
    assert.equal('hello there', f({a: 'THERE'}));
  });

  it('should handle upper filter', function() {
    var f = template('hello {{a|upper}}');
    assert.equal('hello THERE', f({a: 'there'}));
  });

  it('should handle lower-locale filter', function() {
    var f = template('hello {{a|lower-locale}}');
    assert.equal('hello there', f({a: 'THERE'}));
  });

  it('should handle upper-locale filter', function() {
    var f = template('hello {{a|upper-locale}}');
    assert.equal('hello THERE', f({a: 'there'}));
  });

  it('should handle trim filter', function() {
    var f = template('hello {{a|trim}}');
    assert.equal('hello there', f({a: ' there '}));
  });

  it('should handle left filter', function() {
    var f = template('hello {{a|left:5}}');
    assert.equal('hello there', f({a: 'there---'}));
  });

  it('should handle right filter', function() {
    var f = template('hello {{a|right:5}}');
    assert.equal('hello there', f({a: '---there'}));
  });

  it('should handle mid filter', function() {
    var f = template('hello {{a|mid:3,5}}');
    assert.equal('hello there', f({a: '---there---'}));
  });

  it('should handle slice filter', function() {
    var f = template('hello {{a|slice:3}}');
    assert.equal('hello there', f({a: '---there'}));

    f = template('hello {{a|slice:-5}}');
    assert.equal('hello there', f({a: '---there'}));

    f = template('hello {{a|slice:3,8}}');
    assert.equal('hello there', f({a: '---there---'}));

    f = template('hello {{a|slice:3,-3}}');
    assert.equal('hello there', f({a: '---there---'}));
  });

  it('should handle truncate filter', function() {
    var f = template('{{a|truncate:5}}');
    assert.equal('hello', f({a: 'hello'}));

    f = template('{{a|truncate:6}}');
    assert.equal('hello…', f({a: 'hello there'}));

    f = template('{{a|truncate:6,left}}');
    assert.equal('…there', f({a: 'hello there'}));

    f = template('hello {{a|truncate:5}}');
    assert.equal('hello 1234…', f({a: 123456}));
  });

  it('should handle pad filter', function() {
    var f = template('{{a|pad:8}}');
    assert.equal('hello   ', f({a: 'hello'}));

    f = template('{{a|pad:3}}');
    assert.equal('hello', f({a: 'hello'}));

    f = template('{{a|pad:8,left}}');
    assert.equal('   hello', f({a: 'hello'}));

    f = template('{{a|pad:8,middle}}');
    assert.equal(' hello  ', f({a: 'hello'}));
    
    f = template('hello {{a|pad:8}}');
    assert.equal('hello 12345   ', f({a: 12345}));
  });

  it('should handle number filter', function() {
    var f = template('hello {{a|number:".3f"}}');
    assert.equal('hello 1.000', f({a: 1}));
    f = template("hello {{a|number:'.3f'}}");
    assert.equal('hello 1.000', f({a: 1}));
  });

  it('should handle time filter', function() {
    var f = template('the date: {{a|time:"%Y-%m-%d"}}');
    assert.equal('the date: 2011-01-01', f({a: new Date(2011, 0, 1)}));
    f = template("the date: {{a|time:'%Y-%m-%d'}}");
    assert.equal('the date: 2011-01-01', f({a: new Date(2011, 0, 1)}));
  });

  it('should throw error if format pattern is unquoted', function() {
    assert.throws(function() { template('hello {{a|number:.3f}}'); });
  });

  it('should handle multiple filters', function() {
    var f = template('{{a|lower|slice:3,-3}}');
    assert.equal('hello', f({a:'---HeLlO---'}));
    f = template('{{a|lower|slice:3,-3|length|number:".1f"}}');
    assert.equal('5.0', f({a:'---HeLlO---'}));
    f = template("{{a|lower|slice:3,-3|length|number:'.1f'}}");
    assert.equal('5.0', f({a:'---HeLlO---'}));
  });

  it('should throw error with unrecognized filter', function() {
    assert.throws(function() { template('{{a|fake}}'); });
  });

  it('should handle extraneous spaces', function() {
    var f = template('{{ a }}');
    assert.equal('hello', f({a: 'hello'}));

    f = template('{{a | lower }}');
    assert.equal('hello', f({a: 'HELLO'}));
    
    f = template('{{a | lower | mid : 3, 5 }}');
    assert.equal('hello', f({a: '---HELLO---'}));
  });

  it('should support clearing format cache', function() {
    template.clearFormatCache();
    assert.equal(0, template.context.formats.length);
    assert.isUndefined(template.context.format_map['.3f']);
    var f = template('hello {{a|number:".3f"}}');
    assert.isDefined(template.context.format_map['.3f']);
    assert.equal(1, template.context.formats.length);
    template.clearFormatCache();
    assert.equal(0, template.context.formats.length);
    assert.isUndefined(template.context.format_map['.3f']);
  });

  function source(str, obj, p) {
    return 'var __t; return ' + template.source(str, obj, p) + ';';
  }

  it('should expose source code generator', function() {
    var f = new Function(source('hello'));
    assert.equal('hello', f({}));

    f = new Function('myvar', source('{{a}}', 'myvar'));
    assert.equal('hello', f({a: 'hello'}));
  });

  it('should collected referenced variables', function() {
    var props = {};
    var f = new Function('d', source('{{a}} {{b}}', 'd', props));
    assert.equal('1 2', f({a:1, b:2, c:3, d:4}));
    assert.isDefined(props['a']);
    assert.isDefined(props['b']);
    assert.isUndefined(props['c']);
    assert.isUndefined(props['d']);
  });
});
