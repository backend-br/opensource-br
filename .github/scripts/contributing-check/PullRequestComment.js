const { localize } = require('./language');

const MARKER = '<!-- contributing-check -->';
const CONTRIBUTING_URL = 'https://github.com/backend-br/opensource-br/blob/main/CONTRIBUTING.md';

const TEXT_BY_LANGUAGE = {
  pt: {
    intro: `Obrigado por contribuir! A verificação automática baseada no [CONTRIBUTING.md](${CONTRIBUTING_URL}) encontrou pontos a resolver:`,
    outro: 'Atualize o pull request ou responda aqui. A verificação roda de novo a cada atualização.'
  },
  en: {
    intro: `Thanks for contributing! The automatic check based on [CONTRIBUTING.md](${CONTRIBUTING_URL}) found points to resolve:`,
    outro: 'Update the pull request or reply here. The check runs again on every update.'
  }
};

class PullRequestComment {
  constructor({ github, owner, repo, number }) {
    this.github = github;
    this.owner = owner;
    this.repo = repo;
    this.number = number;
  }

  sync(problems, language) {
    const actions = new Map([
      [true, () => this.publish(problems, language)],
      [false, () => this.withdraw()]
    ]);

    return actions.get(problems.length > 0)();
  }

  async publish(problems, language) {
    const body = this.bodyFor(problems, language);
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

  bodyFor(problems, language) {
    const section = localize(language, current => [
      TEXT_BY_LANGUAGE[current].intro,
      '',
      ...problems.map(problem => `- ${problem[current]}`),
      '',
      TEXT_BY_LANGUAGE[current].outro
    ].join('\n'));

    return [MARKER, section].join('\n');
  }
}

module.exports = { PullRequestComment };
