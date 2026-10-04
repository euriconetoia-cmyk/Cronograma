# Autenticação e perfis — proposta para revisão

## Objetivo e estado

A API atual não autentica usuários. `actorName` é enviado pelo cliente e não comprova identidade. Este documento propõe o subsistema novo; não representa uma implementação nem torna o sistema adequado para uso multiusuário.

## Abordagem recomendada

Login local por e-mail e senha, sessão opaca persistida no PostgreSQL e cookie HttpOnly. Evita expor credenciais/tokens em localStorage e permite revogar sessões imediatamente. Alternativas: provedor OIDC institucional (preferível se já houver um) ou JWT com refresh token (mais componentes para rotação/revogação sem benefício imediato neste projeto).

## Dados e credenciais

Adicionar `passwordHash` e `role` a User; perfis ADMIN, PLANNER, APPROVER e VIEWER. Usuários atuais ficam sem senha e sem acesso até ativação pelo administrador. Armazenar senha com scrypt do Node, salt aleatório e parâmetros versionados; comparação em tempo constante. Nunca retornar hash nas respostas. Criar AuthSession com hash SHA-256 de token aleatório de 32 bytes, userId, expiresAt e createdAt. Expiração absoluta em 8 horas. Revalidar active e role a cada requisição.

Não oferecer cadastro público. Bootstrap do primeiro administrador via comando interativo, sem senha padrão e sem segredos em argumentos/logs. Administração de usuários por ADMIN; desativação e alteração de senha revogam todas as sessões do usuário.

## API, sessão e navegador

POST /auth/login valida credenciais e grava cookie HttpOnly, SameSite=Lax, Secure em produção, Path=/api. GET /auth/me retorna id/name/email/role. POST /auth/logout revoga sessão e limpa cookie. Login com mensagem genérica para usuário inexistente/inativo e senha incorreta. Limitar tentativas por IP e conta; definir armazenamento compartilhado se houver mais de uma instância.

Preferir frontend e API no mesmo domínio usando proxy /api. CORS com lista explícita de origens e credentials; proteger mutações com checagem Origin e token CSRF associado à sessão. Configuração ausente ou insegura em produção deve impedir inicialização.

Guard global protege toda a API, exceto login e health mínimo. Leitura exige sessão; PLANNER e ADMIN alteram cadastros/cronogramas; APPROVER e ADMIN aprovam/rejeitam/publicam; VIEWER apenas lê. PLANNER não pode aprovar. Na futura separação por unidade, autorização deverá também verificar o escopo da entidade, não apenas o perfil.

O backend deriva o ator do usuário autenticado em geração, importação, ajustes, alocação, workflow e auditoria. Remover actorName dos DTOs e campos editáveis da tela. Guard impede que chamadas diretas contornem as restrições. Registrar userId além do nome nos eventos de auditoria e versões.

## Frontend

Tela /login, estado de sessão central, proteção das rotas e logout. Requests e downloads passam pelo mesmo domínio/proxy; erros 401 conduzem a login. Ocultar ações sem permissão, mantendo o backend como autoridade. Integrações precisam de mecanismo próprio de credenciais revogáveis em etapa específica; não devem reutilizar actorName.

## Testes e implantação

Testar login inválido/inativo, hash, expiração/revogação, ausência de cookie, CSRF, limites de tentativas, cada perfil em cada mutação, tentativa de falsificar ator e downloads protegidos. Testar HTTP com Nest e PostgreSQL isolado e o fluxo navegador login → planejamento → aprovação com outro perfil → publicação.

Migration aditiva; backup antes da implantação. Criar administrador, ativar contas e validar login antes de disponibilizar aplicação. Não fazer migração destrutiva do banco existente.

## Decisão pendente

Revisão do desenho e escolha entre login local recomendado ou OIDC institucional. Após aprovação, escrever plano de implementação e executar os testes e mudanças do subsistema.
