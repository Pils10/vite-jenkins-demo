pipeline {
  agent any

  options {
    // Add timestamps so it is easier to correlate Jenkins, registry, Git, and Argo events.
    timestamps()

    // Do not keep unlimited build history in a small lab controller.
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  environment {
    REGISTRY = 'ghcr.io'
    IMAGE = 'ghcr.io/pils10/vite-demo'

    // Jenkins writes deployment intent here; it never deploys with kubectl directly.
    GITOPS_REPO = 'git@github.com:pils10/vite-gitops.git'

    // Kustomize matches this logical image name before replacing it with IMAGE.
    IMAGE_PLACEHOLDER = 'ghcr.io/pils10/vite-demo'
  }

  stages {
    stage('Choose deployment target') {
      steps {
        script {
          String shortSha = sh(
            script: 'git rev-parse --short=12 HEAD',
            returnStdout: true
          ).trim()

          if (env.TAG_NAME) {
            // A semantic-version tag is the explicit production release signal.
            if (!(env.TAG_NAME ==~ /^v\d+\.\d+\.\d+$/)) {
              error("Tag '${env.TAG_NAME}' is not a release tag. Expected vMAJOR.MINOR.PATCH.")
            }

            env.DEPLOY_ENV = 'production'
            env.IMAGE_TAG = env.TAG_NAME
          } else if (env.CHANGE_ID) {
            // Pull requests are compiled, but do not receive deployment credentials.
            env.DEPLOY_ENV = 'none'
            env.IMAGE_TAG = "pr-${env.CHANGE_ID}-${shortSha}"
          } else {
            // Every direct branch push updates the shared dev environment.
            String safeBranch = env.BRANCH_NAME
              .toLowerCase()
              .replaceAll(/[^a-z0-9_.-]+/, '-')
              .take(40)

            env.DEPLOY_ENV = 'dev'
            env.IMAGE_TAG = "dev-${safeBranch}-${shortSha}"
          }

          echo "Target environment: ${env.DEPLOY_ENV}"
          echo "Immutable image tag: ${env.IMAGE_TAG}"
        }
      }
    }

    stage('Build image') {
      steps {
        // The Vite production build runs inside the Dockerfile. A failed npm/Vite
        // build therefore fails CI before anything is pushed or deployed.
        sh '''
          set -eux
          docker build --pull -t "${IMAGE}:${IMAGE_TAG}" .
        '''
      }
    }

    stage('Push image') {
      when {
        expression {
          // A PR verifies that the app builds but cannot publish an image.
          return env.DEPLOY_ENV != 'none'
        }
      }
      steps {
        withCredentials([
          usernamePassword(
            credentialsId: 'ghcr-creds',
            usernameVariable: 'REGISTRY_USER',
            passwordVariable: 'REGISTRY_TOKEN'
          )
        ]) {
          sh '''
            set -eu

            # --password-stdin keeps the token out of the command arguments.
            printf '%s' "${REGISTRY_TOKEN}" \
              | docker login "${REGISTRY}" \
                  --username "${REGISTRY_USER}" \
                  --password-stdin

            docker push "${IMAGE}:${IMAGE_TAG}"
          '''
        }
      }
    }

    stage('Update GitOps desired state') {
      when {
        expression {
          return env.DEPLOY_ENV != 'none'
        }
      }
      steps {
        script {
          // Concurrent branch builds can race while pushing to the same GitOps branch.
          // Retrying from a fresh clone is a small, understandable lab solution.
          retry(3) {
            sshagent(credentials: ['gitops-ssh']) {
              sh '''
                set -eux

                rm -rf gitops
                git clone --branch main "${GITOPS_REPO}" gitops

                cd "gitops/apps/vite-demo/overlays/${DEPLOY_ENV}"

                # This edits only the image stanza for the selected environment.
                # Argo CD will later detect the resulting Git commit.
                kustomize edit set image \
                  "${IMAGE_PLACEHOLDER}=${IMAGE}:${IMAGE_TAG}"

                cd ../../../..

                git config user.name "Jenkins GitOps Bot"
                git config user.email "jenkins-gitops-bot@example.invalid"

                git add "apps/vite-demo/overlays/${DEPLOY_ENV}/kustomization.yaml"

                # A retry may discover that another run already wrote this exact state.
                if git diff --cached --quiet; then
                  echo "GitOps repository already declares this image."
                  exit 0
                fi

                git commit -m \
                  "deploy(vite-demo): ${DEPLOY_ENV} -> ${IMAGE_TAG}"

                git push origin HEAD:main
              '''
            }
          }
        }
      }
    }
  }

  post {
    always {
      // Remove registry credentials from the Docker client config after the run.
      sh 'docker logout "${REGISTRY}" >/dev/null 2>&1 || true'

      // Avoid gradually filling a small cloud-shell disk with old build images.
      sh 'docker image rm "${IMAGE}:${IMAGE_TAG}" >/dev/null 2>&1 || true'
    }
  }
}
