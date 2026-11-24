# Escala – Auxiliares da Porta

App (PWA) com as escalas dos auxiliares da porta da Congregação Cristã no Brasil.
Funciona no **celular (Android e iPhone)** e no **PC**, pode ser **instalado** e funciona **sem internet**.

## Escalas

| Escala | Como funciona |
|---|---|
| Quinta – Culto Oficial | Mesma equipe todas as quintas; as posições giram a cada culto |
| Sábado – Culto Oficial | Mesma equipe todos os sábados; as posições giram a cada culto |
| Domingo – Culto Oficial | Mesma equipe todos os domingos; as posições giram a cada culto |
| Domingo – Culto de Jovens | 3 grupos em revezamento (Grupo 1 → 2 → 3); as posições giram a cada vez que o grupo trabalha |

Posições: **Pedido de Oração**, **Átrio** (2 pessoas nos cultos oficiais), **Porta do Meio** e **Banheiro**.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | Página do app |
| `style.css` | Visual (tema verde) |
| `app.js` | Escalas, rodízio, ADM, exportação e botão Instalar |
| `manifest.json` | Nome, cores e ícones do app instalado |
| `service-worker.js` | Funcionamento offline e atualização automática |
| `icon-192.png`, `icon-512.png` | Ícones |
| `README.md` | Este arquivo |

## Publicar no GitHub Pages

1. Envie todos os arquivos para a **raiz** do repositório (não dentro de uma pasta).
2. Em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`.
3. O app fica em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

> Aberto direto do computador (arquivo local / pasta do WinRAR), o app **não instala** e **não funciona offline**. Use sempre o link `https://`.

## Instalar

O botão **Instalar app** fica no cabeçalho e some depois que o app está instalado.

- **Android (Chrome):** toque em *Instalar app* e confirme.
- **iPhone/iPad (Safari):** Compartilhar → *Adicionar à Tela de Início* → *Adicionar*.
- **PC (Chrome ou Edge):** clique em *Instalar app* e confirme. Se a janela não abrir:
  - Chrome: menu ⋮ → *Transmitir, salvar e compartilhar* → *Instalar página como app*.
  - Edge: menu ⋯ → *Aplicativos* → *Instalar este site como um aplicativo*.

No PC o app ganha atalho na Área de Trabalho e no Menu Iniciar e abre em janela própria.

## Publicar uma atualização ⚠️

1. Substitua os arquivos alterados no GitHub.
2. Abra `service-worker.js` e **aumente o número da versão**:
   ```js
   const CACHE = 'escala-porta-v9';   // mude para v10, depois v11...
   ```
3. Faça o commit e aguarde 1–2 minutos o GitHub Pages publicar.

Celulares e PCs baixam a versão nova **sozinhos** ao abrir o app com internet (ou ao voltar para a janela do app) e a página recarrega automaticamente.
A versão em uso aparece no rodapé do app (ex.: **Versão 9**).

**Se mesmo assim não atualizar** (só na primeira vez, saindo de uma versão antiga):
- PC: com o app aberto, pressione **Ctrl + Shift + R**; ou F12 → *Application* → *Service workers* → *Unregister* e recarregue.
- Celular: feche o app totalmente e abra de novo.

## ADM

- Botão **ADM** no cabeçalho. Senha inicial: **1234** (trocar em *ADM → Trocar senha*).
- Cada escala mostra uma tabela com o ciclo semana a semana (no Culto de Jovens, uma tabela por grupo).
- **Gerar rodízio automático:** um nome por linha → *Gerar ciclo*.
- Mais de um nome na mesma posição: separe com hífen (`GERALDO - VALENTINO`).
- Sempre clique em **Salvar alterações**.

> A senha só evita alterações por engano; não é uma proteção de segurança.

## Dados e backup

- Os dados ficam salvos **no próprio aparelho** (navegador). Alterações feitas no celular **não aparecem** no PC e vice-versa.
- Para levar os dados de um aparelho para outro: **ADM → Exportar JSON** em um e **ADM → Importar JSON** no outro.
- **Restaurar original desta escala** volta a escala para os dados que vêm no `app.js`.

## Exportar

- **Excel (.xlsx):** uma escala ou todas, do ano exibido (precisa de internet).
- Sem internet, a exportação sai em **CSV**, que também abre no Excel.
