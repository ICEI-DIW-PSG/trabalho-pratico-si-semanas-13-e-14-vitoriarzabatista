const API_URL = "http://localhost:3000/categorias";

function agruparPor(array, key) {
    return array.reduce((acc, item) => {
        const group = item[key];
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(item);
        return acc;
    }, {});
}

// Lista as categorias na pagina inicial 
async function carregarCategorias() {
    try {
        const res = await fetch(API_URL);
        const itens = await res.json();

        const mainContainer = document.getElementById("mainContentContainer");
        if (!mainContainer) return; 
        
        mainContainer.innerHTML = ""; 

        const gruposPorTipo = agruparPor(itens, 'tipo');

        const descricoesCategoria = {
            "Eventos": "O cenário perfeito para celebrações inesquecíveis. Realize seu casamento, aniversário ou evento corporativo em nossos salões históricos e nos famosos jardins renascentistas.",
            "Gastronomia": "Uma experiência culinária inesquecível com o melhor da cozinha toscana, vinhos da própria Villa e azeites artesanais.",
            "Hospedagem": "Suites luxuosas e ambientes clássicos. Experimente o charme e a tranquilidade de hospedar-se em uma autêntica Villa italiana."
        };

        for (const tipo in gruposPorTipo) {
            const itensDoTipo = gruposPorTipo[tipo];
            const descricaoBase = descricoesCategoria[tipo] || `Descubra mais sobre ${tipo} na Villa Cetinale.`;

            let categoriaHTML = `
                <div class="mb-5 categoria-bloco">
                    <h3 class="section-title">${tipo}</h3>
                    <p class="lead text-muted mb-4">${descricaoBase}</p>
                    
                    <div class="row row-cols-1 row-cols-md-4 g-4 cards-grupo">
            `;

            itensDoTipo.forEach(item => {
                categoriaHTML += `
                    <div class="col">
                        <div class="card h-100 shadow-sm">
                            <!-- Fallback de imagem -->
                            <img src="${item.imagem}" class="card-img-top" alt="${item.nome}" onerror="this.onerror=null;this.src='https://placehold.co/400x300/a89f92/ffffff?text=${item.nome.replace(' ', '+')}'">
                            <div class="card-body d-flex flex-column">
                                <span class="pill mb-2">${item.tipo}</span>
                                <h5 class="card-title">${item.nome}</h5>
                                <p class="card-text text-muted">${item.descricao}</p>
                                <div class="mt-auto">
                                    <a href="detalhes.html?id=${item.id}" class="btn btn-outline-dark btn-sm">Ver detalhes</a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            categoriaHTML += `
                    </div> 
                </div> 
                <hr>
            `;
            mainContainer.innerHTML += categoriaHTML;
        }

    } catch (err) {
        console.error("Erro ao carregar categorias:", err);
        document.getElementById("mainContentContainer").innerHTML = `<div class="alert alert-danger" role="alert">Não foi possível carregar os dados. Verifique o JSON Server e o console para detalhes.</div>`;
    }
}


// FULLCALENDAR
async function carregarCalendarioEventos() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    try {
        const res = await fetch(API_URL);
        const todasCategorias = await res.json();

        // Filtrar e Mapear Eventos
        const eventosDaVilla = todasCategorias
            .filter(item => item.tipo === 'Eventos' && item.dataEvento)
            .map(item => ({
                title: item.nome, 
                start: item.dataEvento, 
                id: item.id, 
                color: '#3e4733', 
                url: `detalhes.html?id=${item.id}` 
            }));

        // Inicializar o FullCalendar
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', 
            locale: 'pt-br', 
            initialDate: '2025-12-01', 
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek'
            },
            buttonText: {
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                list: 'Lista'
            },
            events: eventosDaVilla, 
            eventClick: function(info) {
                if (info.event.url) {
                    window.location.href = info.event.url;
                    return false; 
                }
            },
            eventDidMount: function(info) {
                info.el.title = info.event.title;
            },
            dayMaxEvents: true 
        });

        calendar.render();

    } catch (err) {
        console.error("Erro ao carregar o calendário:", err);
        calendarEl.innerHTML = '<div class="alert alert-danger" role="alert">Erro ao carregar os dados dos eventos. Verifique a conexão com o JSON Server.</div>';
    }
}


// mostra detalhe por id 
async function carregarDetalhes() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return;

    try {
        const res = await fetch(`${API_URL}/${id}`);
        if (!res.ok) throw new Error("Erro ao buscar categoria");
        const cat = await res.json();

        const area = document.getElementById("detailArea");
        area.innerHTML = `
            <div class="detail-hero mb-5">
                <div>
                    <!-- Imagem com fallback/placeholder -->
                    <img src="${cat.imagem}" class="img-fluid rounded mb-4" alt="${cat.nome}" onerror="this.onerror=null;this.src='https://placehold.co/600x400/a89f92/ffffff?text=${cat.nome.replace(' ', '+')}'">
                </div>
                <div>
                    <h2 class="brand">${cat.nome}</h2>
                    <p class="text-muted">${cat.descricao}</p>
                    <hr>
                    <h5>Categoria: ${cat.tipo}</h5>
                    <!-- Exibe a data formatada se for um evento -->
                    ${cat.tipo === 'Eventos' && cat.dataEvento ? `<p class="fw-bold text-success">Data do Evento: ${new Date(cat.dataEvento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>` : ''}
                    <p>${cat.descricaodetalhada}</p>
                    <a href="index.html" class="btn btn-outline-primary mt-3">Voltar</a>
                </div>
            </div>

            <section class="mt-5">
                <h4>Outras Experiências</h4>
                <div class="row row-cols-1 row-cols-md-4 g-4" id="galleryArea"></div>
            </section>
        `;

        // mostrar galeria
        const resOutros = await fetch(API_URL);
        const todas = await resOutros.json();

        const outras = todas.filter(c => String(c.id) !== String(id));
        const gallery = document.getElementById("galleryArea");

        gallery.innerHTML = outras.map(a => `
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <img src="${a.imagem}" class="card-img-top" alt="${a.nome}" onerror="this.onerror=null;this.src='https://placehold.co/400x300/a89f92/ffffff?text=${a.nome.replace(' ', '+')}'">
                    <div class="card-body p-2 text-center">
                        <h6 class="card-title mb-0">${a.nome}</h6>
                        <p class="text-muted small">${a.tipo}</p>
                        <a href="detalhes.html?id=${a.id}" class="stretched-link"></a>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error("Erro ao carregar detalhes:", err);
    }
}


// CRUD de categorias 
async function inicializarCRUD() {
    const form = document.getElementById("formCategoria");
    const lista = document.getElementById("listaCategorias");
    const btnAtualizar = document.getElementById("btnAtualizar");
    const btnExcluir = document.getElementById("btnExcluir");
    
    const statusMessage = document.createElement("p");
    statusMessage.className = "mt-3";
    const formParent = form.parentNode;
    if(formParent) formParent.insertBefore(statusMessage, form.nextSibling);

    let categoriaSelecionada = null;

    function exibirStatus(msg, isError = false) {
        statusMessage.className = `mt-3 fw-bold ${isError ? 'text-danger' : 'text-success'}`;
        statusMessage.textContent = msg;
        setTimeout(() => statusMessage.textContent = '', 4000);
    }

    async function listar() {
        try {
            const res = await fetch(API_URL);
            const categorias = await res.json();
            lista.innerHTML = "";

            categorias.forEach(cat => {
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.innerHTML = `
                    <div>
                        <strong>${cat.nome}</strong>
                        <br><small class="text-muted">${cat.tipo} ${cat.dataEvento ? `(${cat.dataEvento})` : ''}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-primary">Selecionar</button>
                `;
                li.querySelector("button").addEventListener("click", () => selecionar(cat));
                lista.appendChild(li);
            });
        } catch (error) {
            console.error("Erro ao listar categorias:", error);
            lista.innerHTML = `<li class="list-group-item text-danger">Erro ao carregar lista. Verifique a API.</li>`;
        }
    }

    // Selecionar para editar/excluir 
    function selecionar(cat) {
        categoriaSelecionada = cat;
        // Preenche os campos do formulário
        document.getElementById("tipo").value = cat.tipo;
        document.getElementById("nome").value = cat.nome;
        document.getElementById("descricao").value = cat.descricao;
        document.getElementById("descricaodetalhada").value = cat.descricaodetalhada || "";
        document.getElementById("imagem").value = cat.imagem;
        document.getElementById("dataEvento").value = cat.dataEvento || ""; // Sincroniza o campo dataEvento
        exibirStatus(`Item '${cat.nome}' selecionado para edição.`);
    }

    // POST
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const tipo = document.getElementById("tipo").value;
        const novaCat = {
            tipo: tipo,
            nome: document.getElementById("nome").value,
            descricao: document.getElementById("descricao").value,
            descricaodetalhada: document.getElementById("descricaodetalhada").value,
            imagem: document.getElementById("imagem").value,
            // Adiciona dataEvento apenas se for Eventos
            dataEvento: tipo === 'Eventos' ? document.getElementById("dataEvento").value : undefined 
        };
        try {
            await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(novaCat)
            });
            exibirStatus("Item cadastrado com sucesso!");
            form.reset();
            listar();
        } catch (error) {
             exibirStatus("Erro ao cadastrar. Verifique o console.", true);
             console.error("Erro POST:", error);
        }
    });

    // PUT
    btnAtualizar.addEventListener("click", async () => {
        if (!categoriaSelecionada) return exibirStatus("Selecione um item primeiro!", true);
        const tipo = document.getElementById("tipo").value;
        const atualizada = {
            tipo: tipo,
            nome: document.getElementById("nome").value,
            descricao: document.getElementById("descricao").value,
            descricaodetalhada: document.getElementById("descricaodetalhada").value,
            imagem: document.getElementById("imagem").value,
            // Adiciona dataEvento apenas se for Eventos
            dataEvento: tipo === 'Eventos' ? document.getElementById("dataEvento").value : undefined
        };
        try {
            await fetch(`${API_URL}/${categoriaSelecionada.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(atualizada)
            });
            exibirStatus("Item atualizado com sucesso!");
            form.reset();
            categoriaSelecionada = null;
            listar();
        } catch (error) {
             exibirStatus("Erro ao atualizar. Verifique o console.", true);
             console.error("Erro PUT:", error);
        }
    });

    // DELETE
    btnExcluir.addEventListener("click", async () => {
        if (!categoriaSelecionada) return exibirStatus("Selecione um item primeiro!", true);

        if (!confirm('Você tem certeza que deseja excluir este item?')) {
            exibirStatus("Exclusão cancelada.", false);
            return;
        }

        try {
            await fetch(`${API_URL}/${categoriaSelecionada.id}`, { method: "DELETE" });
            exibirStatus("Item excluído com sucesso!");
            form.reset();
            categoriaSelecionada = null;
            listar();
        } catch (error) {
             exibirStatus("Erro ao excluir. Verifique o console.", true);
             console.error("Erro DELETE:", error);
        }
    });

    listar();
}

if (typeof window !== 'undefined') {
    window.carregarDetalhes = carregarDetalhes;
    window.carregarCalendarioEventos = carregarCalendarioEventos; 
    window.inicializarCRUD = inicializarCRUD;
    window.carregarCategorias = carregarCategorias;
}