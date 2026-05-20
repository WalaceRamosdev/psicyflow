# PsychFlow - Portal do Paciente (Astro JS)

Este subprojeto contém o **Portal do Paciente** do PsychFlow, desenvolvido com **Astro.js** e **React (Islands Architecture)** para máxima performance, indexação SEO e carregamento instantâneo no celular.

Pelo portal, o paciente pode acessar a página pública do psicólogo, selecionar um horário disponível, realizar o pré-agendamento de forma segura, efetuar o pagamento simulado por PIX e obter o link da teleconsulta no Jitsi Meet.

---

## 🚀 Como Executar Localmente

### 1. Instalar as Dependências
Navegue até a pasta `portal-paciente` no seu terminal e execute:
```bash
npm install
```

### 2. Rodar o Servidor de Desenvolvimento
Inicie o Astro localmente:
```bash
npm run dev
```
O portal estará disponível em: **`http://localhost:4321/`**

---

## 🔗 Estrutura dos Links de Agendamento

O portal foi desenhado de forma **dinâmica e multi-tenant**. Isso significa que você pode acessar a agenda de qualquer psicólogo da sua base do Supabase alterando a URL:

*   **`http://localhost:4321/[slug]`**
    *   Exemplo: `http://localhost:4321/dra-silva` ou `http://localhost:4321/dr-gabriel`
    *   A página buscará no Supabase a linha da tabela `profiles` cujo campo `office_domain` ou `id` seja idêntico ao slug da URL.
    *   Caso o psicólogo não seja encontrado, o portal carregará um perfil demo com regras de negócio simuladas para facilidade de testes.

---

## 🛡️ Segurança e LGPD

1.  **Sigilo Absoluto dos Pacientes:** O portal não realiza queries abertas na tabela de consultas (`appointments`). Em vez disso, ele consome a View segura **`occupied_slots`** do Supabase. Essa View expõe apenas o ID do profissional, data, horário e status da consulta. Dados de identificação (como nomes e contatos de outros pacientes) nunca saem do banco para o navegador.
2.  **Criptografia E2E:** Evoluções e prontuários nem sequer existem neste repositório do paciente.

---

## ⚡ Variáveis de Ambiente (Opcional)

Por padrão, o projeto já vem configurado com as chaves anonimizadas do seu banco Supabase de desenvolvimento. Caso queira alterá-las em produção, crie um arquivo `.env` na raiz da pasta `portal-paciente`:

```env
PUBLIC_SUPABASE_URL=https://sua-url-do-supabase.supabase.co
PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key
```

---

## 🌍 Implantação Grátis (Vercel ou Netlify)

A hospedagem do portal de agendamentos é **100% gratuita** utilizando provedores estáticos modernos:

1.  **Vercel:** Conecte seu repositório Git, adicione um novo projeto apontando para a subpasta `portal-paciente` e clique em Deploy.
2.  **Netlify:** Arraste a pasta `dist` gerada após rodar `npm run build` ou conecte ao repositório Git.
