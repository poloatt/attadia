.PHONY: staging-build staging-up staging-down staging-logs staging-restart staging-rebuild staging-prune

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

# Comando para limpiar y reconstruir
staging-prune:
	$(DOCKER_COMPOSE) down
	docker system prune -f --volumes
	docker volume rm present_mongodb_staging_data || true

staging-rebuild: staging-prune staging-build staging-up
	@echo "Ambiente de staging reconstruido completamente. Usa 'make staging-logs' para ver los logs."

# Comando todo en uno
staging: staging-build staging-up
	@echo "Ambiente de staging iniciado. Usa 'make staging-logs' para ver los logs."

# ===== FIX RUTINAS DELETE 404 =====
.PHONY: fix-rutinas-diagnostic fix-rutinas-nginx fix-rutinas-ssl fix-rutinas-complete fix-rutinas-rollback

# Diagnóstico del problema de eliminación de rutinas
fix-rutinas-diagnostic:
	@echo "🔍 Ejecutando diagnóstico del problema de eliminación de rutinas..."
	sudo chmod +x scripts/debug-rutinas-delete.sh
	sudo ./scripts/debug-rutinas-delete.sh

# Configurar nginx para api.admin.attadia.com
fix-rutinas-nginx:
	@echo "🔧 Configurando nginx para api.admin.attadia.com..."
	sudo chmod +x scripts/fix-api-subdomain.sh
	sudo ./scripts/fix-api-subdomain.sh

# Configurar certificados SSL
fix-rutinas-ssl:
	@echo "🔐 Configurando certificados SSL..."
	sudo chmod +x scripts/generate-ssl-cert-letsencrypt.sh
	sudo ./scripts/generate-ssl-cert-letsencrypt.sh

# Fix completo (diagnóstico + nginx + ssl)
fix-rutinas-complete: fix-rutinas-diagnostic fix-rutinas-nginx fix-rutinas-ssl
	@echo "🎉 Fix completo aplicado!"
	@echo "Prueba la eliminación de rutinas desde el frontend."
	@echo "Logs disponibles en: /var/log/nginx/api.admin.attadia.com.access.log"

# Rollback del fix
fix-rutinas-rollback:
	@echo "🔄 Ejecutando rollback del fix..."
	sudo rm -f /etc/nginx/sites-enabled/api.admin.attadia.com
	sudo systemctl reload nginx
	@echo "✅ Rollback completado"

# Verificar estado después del fix
fix-rutinas-verify:
	@echo "🔍 Verificando estado después del fix..."
	@echo "Probando conectividad a api.admin.attadia.com..."
	curl -I https://api.admin.attadia.com/health || echo "❌ Error de conectividad"
	@echo "Verificando logs recientes..."
	tail -5 /var/log/nginx/api.admin.attadia.com.access.log 2>/dev/null || echo "📝 No hay logs aún"

# Ayuda para comandos del fix
fix-rutinas-help:
	@echo "🔧 Comandos disponibles para el fix de rutinas:"
	@echo "  make fix-rutinas-diagnostic  # Diagnosticar el problema"
	@echo "  make fix-rutinas-nginx       # Configurar nginx"
	@echo "  make fix-rutinas-ssl         # Configurar SSL"
	@echo "  make fix-rutinas-complete    # Aplicar fix completo"
	@echo "  make fix-rutinas-verify      # Verificar estado"
	@echo "  make fix-rutinas-rollback    # Rollback en caso de problemas"
	@echo ""
	@echo "📋 Uso recomendado:"
	@echo "  1. make fix-rutinas-diagnostic"
	@echo "  2. make fix-rutinas-complete"
	@echo "  3. make fix-rutinas-verify"