# vite-jenkins-demo

Tiny Vite application used by the Kind, Jenkins, and Argo CD GitOps lab.

The `Jenkinsfile` uses:

- every direct branch push for the shared dev environment
- a `vMAJOR.MINOR.PATCH` Git tag for production
- pull requests as build-only validation
