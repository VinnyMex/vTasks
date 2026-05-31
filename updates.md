Estou com um problema no ícone da minha extensão vTasks (Chrome/Firefox).  
O ícone personalizado não está aparecendo, e o navegador continua mostrando o ícone padrão cinza com a letra inicial.

Contexto importante:
- A extensão já está funcionando (popup, storage, etc.).
- Eu já gerei ícones nos arquivos:
  - icon16-4.png
  - icon32-5.png
  - icon48-6.png
  - icon128-3.png
  - icon128.jpg
- Estou trabalhando via CLI, então não consigo colar prints aqui.
- Carrego a extensão como unpacked (Chrome) e como temporary add-on (Firefox).

Quero que você:

1) Revise e reescreva o manifest.json para garantir que:
   - Use o nome "vTasks".
   - Aponte corretamente para os ícones PNG.
   - Não use JPG como ícone principal (Chrome prefere PNG).
   - Os caminhos sejam exatamente os mesmos dos arquivos existentes.

2) Padronize os nomes dos arquivos de ícone de forma simples:
   - Renomear (no manifest, e se necessário me orientar a renomear os arquivos físicos) para:
     - icons/icon16.png
     - icons/icon32.png
     - icons/icon48.png
     - icons/icon128.png
   - Ou seja, quero um subdiretório "icons" na raiz da extensão com esses 4 arquivos PNG.
   - Você pode assumir que eu vou renomear meus arquivos atuais (icon16-4.png, icon32-5.png, icon48-6.png, icon128-3.png) para estes nomes padronizados.

3) Atualizar o manifest.json com a configuração correta dos ícones:

   - Campo "icons" (para página de extensões, instalação etc.):
     "icons": {
       "16": "icons/icon16.png",
       "32": "icons/icon32.png",
       "48": "icons/icon48.png",
       "128": "icons/icon128.png"
     }

   - Campo "action.default_icon" (para o ícone na barra):
     "action": {
       "default_popup": "popup.html",
       "default_icon": {
         "16": "icons/icon16.png",
         "32": "icons/icon32.png"
       }
     }

   - Garantir que o manifest esteja em Manifest V3.

4) Verificar se existe algum outro lugar no manifest que possa estar interferindo no ícone:
   - Ex: "browser_action" antigo, ou campos redundantes.
   - Se houver, limpar e deixar apenas a configuração correta baseada em "action".

5) Me entregar o manifest.json FINAL (completo) já corrigido, assumindo a estrutura de pastas:

   / (raiz da extensão)
     manifest.json
     popup.html
     popup.js
     popup.css
     /icons
       icon16.png
       icon32.png
       icon48.png
       icon128.png

6) Incluir no final um bloco de instruções em texto simples (comentário fora do JSON) com os passos que devo seguir manualmente para garantir que o ícone atualize no Chrome/Firefox, por exemplo:

   - Certificar que os arquivos PNG existem no diretório /icons com os nomes exatos.
   - Remover a extensão do Chrome e carregar novamente a pasta.
   - Fechar e reabrir o Chrome se necessário (por causa de cache).
   - No Firefox, usar "Load Temporary Add-on" apontando para o manifest.json.
   - Confirmar que o ícone aparece em:
     - chrome://extensions
     - Barra de extensão
     - about:addons no Firefox.

IMPORTANTE:
- Não alterar nenhum outro comportamento da extensão (popup, scripts, etc.).
- Focar APENAS em corrigir e padronizar a configuração de ícones no manifest.json, considerando que eu já tenho os PNGs físicos.
- Lembre-se: estou em CLI, então preciso de um manifest.json que eu possa simplesmente sobrescrever no meu projeto, mais instruções de passos manuais no final.

Quero adicionar ao meu projeto de extensão vTasks uma funcionalidade de “janela fixa” que fique visível enquanto eu navego na página, em vez do popup padrão que fecha ao clicar fora.

IMPORTANTE: entendo que o popup de extensão (default_popup) do Chrome/Firefox SEMPRE fecha ao clicar fora, é comportamento do navegador. Por isso, quero uma alternativa via página própria + janela popup.

Objetivo:

- Ter um botão no popup do vTasks que abre uma JANELA PRÓPRIA da extensão (tipo mini-app), com a mesma interface do vTasks (notas + checklist).
- Essa janela:
  - Deve ser criada via chrome.windows.create (ou browser.windows.create com fallback).
  - Não fecha quando eu clico na página.
  - Deve ter um visual “flutuante” com ~80% de transparência (efeito overlay).
- Quero que essa janela seja usada como “vTasks flutuante” quando eu estiver copiando textos, anotando enquanto navego etc.

Detalhes de implementação:

1) Criar um novo HTML: dashboard.html

- Essa página deve reutilizar a mesma UI do popup (lista de notas/projetos com cards, view de detalhe com checklist, notas internas, etc.).
- Pode reaproveitar popup.css e popup.js, ou, se achar melhor, criar um script separado que importe/mova a lógica, mas não quero reescrever tudo.
- O layout pode ser o mesmo do popup, mas com altura maior (por exemplo 640px) e largura ajustável (360–420px).

2) Transparência / estilo “overlay”

- No dashboard.html, aplicar um estilo para dar aparência de popup flutuante sem borda pesada:
  - body com background semi-transparente, por exemplo: background: rgba(15, 23, 42, 0.2);
  - Um container central (.vtasks-root) com:
    - background: rgba(15, 23, 42, 0.85) no tema escuro (ou rgba(249, 250, 251, 0.9) no tema claro), simulando 80% de opacidade.
    - border-radius: 12px.
    - box-shadow mais suave, para parecer um painel flutuante.
- A ideia é: a janela em si é opaca, mas o conteúdo do vTasks tem essa sensação de semi-transparência; é o mais próximo que dá para chegar de “80% de transparência fixa” em uma janela de extensão.

3) Botão no popup para abrir o dashboard

- No popup.html, adicionar um botão no header (próximo ao botão “+ Nova nota”), com id, por exemplo, "open-floating-btn" e texto/ícone tipo "📌 Fixo" ou "Abrir painel".
- No popup.js, implementar o handler:

  - Usando chrome.windows.create (com fallback para browser.windows.create):

    const api = typeof browser !== "undefined" ? browser : chrome;

    function openFloatingWindow() {
      const url = api.runtime.getURL("dashboard.html");
      api.windows.create({
        url,
        type: "popup",
        width: 420,
        height: 640,
        focused: true
      });
    }

    // associar ao botão:
    document.getElementById("open-floating-btn").onclick = openFloatingWindow;

- Assim, quando eu clicar nesse botão, abre a janela flutuante do vTasks.

4) Reutilização da lógica e tema (dark/light)

- O dashboard deve:
  - Carregar o mesmo CSS (popup.css) para tema claro/escuro.
  - Carregar o mesmo JS de lógica (ou uma versão compartilhada) para:
    - Ler as notas do chrome.storage.sync/browser.storage.sync.
    - Renderizar lista e detalhe.
    - Respeitar o tema salvo (vTasks_theme).
- Se for necessário, adaptar o JS para funcionar tanto no popup quanto no dashboard, detectando pelo ID de root ou por uma flag simples.

5) Manifest.json

- Garantir que o dashboard.html esteja acessível via chrome.runtime.getURL("dashboard.html") sem precisar de nenhuma permissão extra.
- Não quero mudar o default_popup, apenas adicionar esse dashboard como página adicional.
- Então, apenas certifique-se de que dashboard.html está listado na raiz do projeto (não precisa ser options_page).

6) Saída esperada

Por favor, me devolva:

- popup.html atualizado com o botão "open-floating-btn" no header.
- popup.js atualizado com:
  - Função openFloatingWindow usando chrome.windows.create (ou browser.windows.create).
  - Assinatura de clique no botão.
- dashboard.html completo, reutilizando a UI do vTasks.
- Se necessário, ajuste em popup.css para:
  - Deixar o dashboard com visual de painel flutuante e “80% transparente” como descrito (usando rgba).
- manifest.json apenas se algum ajuste extra for realmente necessário (senão, pode deixar como está).

Lembre-se:
- Não quero que o comportamento do popup mude (ele continua fechando ao clicar fora, isso é padrão).
- Quero usar o novo botão para abrir a janela fixa flutuante (dashboard.html), que não fecha ao clicar na página e tem aparência de popup transparente.