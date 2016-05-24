'use strict';

var Analytics = require('analytics.js-core').constructor;
var integration = require('analytics.js-integration');
var sandbox = require('clear-env');
var tester = require('analytics.js-integration-tester');
var Pendo = require('../lib/');
var _ = require('underscore');

// var noop = function() {};

describe('Pendo', function() {
  var analytics;
  var pendo;
  var options = {
    apiKey: 'an-id-to-test-with'
  };

  beforeEach(function() {
    analytics = new Analytics();
    pendo = new Pendo(options);

    analytics.use(Pendo);
    analytics.use(tester);
    analytics.add(pendo);
    analytics.user();
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    pendo.reset();
    analytics.user().reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Pendo,
      integration('Pendo')
        .global('pendo')
        .option('apiKey', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.spy(pendo, 'load');
      analytics.spy(pendo, 'ready');
    });

    afterEach(function() {
      pendo.reset();
    });

    describe('#initialize', function() {
      it('should create window.pendo_options', function() {
        analytics.assert(!window.pendo_options);
        analytics.initialize();
        analytics.assert(window.pendo_options);
        analytics.assert(window.pendo);
      });

      it('should create a pendo_options object using API', function() {
        analytics.assert.deepEqual(window.pendo_options, { apiKey: options.apiKey, usePendoAgentAPI: true });
      });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.spy(window.pendo, 'identify');
      });

      it('should identify with the anonymous user id', function() {
        analytics.identify();
        analytics.called(window.pendo.identify);
        analytics.assert(window.pendo.getVisitorId().indexOf('_PENDO_T_') !== -1);
      });

      it('should identify with the given id', function() {
        analytics.identify('id');
        analytics.called(window.pendo.identify);
        analytics.equal(window.pendo.getVisitorId(), 'id');
      });

      it('should send traits', function() {
        analytics.identify({ trait: true });
        analytics.called(window.pendo.identify);
        analytics.called(window.pendo.identify);
      });

      it('should send the given id and traits', function() {
        analytics.identify('id', { trait: 'goog' });
        analytics.called(window.pendo.identify);
        analytics.assert(window.pendo_options.visitor.trait === 'goog');
        analytics.equal(window.pendo.getVisitorId(), 'id');
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.spy(window.pendo, 'identify');
      });

      it('should send an id', function() {
        analytics.group('id');
        analytics.called(window.pendo.identify);
        analytics.equal(window.pendo.getAccountId(), 'id');
      });
      it('should send traits', function() {
        analytics.group({ trait: 'goog' });
        analytics.called(window.pendo.identify);
        analytics.assert(window.pendo_options.account.trait === 'goog');
      });

      it('should send an id and traits', function() {
        analytics.group('id', { trait: 'goog' });
        analytics.called(window.pendo.identify);
        analytics.assert(window.pendo_options.account.trait === 'goog');
        analytics.equal(window.pendo.getAccountId(), 'id');
      });

      it('should send an id and obj traits', function() {
        var traits = {
          sysId: 30,
          sysName: 'Mocha test',
          sysTrialStatus: 'Robot',
          sysProduct: 'unlimited',
          sysType: 'unknown'
        };
        analytics.group('id', traits);
        analytics.called(window.pendo.identify);

        _.forEach(traits, function(value, key) {
          analytics.assert(window.pendo_options.account[key] === value);
        });

        analytics.equal(window.pendo.getAccountId(), 'id');
      });
    });
  });
});
