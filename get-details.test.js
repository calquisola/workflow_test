const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const sinon = require('sinon');
const core = require('@actions/core');
const github = require('@actions/github');
const { getImageDetails } = require('./get-details');

const repoOwner = 'test-owner'
const repoName = 'test-repo'

beforeEach(() => {
  sinon.stub(github.context, 'repo').value({ owner: `${repoOwner}`, repo: `${repoName}` });
  sinon.stub(core, 'getInput').callsFake((name) => {
    switch (name) {
      case 'tag':
        return 'latest';
      case 'name':
        return 'node-base';
      default:
        return '';
    }
  });
  sinon.stub(core, 'setOutput');
  sinon.stub(core, 'setFailed');
});

afterEach(() => {
  sinon.restore();
});

test('Valid imageNameFilter "node-base" returns correct output', async () => {
  core.getInput.withArgs('name').returns('node-base');

  getImageDetails();

  const expectedOutput = {
    'context': 'node-base',
    'service-name': 'node-base',
    'is-base-image': true,
    'docker-file-path': 'node-base/Dockerfile',
    'tagged-ghcr-name': `ghcr.io/${repoOwner}/${repoName}/node-base:latest`,
    'ghcr-name': `ghcr.io/${repoOwner}/${repoName}/node-base`,
    'path-dependencies': 'node-base/Dockerfile',
    'base-image': ''
  };

  assert.ok(core.setOutput.calledWith('image-details', JSON.stringify(expectedOutput)));
});

test('Valid imageNameFilter for "backend" service returns correct output', async () => {
  core.getInput.withArgs('name').returns('backend');
  core.getInput.withArgs('tag').returns('latest');

  getImageDetails();

  const expectedOutput = {
    'named-dockerfile': true,
    'path-dependencies': './Dockerfile.backend,app-config.yaml,catalog-entities.yaml,provider-dashboard.config.yaml,certs,package.json,packages/backend,plugins,yarn.lock,node-base/Dockerfile',
    'service-name': 'backend',
    'node-base': true,
    'context': '.',
    'docker-file-path': './Dockerfile.backend',
    'tagged-ghcr-name': `ghcr.io/${repoOwner}/${repoName}/backend:latest`,
    'ghcr-name': `ghcr.io/${repoOwner}/${repoName}/backend`,
    'base-image': `ghcr.io/${repoOwner}/${repoName}/node-base:latest`
  };


  assert.ok(core.setOutput.calledWith('image-details', JSON.stringify(expectedOutput)));
});

test('Valid imageNameFilter for "frontend" service returns correct output', async () => {
  core.getInput.withArgs('name').returns('frontend');
  core.getInput.withArgs('tag').returns('latest');

  getImageDetails();

  const expectedOutput = {
    'named-dockerfile': true,
    'path-dependencies': "./Dockerfile.frontend,app-config.yaml,package.json,packages/app,plugins,yarn.lock,node-base/Dockerfile",
    'service-name': "frontend",
    'node-base': true,
    'context': ".",
    'docker-file-path': "./Dockerfile.frontend",
    'tagged-ghcr-name': `ghcr.io/${repoOwner}/${repoName}/frontend:latest`,
    'ghcr-name': `ghcr.io/${repoOwner}/${repoName}/frontend`,
    'base-image': `ghcr.io/${repoOwner}/${repoName}/node-base:latest`
  };

  assert.ok(core.setOutput.calledWith('image-details', JSON.stringify(expectedOutput)));
});

test('Valid imageNameFilter for "postgres" service returns correct output', async () => {
  core.getInput.withArgs('name').returns('postgres');
  core.getInput.withArgs('tag').returns('latest');

  getImageDetails();

  const expectedOutput = {
    'context': 'postgres',
    'service-name': 'postgres',
    'node-base': false,
    'docker-file-path': 'postgres/Dockerfile',
    'tagged-ghcr-name': `ghcr.io/${repoOwner}/${repoName}/postgres:latest`,
    'ghcr-name': `ghcr.io/${repoOwner}/${repoName}/postgres`,
    'path-dependencies': 'postgres/Dockerfile',
    'base-image': ''
  };

  assert.ok(core.setOutput.calledWith('image-details', JSON.stringify(expectedOutput)));
});

test('Valid imageNameFilter for "memcached" service returns correct output', async () => {
  core.getInput.withArgs('name').returns('memcached');
  core.getInput.withArgs('tag').returns('latest');

  getImageDetails();

  const expectedOutput = {
    'context': 'memcached',
    'service-name': 'memcached',
    'node-base': false,
    'docker-file-path': 'memcached/Dockerfile',
    'tagged-ghcr-name': `ghcr.io/${repoOwner}/${repoName}/memcached:latest`,
    'ghcr-name': `ghcr.io/${repoOwner}/${repoName}/memcached`,
    'path-dependencies': 'memcached/Dockerfile',
    'base-image': ''
  };

  assert.ok(core.setOutput.calledWith('image-details', JSON.stringify(expectedOutput)));
});

test('Invalid imageNameFilter throws an error', async () => {
  core.getInput.withArgs('name').returns('backstage');

  getImageDetails();

  assert.ok(core.setFailed.calledWith('backstage is an invalid image name'));
});