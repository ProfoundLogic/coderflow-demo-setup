# coderflow-demo-setup

CoderFlow demo/example setup repository.

## Included Environments

### ibmi-development

Example environment for agentic coding on traditional IBM i green screen and Rich Display File applications.

Features:
- Public example repository: [ibmi-agentic](https://github.com/ProfoundLogic/ibmi-agentic)
- Agent builds code onto IBM i in temporary agentic work library.
- Agent interprets IBM i compile listings and responds to failures.
- Agent performs exploratory tests to verify its work by operating Profound UI / Genie sessions.
- Exploratory verification results included in agent's task output summary.
- Human reviewer can test agent's work in a Profound UI / Genie session.

## Initial Setup

Some setup is required for CoderFlow to be able to modify your own copy of the example application repostories that live within your own Git hosting service provider, i.e. GitHub or Azure DevOps.

1. See above for public example application Git repositories.
2. Clone a copy of the public example repositories and push into your organization's GitHub/GitHub Enterprise or Azure DevOps organization.
3. In CoderFlow, create a [Git Provider](https://coderflow.ai/docs/#/admin/git-providers?id=git-providers) with the name `github-coderflow-demo-server` that grants access to the copy of the example repos in your organization. The Git Provider name is referenced in the example environment repository configurations.
4. In CoderFlow, adjust the [repository configurations](https://coderflow.ai/docs/#/admin/environments?id=repositories) in the example environments to use the copy of the example repos on your Git hosting provider by searching/selecting the repository name in the repository URL dropdown and saving the environment.
5. [Build](https://coderflow.ai/docs/#/admin/environments?id=building-environments) the example environments.
