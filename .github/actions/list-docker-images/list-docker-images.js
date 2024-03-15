const core = require('@actions/core');
const github = require('@actions/github');
const images = require('../../../docker-images.json');

const listDockerImages = () => {
  try {
    const { owner, repo } = github.context.repo;
    const tag = core.getInput('tag').replace(/\//g, '-');
    const includeBaseImage = core.getInput('include-base-image').replace(/\//g, '-');
    console.log(`includeBaseImage: ${typeof(includeBaseImage)}`);
    let filteredImages = images;

    // filter out the node base image, includeBaseImage is a string
    if (includeBaseImage == 'false') {
      filteredImages = images.filter(img => !img['is-base-image']);

    }

    const matrix = filteredImages.map(img => {
      const imageName = img['service-name'];
      const context = img['context'] ?? '.';
      const dockerfilePath = `${context}/Dockerfile${
        img['named-dockerfile'] ? '.' + imageName : ''
      }`;
      // store file path dependencies as comma separated string
      const dependencies = [
        dockerfilePath,
        ...(img['path-dependencies'] ?? []),
      ].join();
      const longName = `ghcr.io/${owner}/${repo}/${imageName}`;
      return {
        ...img,
        context,
        'docker-file-path': dockerfilePath,
        'tagged-ghcr-name': `${longName}:${tag}`,
        'ghcr-name': longName,
        'path-dependencies': dependencies,
      };
    });

    core.setOutput('matrix', JSON.stringify(matrix));
    console.log('Output:', JSON.stringify(matrix, null, 2));
  } catch (error) {
    core.setFailed(error.message);
    console.error(error);
  }
};

module.exports = { listDockerImages };
