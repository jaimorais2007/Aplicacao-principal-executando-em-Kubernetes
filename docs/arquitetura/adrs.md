# Architecture Decision Records (ADRs)

Este documento registra as decisões arquiteturais estruturais (permanentes) adotadas pela equipe para o Tech Challenge da Oficina Mecânica.

---

## ADR-001: Adoção de Banco de Dados Gerenciado para Transações

**Contexto:**
A aplicação gerencia um alto volume de criação e atualização de ordens de serviço. O estado da aplicação (dados dos clientes, histórico de serviços prestados e faturamento) é crítico para o negócio. Hospedar o banco de dados dentro do próprio cluster Kubernetes (como StatefulSet) adicionaria um overhead massivo de administração de discos persistentes (PVCs), backups manuais e risco de perda de dados durante atualizações de versão do cluster.

**Decisão:**
A equipe decidiu utilizar um **Banco de Dados Gerenciado em Nuvem (PostgreSQL)**, cuja infraestrutura é isolada do ciclo de vida da aplicação e provisionada através de um repositório Terraform dedicado.

**Consequências:**
- *Positivo:* Backups automatizados, point-in-time recovery e alta disponibilidade (Multi-AZ) tornam-se responsabilidades do provedor cloud, desonerando a equipe de SRE.
- *Positivo:* A aplicação no K8s se torna *Stateless*, facilitando a escalabilidade com o Horizontal Pod Autoscaler (HPA) baseada estritamente em CPU/Memory, sem se preocupar com storage local.
- *Negativo:* Adiciona-se custo mensal premium pela facilidade do serviço gerenciado e adiciona-se uma leve latência de rede entre o cluster K8s e a instância RDS/CloudSQL.

---

## ADR-002: Implementação de Observabilidade com OpenTelemetry e New Relic

**Contexto:**
Devido à expansão para 4 repositórios (Arquitetura Distribuída/Serverless + K8s), debugar problemas de performance em produção (como gargalos no diagnóstico de veículos) tornou-se complexo. Uma requisição que começa no API Gateway, passa pela Lambda e termina no Kubernetes precisa ser rastreada ponta a ponta.

**Decisão:**
Adotaremos a padronização **OpenTelemetry** para instrumentação da aplicação, acoplada ao provedor **New Relic** como dashboard principal.

**Consequências:**
- *Positivo:* OpenTelemetry permite gerar *Traces Distribuídos*. Dessa forma, se a abertura de uma Ordem de Serviço demorar, poderemos ver exatamente se a lentidão ocorreu no Gateway, na API principal ou na query ao banco PostgreSQL.
- *Positivo:* Centralização. Healthchecks, uso de CPU/Memória dos Pods no Kubernetes e as exceptions brutas da aplicação estarão no mesmo dashboard (New Relic), satisfazendo a regra de negócios que exige análise ao vivo.
- *Negativo:* O acoplamento de agentes do New Relic consome uma pequena margem de recursos nos Pods do Kubernetes, além da necessidade de cadastrar headers e tokens (`OTEL_EXPORTER_OTLP_HEADERS`) em todos os repositórios (via CI/CD).
