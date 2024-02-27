const core = require('@actions/core');
const github = require('@actions/github');
const images = require('../../../docker-images.json');

const getImageDetails = () => {
  try {
    const { owner, repo } = github.context.repo;
    const tag = core.getInput('tag').replace(/\//g, '-');
    const imageNameFilter = core.getInput('name'); // Get the "image-name" input

    // Use find to get the first image that matches the "image-name" input
    const foundImage = images.find(img => img['service-name'] === imageNameFilter);

    if (!foundImage) {
      // If no match is found, return base node image details
      core.setOutput('matrix', JSON.stringify({
        'service-name': 'node-base',
        'context': 'node-base',
      }));
      console.log('No matching image found.');
      return; // Exit the function early
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

    };

    core.setOutput('matrix', JSON.stringify(matrix));
    console.log('Output:', JSON.stringify(matrix, null, 2));
  } catch (error) {
    core.setFailed(error.message);
    console.error(error);
  }
};

module.exports = { getImageDetails };
