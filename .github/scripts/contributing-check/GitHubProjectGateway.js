const { ProjectEvidence } = require('./ProjectEvidence');

const NOT_FOUND = 404;
const GUIDE_DIRECTORIES = ['', '.github', 'docs'];
const NO_REPOSITORY = { repository: null, readme: '', guideNames: [] };

const whenNotFound = fallback => error =>
  error.status === NOT_FOUND ? fallback : Promise.reject(error);

class GitHubProjectGateway {
  constructor(github) {
    this.github = github;
  }

  async evidenceOf(reference) {
    const [profile, repositoryEvidence] = await Promise.all([
      this.profile(reference.owner),
      reference.hasRepository ? this.repositoryEvidence(reference) : NO_REPOSITORY
    ]);

    return new ProjectEvidence({ reference, profile, ...repositoryEvidence });
  }

  async repositoryEvidence({ owner, name }) {
    const [repository, readme, guideNames] = await Promise.all([
      this.repository(owner, name),
      this.readme(owner, name),
      this.guideNames(owner, name)
    ]);

    return { repository, readme, guideNames };
  }

  profile(owner) {
    return this.github.rest.users
      .getByUsername({ username: owner })
      .then(({ data }) => data)
      .catch(whenNotFound(null));
  }

  repository(owner, name) {
    return this.github.rest.repos
      .get({ owner, repo: name })
      .then(({ data }) => data)
      .catch(whenNotFound(null));
  }

  readme(owner, name) {
    return this.github.rest.repos
      .getReadme({ owner, repo: name })
      .then(({ data }) => Buffer.from(data.content, 'base64').toString('utf8'))
      .catch(whenNotFound(''));
  }

  async guideNames(owner, name) {
    const listings = await Promise.all(
      GUIDE_DIRECTORIES.map(path => this.directoryNames(owner, name, path))
    );

    return listings.flat();
  }

  directoryNames(owner, name, path) {
    return this.github.rest.repos
      .getContent({ owner, repo: name, path })
      .then(({ data }) => [data].flat().map(entry => entry.name))
      .catch(whenNotFound([]));
  }
}

module.exports = { GitHubProjectGateway };
