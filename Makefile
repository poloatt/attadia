.PHONY: staging-build staging-up staging-down staging-logs staging-restart

# Variables
DOCKER_COMPOSE = docker-compose -f docker-compose.staging.yml --env-file .env.staging.docker

# Comandos principales
staging-build:
	$(DOCKER_COMPOSE) build --no-cache

staging-up:
	$(DOCKER_COMPOSE) up -d

staging-down:
	$(DOCKER_COMPOSE) down

staging-logs:
	$(DOCKER_COMPOSE) logs -f

staging-restart:
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) up -d

# Comando todo en uno
staging: staging-build staging-up
	@echo "Ambiente de staging iniciado. Usa 'make staging-logs' para ver los logs." 