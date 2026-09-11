# RFC-001: Estratégia de Autenticação Serverless com API Gateway

**Status:** Aceito
**Autor:** Kawan / Equipe de Arquitetura
**Data:** Setembro de 2026

## 1. Contexto e Problema
Com a expansão da oficina mecânica para múltiplas unidades e o aumento constante na base de clientes, a API principal (hospedada em Kubernetes) começou a sofrer gargalos. Identificou-se que a camada de roteamento e o processo de login (validação e geração de JWT) geravam alto consumo de CPU nos Pods. Como o login (autenticação por CPF) sofre picos em determinados horários, dimensionar todo o cluster apenas por causa da autenticação mostrou-se financeiramente ineficiente.

## 2. Solução Proposta
Propomos a extração completa da responsabilidade de Autenticação para uma **Função Serverless (AWS Lambda)** posicionada atrás de um **API Gateway**.

### Mecanismo:
1. O **API Gateway** passa a ser o único ponto de entrada público.
2. Requisições para a rota `/auth` ou `/login` são roteadas diretamente para a **Lambda Function**.
3. A Lambda se conecta ao Banco de Dados Gerenciado (PostgreSQL) para verificar se o CPF informado existe e qual é a sua `role` (*cliente* ou *admin default*).
4. Sendo válido, a Lambda gera um token JWT criptografado (com a claim de role) e o devolve ao cliente.
5. Requisições subsequentes para criação de Ordens de Serviço possuem o header `Authorization: Bearer <token>`. O próprio API Gateway pode verificar a assinatura do JWT (offloading de autenticação) antes de rotear o tráfego pesado para a API Principal no Kubernetes.

## 3. Benefícios (Por que Serverless?)
- **Escalabilidade Automática Sub-segundo:** A Lambda Function escala instantaneamente de 0 a 1000 concorrências sem necessidade de regras de HPA (Horizontal Pod Autoscaler) no Kubernetes.
- **Redução de Custo:** Paga-se apenas pelos milissegundos de execução. A função roda, gera o JWT e morre. A API principal no Kubernetes fica focada apenas no domínio de negócio.
- **Isolamento de Falhas (Security Boundary):** Uma vulnerabilidade na API principal não compromete a chave de assinatura do JWT, que pode ficar restrita ao KMS/Secrets Manager atrelado unicamente à Lambda.

## 4. Consequências e Trade-offs
- **Cold Starts:** Na primeira execução após muito tempo inativa, a Lambda pode sofrer um atraso de inicialização (*Cold Start*). Mitigado pelo uso de *Provisioned Concurrency* ou runtime veloz.
- **Complexidade de CI/CD:** A equipe precisa manter um repositório isolado apenas para a Lambda, implementando uma pipeline dedicada de deployment. (Decisão já acatada conforme divisão de repositórios do projeto).
