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

    if (!foundImage) {
      throw new Error(`${imageNameFilter} is an invalid image name`);
    }

    const baseImage = images.find(img => img['is-base-image']);
    const baseNodeImage = `ghcr.io/${owner}/${repo}/${baseImage['service-name']}:${tag}`;
    const baseNodeImageFilePath = `${baseImage['service-name']}/Dockerfile`

    const imageName = foundImage['service-name'];
    const context = foundImage['context'] ?? '.';
    const dockerfilePath = `${context}/Dockerfile${foundImage['named-dockerfile'] ? '.' + imageName : ''}`;
    let dependencies = [
      dockerfilePath,
      ...(foundImage['path-dependencies'] ?? []),
    ];
    const ghcrName = `ghcr.io/${owner}/${repo}/${imageName}`;

    // add base node image's dockerfile to the backend and frontend dependencies
    if(['backend', 'frontend'].includes(imageName)){
      dependencies = [...dependencies, baseNodeImageFilePath]
    }

    const outputData = {
      ...foundImage,
      context,
      'docker-file-path': dockerfilePath,
      'tagged-ghcr-name': `${ghcrName}:${tag}`,
      'ghcr-name': ghcrName,
      'path-dependencies': dependencies.join(),
      'base-image': foundImage['node-base'] && baseNodeImage || '',
    };

    core.setOutput('image-details', JSON.stringify(outputData));
    console.log('Output:', JSON.stringify(outputData, null, 2));
  } catch (error) {
    core.setFailed(error.message);
    console.error(error);
  }
};

module.exports = { getImageDetails };
