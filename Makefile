.PHONY: bootstrap test lint clean help

D5_SCRIPTS := tasks/d5-reproducible-dev-environment-from-a-fresh-clone/scripts

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  %-12s %s\n", $$1, $$2}'

bootstrap: ## Install deps from fresh-clone state and run tests
	bash $(D5_SCRIPTS)/bootstrap.sh

test: ## Run lint + test suite (assumes deps installed)
	bash $(D5_SCRIPTS)/test.sh

lint: ## Run ruff lint on D2 Python sources
	bash $(D5_SCRIPTS)/test.sh lint

clean: ## Remove bootstrap-created venvs and node_modules
	rm -rf frontend/node_modules
	rm -rf tasks/d2-docker-compose-stack-from-scratch-with-end-to-end-tests/api/.venv
