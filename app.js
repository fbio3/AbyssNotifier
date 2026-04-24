// 1. Conexão com o Supabase
const supabaseUrl = 'https://hertafbgdkkhafaarvya.supabase.co';
const supabaseKey = 'sb_publishable_DoPdxwmjvWSI9PRNSGFhMw__mHvz2fu';

// MUDANÇA AQUI: Trocamos o nome de "supabase" para "supabaseClient"
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Função para alternar as telas
function mostrarTela(telaId) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('cadastro-section').classList.add('hidden');
    document.getElementById('app-section').classList.add('hidden');
    
    document.getElementById(telaId).classList.remove('hidden');
}

// 3. Verifica se o usuário já está logado ao abrir a página
async function verificarSessao() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        mostrarTela('app-section');
        carregarAnimes(session.user.id);
    } else {
        mostrarTela('login-section');
    }
}

// 4. Fazer Login
async function entrar() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-senha').value;

    if(!email || !password) return alert("Preencha e-mail e senha!");

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    if (error) {
        alert("Erro ao entrar: " + error.message);
    } else {
        window.location.reload(); // Recarrega a página para entrar no painel
    }
}

// 5. Criar Conta
async function cadastrar() {
    const email = document.getElementById('cad-email').value;
    const password = document.getElementById('cad-senha').value;

    if(!email || !password) return alert("Preencha e-mail e senha!");
    if(password.length < 6) return alert("A senha deve ter pelo menos 6 caracteres.");

    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    
    if (error) {
        alert("Erro ao criar conta: " + error.message);
    } else {
        alert("Conta criada com sucesso! Você já pode fazer login.");
        mostrarTela('login-section');
    }
}

// 6. Sair da Conta
async function sair() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

// 7. Adicionar Anime no Banco
async function adicionarAnime() {
    const nome = document.getElementById('nome-anime').value;
    const foto = document.getElementById('foto-anime').value;
    const dia = document.getElementById('dia-semana').value;
    
    if(!nome) return alert("O nome do anime é obrigatório!");

    const { data: { user } } = await supabaseClient.auth.getUser();

    const { error } = await supabaseClient.from('animes').insert([
        { user_id: user.id, nome: nome, foto_url: foto, dia_semana: dia }
    ]);

    if (error) {
        alert("Erro ao adicionar: " + error.message);
    } else {
        alert("Anime adicionado!");
        document.getElementById('nome-anime').value = ''; // Limpa o campo
        carregarAnimes(user.id); // Atualiza a lista na hora
    }
}

// 8. Carregar Animes na Tela
async function carregarAnimes(userId) {
    const { data: animes, error } = await supabaseClient.from('animes').select('*');
    const lista = document.getElementById('lista-animes');
    lista.innerHTML = ''; 

    if (animes && animes.length > 0) {
        animes.forEach(anime => {
            lista.innerHTML += `
                <div class="anime-card">
                    <h4 style="margin: 0 0 10px 0;">${anime.nome} <span style="color: #58a6ff;">(${anime.dia_semana})</span></h4>
                    ${anime.foto_url ? `<img src="${anime.foto_url}" width="100" style="border-radius: 5px;">` : ''}
                </div>
            `;
        });
    } else {
        lista.innerHTML = '<p>Nenhum anime adicionado ainda.</p>';
    }
}

// Inicia o fluxo
verificarSessao();