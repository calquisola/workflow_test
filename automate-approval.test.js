const assert = require('node:assert');
const core = require('@actions/core');
const github = require('@actions/github');
const sinon = require('sinon');
const test = require('node:test');

const { automateApproval } = require('./automate-approval');

// This is the successful deployment response as before
const deploymentResponse = {
  status: 200,
  data: [
    {
      environment: {
        id: 100,
        node_id: 'foob',
        name: 'Prod',
        url: 'url.com',
      },
      wait_timer: 0,
    },
  ],
};

// Error response for when no pending deployments are found
const errorResponse = {
  status: 422,
  data: {
    message: 'Validation Failed',
    errors: 'No pending deployment requests to approve or reject',
    documentation_url: 'https://docs.github.com/rest/actions/workflow-runs#review-pending-deployments-for-a-workflow-run'
  },
};

const setup = (shouldError = false) => {
  const spies = {
    console: { log: sinon.spy(console, 'log'), error: sinon.spy(console, 'error') },
    core: { setOutput: sinon.spy(core, 'setOutput') },
  };

  const stubs = {
    core: { getInput: sinon.stub(core, 'getInput') },
    github: {
      context: sinon.stub(github, 'context'),
      getOctokit: sinon.stub(github, 'getOctokit'),
    },
  };

  stubs.core.getInput.withArgs('github-token').returns('A-TOKEN');
  stubs.core.getInput.withArgs('run-id').returns('100');
  stubs.github.context.value({
    repo: { owner: 'foo-owner', repo: 'bar-repo' },
  });

  const octokitStub = {
    rest: {
      actions: {
        getPendingDeploymentsForRun: sinon.stub().returns(deploymentResponse),
        reviewPendingDeploymentsForRun: shouldError ? sinon.stub().rejects(errorResponse) : sinon.stub(),
      },
    },
  };

  stubs.github.getOctokit.returns(octokitStub);

  return { spies };
};

test('Approve Deployment - Success Case', async () => {
  const { spies } = setup();

  await automateApproval();
  assert(spies.core.setOutput.calledWith('approved', true));
  assert(spies.console.log.calledWith('Approved:', true));

  cleanup(spies);
});

test('Approve Deployment - Error Case', async () => {
  const { spies } = setup(true);

  await automateApproval();
  assert(spies.core.setOutput.calledWith('Validation Failed'));
  assert(spies.console.error.calledWithMatch(/Validation Failed/));

  cleanup(spies);
});

const cleanup = (spies) => {
  spies.console.log.restore();
  spies.console.error.restore();
  spies.core.setOutput.restore();
  sinon.restore();
};
