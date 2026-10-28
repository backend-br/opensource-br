const { GitHubProjectGateway } = require('./GitHubProjectGateway');
const { PullRequestComment } = require('./PullRequestComment');
const { ReadmeProjects } = require('./ReadmeProjects');
const { problemsOf, projectRules, pullRequestRules } = require('./rules');

module.exports = async ({ github, context }) => {
  const { owner, repo } = context.repo;
  const number = context.payload.pull_request?.number ?? Number(context.payload.inputs.pull_request_number);
  const { data: pullRequest } = await github.rest.pulls.get({ owner, repo, pull_number: number });

  const files = await github.paginate(github.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pullRequest.number,
    per_page: 100
  });

  const gateway = new GitHubProjectGateway(github);
  const evidences = await Promise.all(
    ReadmeProjects.from(files).map(reference => gateway.evidenceOf(reference))
  );

  const problems = [
    ...problemsOf(pullRequestRules, pullRequest),
    ...evidences.flatMap(evidence => problemsOf(projectRules, evidence))
  ];

  await new PullRequestComment({ github, owner, repo, number: pullRequest.number }).sync(problems);
};
