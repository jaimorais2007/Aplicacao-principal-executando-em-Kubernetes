import http from 'k6/http';
import { check } from 'k6';

/**
 * Realiza autenticação com a API e retorna o token JWT e os headers de autorização
 * @param {string} baseUrl
 * @param {string} [cpf='81093231033']
 * @returns {{ token: string, headers: object }}
 */
export function login(baseUrl, cpf = '81093231033') {
  const cleanBaseUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : 'https://yq54i0166m.execute-api.us-east-1.amazonaws.com';
  const url = `${cleanBaseUrl}/authenticate`;
  const effectiveCpf = (typeof cpf === 'string' && cpf.includes('@')) ? '81093231033' : (cpf || '81093231033');

  const payload = JSON.stringify({
    cpf: effectiveCpf,
  });

  const params = {
    headers: {
      'Content-Type': 'text/plain',
    },
  };

  const res = http.post(url, payload, params);

  const loginSuccess = check(res, {
    'Login: status é 200': (r) => r.status === 200,
    'Login: token JWT retornado': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && body.token !== undefined && body.token.length > 0;
      } catch (e) {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    throw new Error(`Falha no login com CPF ${effectiveCpf}. Status: ${res.status}, Resposta: ${res.body}`);
  }

  const responseBody = JSON.parse(res.body);
  const token = responseBody.token;

  return {
    token: token,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
}
