const assert = require('node:assert');
const core = require('@actions/core');
const github = require('@actions/github');
const sinon = require('sinon');
const test = require('node:test');
const { listDockerImages } = require('./list-docker-images');

const setup = () => {
  const spies = {
    console: { log: sinon.spy(console, 'log') },
    core: { setOutput: sinon.spy(core, 'setOutput') },
  };
  const stubs = {
    core: { getInput: sinon.stub(core, 'getInput') },
    github: { context: sinon.stub(github, 'context') },
  };

  stubs.core.getInput.withArgs('tag').returns('one/two/three');
  stubs.core.getInput.withArgs('include-base-image').returns('false');
  stubs.github.context.value({
    repo: { owner: 'foo-owner', repo: 'bar-repo' },
  });

  return { spies };
};

const assertions = args => {
  assert(
    args.spies.core.setOutput.calledWith('matrix', JSON.stringify(args.matrix)),
  );
  assert(
    args.spies.console.log.calledWith(
      'Output:',
      JSON.stringify(args.matrix, null, 2),
    ),
  );
};

const cleanup = spies => {
  spies.console.log.restore();
  spies.core.setOutput.restore();
  sinon.restore();
};

test('Get images matrix', () => {
  const { spies } = setup();

  listDockerImages();

  assertions({
    spies,
    matrix: [
      {
        'named-dockerfile': true,
        'path-dependencies':
          './Dockerfile.backend,app-config.yaml,catalog-entities.yaml,provider-dashboard.config.yaml,certs,package.json,packages/backend,plugins,yarn.lock',
        'service-name': 'backend',
        context: '.',
        'docker-file-path': './Dockerfile.backend',
        'tagged-ghcr-name': 'ghcr.io/foo-owner/bar-repo/backend:one-two-three',
        'ghcr-name': 'ghcr.io/foo-owner/bar-repo/backend',
      },
      {
        'named-dockerfile': true,
        'path-dependencies':
          './Dockerfile.frontend,app-config.yaml,package.json,packages/app,plugins,yarn.lock',
        'service-name': 'frontend',
        context: '.',
        'docker-file-path': './Dockerfile.frontend',
        'tagged-ghcr-name': 'ghcr.io/foo-owner/bar-repo/frontend:one-two-three',
        'ghcr-name': 'ghcr.io/foo-owner/bar-repo/frontend',
      },
      {
        context: 'memcached',
        'service-name': 'memcached',
        'docker-file-path': 'memcached/Dockerfile',
        'tagged-ghcr-name':
          'ghcr.io/foo-owner/bar-repo/memcached:one-two-three',
        'ghcr-name': 'ghcr.io/foo-owner/bar-repo/memcached',
        'path-dependencies': 'memcached/Dockerfile',
      },
      {
        context: 'postgres',
        'service-name': 'postgres',
        'docker-file-path': 'postgres/Dockerfile',
        'tagged-ghcr-name': 'ghcr.io/foo-owner/bar-repo/postgres:one-two-three',
        'ghcr-name': 'ghcr.io/foo-owner/bar-repo/postgres',
        'path-dependencies': 'postgres/Dockerfile',
      }
    ],
  });

  cleanup(spies);
});
