// 1. Conexão com o Supabase
const supabaseUrl = 'https://hertafbgdkkhafaarvya.supabase.co';
const supabaseKey = 'sb_publishable_DoPdxwmjvWSI9PRNSGFhMw__mHvz2fu';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Controle de Telas (Login vs App)
function mostrarAuth(tipo) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('cadastro-section').classList.add('hidden');
    if(tipo === 'login') document.getElementById('login-section').classList.remove('hidden');
    if(tipo === 'cadastro') document.getElementById('cadastro-section').classList.remove('hidden');
}

function mudarAba(abaId) {
    document.getElementById('lista-section').classList.add('hidden');
    document.getElementById('form-section').classList.add('hidden');
    document.getElementById(abaId).classList.remove('hidden');
}

// 3. Verifica Sessão
async function verificarSessao() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('menu-topo').classList.remove('hidden');
        mudarAba('lista-section');
        carregarAnimes();
    }
}

// 4. Autenticação (Entrar e Cadastrar)
async function entrar() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-senha').value;
    if(!email || !password) return alert("Preencha e-mail e senha!");
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) alert("Erro ao entrar: " + error.message);
    else window.location.reload();
}

async function cadastrar() {
    const email = document.getElementById('cad-email').value;
    const password = document.getElementById('cad-senha').value;
    if(!email || !password) return alert("Preencha e-mail e senha!");
    if(password.length < 6) return alert("Senha mínima: 6 caracteres");
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) alert("Erro: " + error.message);
    else { alert("Sucesso! Pode fazer login."); mostrarAuth('login'); }
}

async function sair() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

// 5. Preparar o formulário para Adicionar (Limpa os campos)
function prepararAdicao() {
    document.getElementById('titulo-form').innerText = "Adicionar Anime";
    document.getElementById('anime-id').value = ""; // ID vazio significa que é novo
    document.getElementById('nome-anime').value = "";
    document.getElementById('foto-anime').value = "";
    document.getElementById('ep-atual').value = "0";
    document.getElementById('ep-total').value = "12";
    document.getElementById('hora-notificacao').value = "12:00";
    mudarAba('form-section');
}

// 6. Preparar o formulário para Editar (Puxa os dados do anime)
async function editarAnime(id) {
    const { data: anime, error } = await supabaseClient.from('animes').select('*').eq('id', id).single();
    if (error) return alert("Erro ao carregar anime.");

    document.getElementById('titulo-form').innerText = "Editar Anime";
    document.getElementById('anime-id').value = anime.id;
    document.getElementById('nome-anime').value = anime.nome;
    document.getElementById('foto-anime').value = anime.foto_url || '';
    document.getElementById('ep-atual').value = anime.episodios_atuais || 0;
    document.getElementById('ep-total').value = anime.episodios_total || '';
    document.getElementById('dia-semana').value = anime.dia_semana;
    document.getElementById('hora-notificacao').value = anime.hora_notificacao || '12:00';
    document.getElementById('tipo-notificacao').value = anime.notificacao_tipo || 'email';
    
    mudarAba('form-section');
}

// 7. Salvar Anime (Serve tanto para Adicionar quanto para Editar)
async function salvarAnime() {
    const id = document.getElementById('anime-id').value;
    const nome = document.getElementById('nome-anime').value;
    const foto = document.getElementById('foto-anime').value;
    const ep_atual = document.getElementById('ep-atual').value;
    const ep_total = document.getElementById('ep-total').value;
    const dia = document.getElementById('dia-semana').value;
    const hora = document.getElementById('hora-notificacao').value;
    const tipo = document.getElementById('tipo-notificacao').value;
    
    if(!nome) return alert("O nome do anime é obrigatório!");

    const { data: { user } } = await supabaseClient.auth.getUser();

    // Se a quantidade de episódios atuais for igual ou maior que o total, finaliza automático
    let statusAtual = 'assistindo';
    if (ep_total && parseInt(ep_atual) >= parseInt(ep_total)) {
        statusAtual = 'finalizado';
        alert("Parabéns! Como os episódios atuais atingiram o total, o anime será marcado como Finalizado e as notificações vão parar.");
    }

    const dadosAnime = {
        user_id: user.id,
        nome: nome,
        foto_url: foto,
        dia_semana: dia,
        hora_notificacao: hora,
        notificacao_tipo: tipo,
        episodios_atuais: ep_atual ? parseInt(ep_atual) : 0,
        episodios_total: ep_total ? parseInt(ep_total) : null,
        status: statusAtual
    };

    let erroSalvar;

    if (id) {
        // Se tem ID, estamos EDITANDO
        const { error } = await supabaseClient.from('animes').update(dadosAnime).eq('id', id);
        erroSalvar = error;
    } else {
        // Se NÃO tem ID, estamos ADICIONANDO novo
        const { error } = await supabaseClient.from('animes').insert([dadosAnime]);
        erroSalvar = error;
    }

    if (erroSalvar) {
        alert("Erro ao salvar: " + erroSalvar.message);
    } else {
        alert("Anime salvo com sucesso!");
        mudarAba('lista-section');
        carregarAnimes();
    }
}

// 8. Deletar Anime
async function deletarAnime(id) {
    if(confirm("Tem certeza que deseja deletar este anime da sua lista?")) {
        const { error } = await supabaseClient.from('animes').delete().eq('id', id);
        if(error) alert("Erro ao deletar.");
        else carregarAnimes();
    }
}

// 9. Finalizar Anime (Para as notificações)
async function finalizarAnime(id) {
    if(confirm("Marcar como concluído? Isso vai parar as notificações.")) {
        const { error } = await supabaseClient.from('animes').update({ status: 'finalizado' }).eq('id', id);
        if(error) alert("Erro ao finalizar.");
        else carregarAnimes();
    }
}

// 10. Carregar Animes na Tela Principal
async function carregarAnimes() {
    const { data: animes, error } = await supabaseClient.from('animes').select('*').order('id', { ascending: false });
    const lista = document.getElementById('lista-animes');
    lista.innerHTML = ''; 

    if (animes && animes.length > 0) {
        animes.forEach(anime => {
            const isFinalizado = anime.status === 'finalizado';
            const badgeClass = isFinalizado ? 'badge badge-finalizado' : 'badge';
            const statusTexto = isFinalizado ? 'Concluído' : 'Assistindo';

            lista.innerHTML += `
                <div class="anime-card" style="opacity: ${isFinalizado ? '0.6' : '1'};">
                    ${anime.foto_url ? `<img src="${anime.foto_url}" width="70" style="border-radius: 5px; margin-right: 15px; object-fit: cover; height: 100px;">` : ''}
                    
                    <div class="anime-info">
                        <h4>${anime.nome} <span class="${badgeClass}">${statusTexto}</span></h4>
                        <p>📅 ${anime.dia_semana} às ${anime.hora_notificacao} | 🔔 Via ${anime.notificacao_tipo}</p>
                        <p>📺 Episódios: ${anime.episodios_atuais} / ${anime.episodios_total || '?'}</p>
                    </div>

                    <div class="acoes-btn">
                        <button class="btn-pequeno btn-edit" onclick="editarAnime(${anime.id})">Editar</button>
                        ${!isFinalizado ? `<button class="btn-pequeno btn-finish" onclick="finalizarAnime(${anime.id})">Terminei</button>` : ''}
                        <button class="btn-pequeno btn-del" onclick="deletarAnime(${anime.id})">Excluir</button>
                    </div>
                </div>
            `;
        });
    } else {
        lista.innerHTML = '<p style="color:#8b949e; margin-top:30px;">Sua lista está vazia. Clique em "Adicionar Novo" no menu acima!</p>';
    }
}

// Inicia o app
verificarSessao();