const README = 'README.md';
const ADDED_LINE = /^\+(?!\+\+)/;
const PROJECT_ROW = /^\|\s*\[[^\]]*\]\(https:\/\/github\.com\/([\w.-]+)(?:\/([\w.-]+?))?\/?\)/;

class ProjectReference {
  constructor(owner, name) {
    this.owner = owner;
    this.name = name;
  }

  get hasRepository() {
    return Boolean(this.name);
  }

  get label() {
    return [this.owner, this.name].filter(Boolean).join('/');
  }
}

class ReadmeProjects {
  static from(files) {
    return files
      .filter(file => file.filename === README)
      .flatMap(file => (file.patch ?? '').split('\n'))
      .filter(line => ADDED_LINE.test(line))
      .map(line => PROJECT_ROW.exec(line.slice(1)))
      .filter(Boolean)
      .map(([, owner, name]) => new ProjectReference(owner, name));
  }
}

module.exports = { ReadmeProjects };
