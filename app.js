// Conectando ao seu banco de dados
const supabaseUrl = 'SUA_URL_AQUI';
const supabaseKey = 'SUA_CHAVE_AQUI';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Verifica se já tem alguém logado ao abrir a página
async function verificarSessao() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('app-section').classList.remove('hidden');
        carregarAnimes(session.user.id);
    }
}

// Função de Login/Cadastro
async function fazerLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('senha').value;
    const msg = document.getElementById('msg-login');

    msg.innerText = "Carregando...";
    
    // Tenta logar ou criar conta automaticamente
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        // Se a conta não existe, a gente cria!
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
            msg.innerText = "Erro: " + signUpError.message;
        } else {
            msg.innerText = "Conta criada! Verifique seu e-mail para confirmar.";
        }
    } else {
        window.location.reload(); // Recarrega a página logado
    }
}

// Função de Sair
async function sair() {
    await supabase.auth.signOut();
    window.location.reload();
}

// Adicionar Anime no Banco
async function adicionarAnime() {
    const nome = document.getElementById('nome-anime').value;
    const foto = document.getElementById('foto-anime').value;
    const dia = document.getElementById('dia-semana').value;
    
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('animes').insert([
        { user_id: user.id, nome: nome, foto_url: foto, dia_semana: dia }
    ]);

    if (!error) {
        alert("Anime adicionado!");
        carregarAnimes(user.id); // Atualiza a lista
    } else {
        alert("Erro ao adicionar: " + error.message);
    }
}

// Carregar Animes na Tela
async function carregarAnimes(userId) {
    const { data: animes, error } = await supabase.from('animes').select('*');
    const lista = document.getElementById('lista-animes');
    lista.innerHTML = ''; // Limpa a lista antes de carregar

    if (animes) {
        animes.forEach(anime => {
            lista.innerHTML += `
                <div class="anime-card">
                    <h4>${anime.nome} (${anime.dia_semana})</h4>
                    ${anime.foto_url ? `<img src="${anime.foto_url}" width="100">` : ''}
                </div>
            `;
        });
    }
}

// Inicia o app
verificarSessao();