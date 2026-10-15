const storage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

function obterCarrinho() {
  return storage.get("carrinho", []);
}

function atualizarContador() {
  const quantidade = obterCarrinho().reduce(
    (total, item) => total + (Number(item.quantidade) || 0),
    0,
  );

  document.querySelectorAll(".carrinho").forEach((contador) => {
    contador.textContent = quantidade || "";
  });
}

function valorNumerico(preco) {
  return (
    Number(
      String(preco || "0")
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim(),
    ) || 0
  );
}

function formatarMoeda(valor) {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

function obterUsuarioLogado() {
  return storage.get("usuarioLogado", null);
}

function exigirLogin(destino) {
  if (obterUsuarioLogado()) return true;
  localStorage.setItem("destinoAposLogin", destino);
  window.location.href = "./login.html";
  return false;
}

function inicializarProdutos() {
  document.querySelectorAll(".produto-card .btn").forEach((botao) => {
    botao.addEventListener("click", () => {
      const card = botao.closest(".produto-card");
      const imagem = card?.querySelector(".produto-imagem img");
      if (!card) return;

      storage.set("produtoSelecionado", {
        nome:
          card
            .querySelector(".produto-titulo")
            ?.textContent.trim()
            .replace(/\s+/g, " ") || "Produto BRAMUR",
        preco:
          card.querySelector(".preco-atual")?.textContent.trim() || "R$ 0,00",
        precoAntigo:
          card.querySelector(".preco-antigo")?.textContent.trim() || "",
        parcelamento:
          card.querySelector(".parcelamento")?.textContent.trim() || "",
        imagem: imagem?.getAttribute("src") || "",
        alt: imagem?.getAttribute("alt") || "Produto BRAMUR",
      });
      window.location.href = "./produto.html";
    });
  });
}

function inicializarProduto() {
  const produto = storage.get("produtoSelecionado", null);
  const detalhe = document.querySelector(".produto-detalhe");
  const vazio = document.getElementById("produto-nao-encontrado");
  if (!produto) {
    detalhe?.classList.add("d-none");
    vazio?.classList.remove("d-none");
    return;
  }

  const preencher = (id, valor) => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
  };
  const nome = produto.nome || "Produto BRAMUR";
  const imagem = document.getElementById("produto-detalhe-imagem");
  if (imagem) {
    imagem.src = produto.imagem;
    imagem.alt = produto.alt || nome;
  }
  preencher("produto-detalhe-titulo", nome);
  preencher("produto-detalhe-preco", produto.preco);
  preencher("produto-detalhe-preco-antigo", produto.precoAntigo);
  preencher("produto-detalhe-parcelamento", produto.parcelamento);
  preencher(
    "produto-detalhe-categoria",
    nome.toLowerCase().includes("kit")
      ? "Kits de Boxe & Muay Thai"
      : "Equipamentos de combate",
  );
  preencher(
    "produto-detalhe-tipo",
    /luva|manopla|caneleira|capacete|kit/i.exec(nome)?.[0] ||
      "Acessório de combate",
  );
  preencher(
    "produto-detalhe-cor",
    nome
      .match(
        /(?:Branca?|Pret[ao]|Vermelh[ao]|Rosa|Marrom|Cinza|Ouro|Dourad[ao]|Verde|Amarel[ao])/gi,
      )
      ?.join(" / ") || "Conforme imagem do produto",
  );

  const adicionar = (comprarAgora) => {
    const carrinho = obterCarrinho();
    const item = carrinho.find((produtoAtual) => produtoAtual.nome === nome);
    if (comprarAgora) {
      storage.set("compraAgora", {
        nome,
        preco: produto.preco,
        imagem: new URL(produto.imagem, window.location.href).href,
        quantidade: 1,
      });
      localStorage.setItem("origemCheckout", "produto");
      if (exigirLogin("./checkout.html"))
        window.location.href = "./checkout.html";
      return;
    }
    item
      ? item.quantidade++
      : carrinho.push({
          nome,
          preco: produto.preco,
          imagem: new URL(produto.imagem, window.location.href).href,
          quantidade: 1,
        });
    storage.set("carrinho", carrinho);
    window.location.href = "./carrinho.html";
  };

  document
    .getElementById("adicionar-produto")
    ?.addEventListener("click", () => adicionar(false));
  document
    .getElementById("comprar-agora")
    ?.addEventListener("click", () => adicionar(true));
}

function inicializarCarrinho() {
  const lista = document.getElementById("lista-carrinho");
  if (!lista) return;
  let carrinho = obterCarrinho();

  const renderizar = () => {
    let total = 0;
    let quantidade = 0;
    lista.innerHTML = carrinho
      .map((produto, index) => {
        const valor =
          valorNumerico(produto.preco) * (Number(produto.quantidade) || 1);
        total += valor;
        quantidade += Number(produto.quantidade) || 0;
        return `<div class="item-carrinho">
                <div class="produto-info"><img src="${produto.imagem}" alt="Produto"><div><h3>${produto.nome}</h3><p>Produto BRAMUR</p></div></div>
                <div class="preco">${produto.preco}</div>
                <div class="quantidade"><button data-acao="diminuir" data-index="${index}">-</button><span class="numero">${produto.quantidade}</span><button data-acao="aumentar" data-index="${index}">+</button></div>
                <div class="produto-total">${formatarMoeda(valor)}</div>
                <button class="remover" data-acao="remover" data-index="${index}"><i class="bx bx-trash"></i></button>
            </div>`;
      })
      .join("");
    document.getElementById("subtotal").textContent = formatarMoeda(total);
    document.getElementById("total").textContent = formatarMoeda(total);
    document.getElementById("contador").textContent = quantidade;
    atualizarContador();
  };

  lista.addEventListener("click", (event) => {
    const botao = event.target.closest("[data-acao]");
    if (!botao) return;
    const index = Number(botao.dataset.index);
    if (botao.dataset.acao === "aumentar") carrinho[index].quantidade++;
    if (botao.dataset.acao === "diminuir" && carrinho[index].quantidade > 1)
      carrinho[index].quantidade--;
    if (botao.dataset.acao === "remover") carrinho.splice(index, 1);
    storage.set("carrinho", carrinho);
    renderizar();
  });

  document.querySelector(".compra")?.addEventListener("click", () => {
    if (!carrinho.length) return alert("Seu carrinho está vazio.");
    localStorage.removeItem("compraAgora");
    localStorage.setItem("origemCheckout", "carrinho");
    if (exigirLogin("./checkout.html"))
      window.location.href = "./checkout.html";
  });
  renderizar();
}

function inicializarCheckout() {
  const form = document.getElementById("form-checkout");
  if (!form || !exigirLogin("./checkout.html")) return;
  const origem = localStorage.getItem("origemCheckout") || "carrinho";
  const itens =
    origem === "produto"
      ? [storage.get("compraAgora", null)].filter(Boolean)
      : obterCarrinho();
  const usuario = obterUsuarioLogado();
  const mensagem = document.getElementById("checkout-mensagem");
  document.getElementById("checkout-nome").value = usuario?.nome || "";
  document.getElementById("checkout-email").value = usuario?.email || "";
  if (!itens.length) {
    mensagem.className = "alert alert-warning";
    mensagem.textContent =
      "Não há produtos para finalizar. Volte ao catálogo e escolha um produto.";
    form.querySelector("button[type='submit']").disabled = true;
  }
  const total = itens.reduce(
    (soma, item) =>
      soma + valorNumerico(item.preco) * (Number(item.quantidade) || 1),
    0,
  );
  document.getElementById("checkout-itens").innerHTML = itens
    .map(
      (item) =>
        `<div class="checkout-item"><img src="${item.imagem}" alt="${item.nome}"><div><strong>${item.nome}</strong><span>Quantidade: ${item.quantidade || 1}</span></div><b>${formatarMoeda(valorNumerico(item.preco) * (Number(item.quantidade) || 1))}</b></div>`,
    )
    .join("");
  document.getElementById("checkout-total").textContent = formatarMoeda(total);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!itens.length) return;
    storage.set("ultimoPedido", {
      usuario,
      itens,
      total,
      data: new Date().toISOString(),
    });
    ["carrinho", "compraAgora", "origemCheckout"].forEach((chave) =>
      localStorage.removeItem(chave),
    );
    alert("Compra finalizada com sucesso");
    window.location.href = "./index.html";
  });
}

function inicializarAuth() {
  const login = document.getElementById("form-login");
  const cadastro = document.getElementById("form-cadastro");
  const mensagem = document.getElementById("mensagem-auth");
  if (!login && !cadastro) return;
  const mostrarMensagem = (texto, tipo = "danger") => {
    mensagem.className = `alert alert-${tipo}`;
    mensagem.textContent = texto;
  };
  login?.addEventListener("submit", (event) => {
    event.preventDefault();
    const usuarios = storage.get("usuarios", []);
    const usuario = usuarios.find(
      (item) =>
        item.email === document.getElementById("login-email").value &&
        item.senha === document.getElementById("login-senha").value,
    );
    if (!usuario) return mostrarMensagem("Email ou senha inválidos.");
    storage.set("usuarioLogado", usuario);
    window.location.href =
      localStorage.getItem("destinoAposLogin") || "./index.html";
    localStorage.removeItem("destinoAposLogin");
  });
  cadastro?.addEventListener("submit", (event) => {
    event.preventDefault();
    const usuarios = storage.get("usuarios", []);
    const email = document.getElementById("cadastro-email").value;
    if (usuarios.some((item) => item.email === email))
      return mostrarMensagem("Este email já está cadastrado.");
    const usuario = {
      nome: document.getElementById("cadastro-nome").value,
      email,
      senha: document.getElementById("cadastro-senha").value,
    };
    storage.set("usuarios", [...usuarios, usuario]);
    storage.set("usuarioLogado", usuario);
    window.location.href = "./index.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  atualizarContador();
  inicializarProdutos();
  inicializarProduto();
  inicializarCarrinho();
  inicializarCheckout();
  inicializarAuth();
});
