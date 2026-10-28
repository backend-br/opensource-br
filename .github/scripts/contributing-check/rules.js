const EXPECTED_BASE_BRANCH = 'main';
const GUIDE_FILE = /^contributing(\..+)?$/i;
const README_GUIDE_SECTION = /^#{1,6}\s.*contribu/im;
const BRAZILIAN_LOCATION = /brasil|brazil|\bbr\b|são paulo|sao paulo|rio de janeiro|belo horizonte|curitiba|porto alegre|florianópolis|florianopolis|brasília|brasilia|recife|salvador|fortaleza|campinas|goiânia|goiania/i;
const BRAZILIAN_DOMAIN = /\.br(\/|$)/i;
const PORTUGUESE_WORDS = /\b(não|você|vocês|para|com|uma|como|projeto|instalação|contribuição|licença|documentação|usar|executar)\b/gi;
const MINIMUM_PORTUGUESE_WORDS = 5;

const BRAZILIAN_SIGNALS = [
  evidence => BRAZILIAN_LOCATION.test(evidence.location),
  evidence => BRAZILIAN_DOMAIN.test(evidence.homepage),
  evidence => (evidence.readme.match(PORTUGUESE_WORDS) ?? []).length >= MINIMUM_PORTUGUESE_WORDS
];

class Rule {
  appliesTo() {
    return true;
  }
}

class BaseBranchRule extends Rule {
  isViolatedBy(pullRequest) {
    return pullRequest.base.ref !== EXPECTED_BASE_BRANCH;
  }

  describe(pullRequest) {
    return `O pull request deve ser aberto contra a branch \`${EXPECTED_BASE_BRANCH}\` (está contra \`${pullRequest.base.ref}\`).`;
  }
}

class ExistingProjectRule extends Rule {
  isViolatedBy(evidence) {
    return !evidence.exists;
  }

  describe(evidence) {
    return `\`${evidence.reference.label}\`: o projeto não foi encontrado ou não é público no GitHub.`;
  }
}

class ContributionGuideRule extends Rule {
  appliesTo(evidence) {
    return evidence.exists && evidence.reference.hasRepository;
  }

  isViolatedBy(evidence) {
    const hasGuideFile = evidence.guideNames.some(name => GUIDE_FILE.test(name));
    const hasGuideSection = README_GUIDE_SECTION.test(evidence.readme);

    return !(hasGuideFile || hasGuideSection);
  }

  describe(evidence) {
    return `\`${evidence.reference.label}\`: não encontrei um guia de como contribuir (\`CONTRIBUTING.md\` ou seção de contribuição no README).`;
  }
}

class BrazilianProjectRule extends Rule {
  appliesTo(evidence) {
    return evidence.exists;
  }

  isViolatedBy(evidence) {
    return !BRAZILIAN_SIGNALS.some(signal => signal(evidence));
  }

  describe(evidence) {
    return `\`${evidence.reference.label}\`: não consegui confirmar que o projeto é brasileiro. Explique no pull request por que ele se encaixa.`;
  }
}

const problemsOf = (rules, subject) =>
  rules
    .filter(rule => rule.appliesTo(subject))
    .filter(rule => rule.isViolatedBy(subject))
    .map(rule => rule.describe(subject));

module.exports = {
  problemsOf,
  pullRequestRules: [new BaseBranchRule()],
  projectRules: [new ExistingProjectRule(), new ContributionGuideRule(), new BrazilianProjectRule()]
};
