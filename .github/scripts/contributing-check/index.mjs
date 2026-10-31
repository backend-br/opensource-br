import { GitHubProjectGateway } from './github-project-gateway.mjs'
import { detectLanguage } from './language.mjs'
import { PullRequestComment } from './pull-request-comment.mjs'
import { projectsAddedToReadme } from './readme-projects.mjs'
import { problemsOf, projectRules, pullRequestRules } from './rules.mjs'

export default async ({ github, context }) => {
  const { owner, repo } = context.repo
  const number = context.payload.pull_request?.number ?? Number(context.payload.inputs.pull_request_number)
  const { data: pullRequest } = await github.rest.pulls.get({ owner, repo, pull_number: number })

  const files = await github.paginate(github.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pullRequest.number,
    per_page: 100,
  })

  const gateway = new GitHubProjectGateway(github)
  const evidences = await Promise.all(projectsAddedToReadme(files).map((reference) => gateway.evidenceOf(reference)))

  const problems = [
    ...problemsOf(pullRequestRules, pullRequest),
    ...evidences.flatMap((evidence) => problemsOf(projectRules, evidence)),
  ]

  const language = detectLanguage(`${pullRequest.title ?? ''}\n${pullRequest.body ?? ''}`)

  await new PullRequestComment({ github, owner, repo, number: pullRequest.number }).sync(problems, language)
}
