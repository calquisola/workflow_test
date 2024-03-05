const core = require('@actions/core');
const github = require('@actions/github');
const images = require('./docker-images.json');

const getImageDetails = () => {
  try {
    const { owner, repo } = github.context.repo;
    const tag = core.getInput('tag').replace(/\//g, '-');
    const imageNameFilter = core.getInput('name');
    const foundImage = images.find(
      img => img['service-name'] === imageNameFilter,
    );
    const baseNodeImage = `ghcr.io/${owner}/${repo}/node-base:${tag}`;

    if (!foundImage && imageNameFilter == 'node-base') {
      nodeBaseDetails = {
        context: 'node-base',
        'service-name': 'node-base',
        'docker-file-path': 'node-base/Dockerfile',
        'tagged-ghcr-name': baseNodeImage,
        'ghcr-name': `ghcr.io/${owner}/${repo}/node-base`,
        'path-dependencies': 'node-base/Dockerfile',
      };
      core.setOutput('matrix', JSON.stringify(nodeBaseDetails));
      console.log('Output:', JSON.stringify(nodeBaseDetails, null, 2));
      return;
    }

    if (!foundImage && imageNameFilter != 'node-base') {
      throw new Error(`${imageNameFilter} is an invalid image name`);
    }

    const imageName = foundImage['service-name'];
    const context = foundImage['context'] ?? '.';
    const dockerfilePath = `${context}/Dockerfile${foundImage['named-dockerfile'] ? '.' + imageName : ''}`;
    // Store file path dependencies as a comma-separated string
    const dependencies = [
      dockerfilePath,
      ...(foundImage['path-dependencies'] ?? []),
    ].join();
    const longName = `ghcr.io/${owner}/${repo}/${imageName}`;
    const matrix = {
      ...foundImage,
      context,
      'docker-file-path': dockerfilePath,
      'tagged-ghcr-name': `${longName}:${tag}`,
      'ghcr-name': longName,
      'path-dependencies': dependencies,
      'base-image':
        imageName === 'frontend' || imageName === 'backend'
          ? baseNodeImage
          : '',
    };

    core.setOutput('matrix', JSON.stringify(matrix));
    console.log('Output:', JSON.stringify(matrix, null, 2));
  } catch (error) {
    core.setFailed(error.message);
    console.error(error);
  }
};

module.exports = { getImageDetails };