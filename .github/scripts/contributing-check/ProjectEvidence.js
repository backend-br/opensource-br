class ProjectEvidence {
  constructor({ reference, profile, repository, readme, guideNames }) {
    this.reference = reference;
    this.profile = profile;
    this.repository = repository;
    this.readme = readme;
    this.guideNames = guideNames;
  }

  get exists() {
    return Boolean(this.profile) && (!this.reference.hasRepository || Boolean(this.repository));
  }

  get location() {
    return this.profile?.location ?? '';
  }

  get homepage() {
    return this.repository?.homepage || this.profile?.blog || '';
  }
}

module.exports = { ProjectEvidence };
