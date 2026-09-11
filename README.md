# Aplicacao Principal (Core da Oficina Mecanica)

## Descricao do Proposito
Este repositorio contem a logica de negocios central da oficina, incluindo a gestao completa do ciclo de vida das Ordens de Servico. Ele e executado em Pods no cluster Kubernetes.

## Tecnologias Utilizadas
- C# .NET 10
- Docker & Kubernetes Manifests
- New Relic (OpenTelemetry) para Observabilidade

## Passos para Execucao e Deploy
A pipeline de CI/CD compila a imagem, faz o push para o DockerHub e atualiza o manifesto K8s via "kubectl apply".

## Diagrama da Arquitetura Especifica
`mermaid
graph TD
    Ingress --> PodAPI[Pods: API Principal .NET]
    PodAPI -->|Leitura/Escrita| DB[(PostgreSQL)]
    PodAPI -.->|Traces/Metrics| NR[New Relic]
`

## Link para Documentacao da API
- **Swagger UI:** Acesso via http://yq54i0166m.execute-api.us-east-1.amazonaws.com/swagger/index.html (em ambiente deployado).
- As requisicoes devem incluir o header Authorization: Bearer <jwt-token>.