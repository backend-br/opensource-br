const MARKER = '<!-- contributing-check -->';
const CONTRIBUTING_URL = 'https://github.com/backend-br/opensource-br/blob/main/CONTRIBUTING.md';

class PullRequestComment {
  constructor({ github, owner, repo, number }) {
    this.github = github;
    this.owner = owner;
    this.repo = repo;
    this.number = number;
  }

  sync(problems) {
    const actions = new Map([
      [true, () => this.publish(problems)],
      [false, () => this.withdraw()]
    ]);

    return actions.get(problems.length > 0)();
  }

  async publish(problems) {
    const body = this.bodyFor(problems);
    const [existing] = await this.marked();
    const writers = new Map([
      [true, () => this.update(existing, body)],
      [false, () => this.create(body)]
    ]);

    return writers.get(Boolean(existing))();
  }

  async withdraw() {
    const comments = await this.marked();

    return Promise.all(comments.map(comment => this.remove(comment)));
  }

  async marked() {
    const comments = await this.github.paginate(this.github.rest.issues.listComments, {
      owner: this.owner,
      repo: this.repo,
      issue_number: this.number,
      per_page: 100
    });

    return comments.filter(comment => comment.body?.startsWith(MARKER));
  }

  create(body) {
    return this.github.rest.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: this.number,
      body
    });
  }

  update(comment, body) {
    return this.github.rest.issues.updateComment({
      owner: this.owner,
      repo: this.repo,
      comment_id: comment.id,
      body
    });
  }

  remove(comment) {
    return this.github.rest.issues.deleteComment({
      owner: this.owner,
      repo: this.repo,
      comment_id: comment.id
    });
  }

  bodyFor(problems) {
    return [
      MARKER,
      `Thanks for contributing! The automatic check based on [CONTRIBUTING.md](${CONTRIBUTING_URL}) found points to resolve:`,
      '',
      ...problems.map(problem => `- ${problem}`),
      '',
      'Update the pull request or reply here. The check runs again on every update.'
    ].join('\n');
  }
}

module.exports = { PullRequestComment };
