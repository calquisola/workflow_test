const core = require('@actions/core');
const github = require('@actions/github');

const automateApproval = async () => {
  try {
    // Required setup
    const octokit = github.getOctokit(
      core.getInput('github-token', { required: true }),
    );
    const { owner, repo } = github.context.repo;
    // Get workflows to approve from action input
    const run_id = core.getInput('run-id', { required: false });

    // Grab environment ids for pending deployments
    const environment_ids = (
      await octokit.rest.actions.getPendingDeploymentsForRun({
        owner,
        repo,
        run_id,
      })
    ).data.map(d => d.environment.id);

    const approved = environment_ids.length;
    // If any deployments are found, approve them
    if (approved) {
      await octokit.rest.actions.reviewPendingDeploymentsForRun({
        owner,
        repo,
        run_id,
        environment_ids,
        state: 'approved',
        comment: 'Automated Approval',
      });
    }
    core.setOutput('approved', !!approved);
    console.log('Approved:', !!approved);
  } catch (error) {
    core.setOutput(error.message);
    console.error(error);
  }
};

module.exports = { automateApproval };
