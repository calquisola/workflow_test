const core = require('@actions/core');
const github = require('@actions/github');
const images = require('../../../docker-images.json');

const getImageDetails = () => {
  try {
    const { owner, repo } = github.context.repo;
    const tag = core.getInput('tag').replace(/\//g, '-');
    const imageNameFilter = core.getInput('name');
    const foundImage = images.find(
      img => img['service-name'] === imageNameFilter,
    );

    if (!foundImage) {
      throw new Error(`${imageNameFilter} is an invalid image name`);
    }

    // get the base node image
    const baseImage = images.find(
      img => img['is-base-image']
    )

    const baseNodeImage = `ghcr.io/${owner}/${repo}/${baseImage['service-name']}:${tag}`;

    const imageName = foundImage['service-name'];
    const context = foundImage['context'] ?? '.';
    const dockerfilePath = `${context}/Dockerfile${foundImage['named-dockerfile'] ? '.' + imageName : ''}`;
    // Store file path dependencies as a comma-separated string
    const dependencies = [
      dockerfilePath,
      ...(foundImage['path-dependencies'] ?? []),
    ].join();
    const ghcrName = `ghcr.io/${owner}/${repo}/${imageName}`;

    // remove is-base-image property in the result
    const { 'is-base-image': _, ...restFoundImage } = foundImage;

    const matrix = {
      ...restFoundImage,
      context,
      'docker-file-path': dockerfilePath,
      'tagged-ghcr-name': `${ghcrName}:${tag}`,
      'ghcr-name': ghcrName,
      'path-dependencies': dependencies,
      'base-image':
        (['backend', 'frontend'].includes(imageName) && baseNodeImage) || '',
    };

    core.setOutput('matrix', JSON.stringify(matrix));
    console.log('Output:', JSON.stringify(matrix, null, 2));
  } catch (error) {
    core.setFailed(error.message);
    console.error(error);
  }
};

module.exports = { getImageDetails };
