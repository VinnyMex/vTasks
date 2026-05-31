Vou te passar um “projeto pronto” em arquivos. Você só copia para uma pasta e carrega no Chrome/Firefox.

O que essa primeira versão faz
Ícone na barra do navegador.

Ao clicar, abre um popup com:

Campo para adicionar tarefas.

Lista de tarefas com checkbox para concluir.

Botão para excluir tarefa.

Tudo salvo automaticamente em chrome.storage.sync, então sincroniza entre navegadores logados com o mesmo perfil (Chrome).

Funciona em Chrome e Firefox com ajustes mínimos (WebExtension é bem parecido).

Não é ainda “Todoist completo”, mas você já começa a usar agora, e depois a gente evolui para notas, datas, etc.

Estrutura de arquivos
Crie uma pasta, por exemplo: vinfo-notes-extension/, com essa estrutura:

text
vinfo-notes-extension/
  manifest.json
  popup.html
  popup.js
  popup.css
  icon128.png   (pode ser qualquer PNG 128x128 para teste)
O ícone pode ser qualquer imagem temporária só pra não dar erro (até um quadrado preto).

Arquivo manifest.json
Manifest V3 bem simples, usando a API de storage.

json
{
  "manifest_version": 3,
  "name": "Vinfo Tasks",
  "description": "Extensão simples de notas e lista de tarefas local.",
  "version": "0.1.0",
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "128": "icon128.png"
    }
  },
  "permissions": [
    "storage"
  ]
}
Isso é suficiente pra ter um popup e poder salvar dados em chrome.storage.

Arquivo popup.html
Interface simples com input, botão e lista.

xml
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Vinfo Tasks</title>
  <link rel="stylesheet" href="popup.css" />
</head>
<body>
  <div class="container">
    <h1>Vinfo Tasks</h1>

    <form id="task-form">
      <input
        type="text"
        id="task-input"
        placeholder="Digite uma tarefa e pressione Enter"
        autocomplete="off"
      />
      <button type="submit">+</button>
    </form>

    <ul id="task-list"></ul>
  </div>

  <script src="popup.js"></script>
</body>
</html>
Arquivo popup.css
Estilo minimalista para ficar agradável dentro do popup.

css
body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.container {
  width: 320px;
  max-height: 480px;
  padding: 12px;
  box-sizing: border-box;
}

h1 {
  font-size: 16px;
  margin: 0 0 8px;
  text-align: center;
}

#task-form {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

#task-input {
  flex: 1;
  padding: 6px 8px;
  font-size: 13px;
}

#task-form button {
  padding: 6px 10px;
  font-size: 16px;
  cursor: pointer;
}

#task-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 4px;
  border-bottom: 1px solid #eee;
  font-size: 13px;
}

.task-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.task-title {
  flex: 1;
  word-break: break-word;
}

.task-title.done {
  text-decoration: line-through;
  color: #999;
}

.delete-btn {
  border: none;
  background: transparent;
  color: #c00;
  cursor: pointer;
  font-size: 14px;
}
Arquivo popup.js
Aqui está toda a lógica: carregar tarefas, salvar em chrome.storage.sync, adicionar, marcar como concluída e deletar.

js
// Se estiver no Firefox, o objeto é "browser".
// Este fallback faz funcionar em Chrome e Firefox.
const storage = (typeof browser !== "undefined" ? browser.storage : chrome.storage);

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskListEl = document.getElementById("task-list");

let tasks = []; // { id, title, done }

// Carrega tarefas ao abrir o popup
document.addEventListener("DOMContentLoaded", () => {
  storage.sync.get(["vinfoTasks"], (result) => {
    if (result && Array.isArray(result.vinfoTasks)) {
      tasks = result.vinfoTasks;
    } else if (result && result.vinfoTasks && typeof result.vinfoTasks.then === "function") {
      // Firefox (API baseada em Promise)
      result.vinfoTasks.then((value) => {
        tasks = Array.isArray(value) ? value : [];
        renderTasks();
      });
      return;
    }
    renderTasks();
  });
});

// Salva no storage
function saveTasks() {
  storage.sync.set({ vinfoTasks: tasks }, () => {
    // Em Chrome, callback vazio tá ok.
    // Em Firefox, ignore se usar promise.
  });
}

// Renderiza lista
function renderTasks() {
  taskListEl.innerHTML = "";

  if (!tasks.length) {
    const empty = document.createElement("li");
    empty.textContent = "Nenhuma tarefa ainda.";
    empty.style.color = "#999";
    empty.style.fontSize = "12px";
    empty.style.textAlign = "center";
    empty.style.padding = "8px 0";
    taskListEl.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";

    const left = document.createElement("div");
    left.className = "task-left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    if (task.done) {
      title.classList.add("done");
    }

    left.appendChild(checkbox);
    left.appendChild(title);

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(left);
    li.appendChild(delBtn);
    taskListEl.appendChild(li);
  });
}

// Adiciona nova tarefa
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;

  const newTask = {
    id: Date.now(),
    title,
    done: false
  };

  tasks.unshift(newTask);
  taskInput.value = "";
  saveTasks();
  renderTasks();
});

// Alterna concluída / não concluída
function toggleTask(id) {
  tasks = tasks.map((t) =>
    t.id === id ? { ...t, done: !t.done } : t
  );
  saveTasks();
  renderTasks();
}

// Deleta tarefa
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}
Observação: o código acima usa chrome.storage.sync, que é perfeito pra esse caso porque sincroniza entre dispositivos no mesmo perfil.

Para Firefox, o ideal é usar a API browser.storage.sync com Promises, mas como você quer rodar “agora” no Chrome, isso já funciona direto.

Como instalar manualmente no Chrome
Baseado no fluxo padrão de desenvolvimento de extensões:

Abra o Chrome.

Acesse chrome://extensions/.

Ative o Modo do desenvolvedor (canto superior direito).

Clique em Carregar sem compactação (ou “Load unpacked”).

Selecione a pasta vinfo-notes-extension/ que você criou.

O ícone da extensão deve aparecer na barra.

Clique no ícone → popup abre → já pode adicionar tarefas.

Como testar rapidamente no Firefox
Firefox também suporta WebExtensions.

Abra o Firefox.

Vá em about:debugging#/runtime/this-firefox.

Clique em Load Temporary Add-on.

Selecione o arquivo manifest.json dentro da pasta da extensão.

O ícone aparece; clique para abrir o popup.

Se no Firefox o chrome.storage der problema, você troca no topo do popup.js para usar diretamente browser.storage.sync (como sugeri com o fallback).

Próximos passos evolutivos (quando você quiser)
Depois que você estiver usando essa extensão básica, a gente pode:

Adicionar:

Campo de descrição/nota na tarefa.

Datas e horários usando datetime-local.

Agrupamento por listas (trabalho, casa, etc.).

Criar uma “agenda mínima” dentro do popup:

Exibir tarefas com data organizadas por dia.

Depois, quando quiser backend:

Migrar de chrome.storage para API remota sem perder UX (salvar localmente e sincronizar).

Se quiser, no próximo passo posso te enviar uma versão 2 já com: campo de descrição, “lista” (categoria) e filtro “Hoje / Todas” mantendo tudo só em chrome.storage.

