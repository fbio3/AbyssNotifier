const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

async function rodarRobo() {
    // 1. Pega o dia e a hora atual no fuso horário do Brasil (Brasília)
    const agora = new Date();
    const optionsDia = { weekday: 'long', timeZone: 'America/Sao_Paulo' };
    const diaHojeStr = new Intl.DateTimeFormat('pt-BR', optionsDia).format(agora);
    
    // Converte o nome do dia para o formato que salvamos no banco
    const mapaDias = {
        'segunda-feira': 'Segunda', 'terça-feira': 'Terça', 'quarta-feira': 'Quarta',
        'quinta-feira': 'Quinta', 'sexta-feira': 'Sexta', 'sábado': 'Sábado', 'domingo': 'Domingo'
    };
    const diaHoje = mapaDias[diaHojeStr.toLowerCase()];

    // Pega só a "hora" atual (ex: se for 14:35, ele pega "14")
    const optionsHora = { hour: '2-digit', timeZone: 'America/Sao_Paulo' };
    let horaAtual = new Intl.DateTimeFormat('pt-BR', optionsHora).format(agora);
    if(horaAtual.length === 1) horaAtual = '0' + horaAtual; // Garante que 9h fique '09'

    console.log(`🤖 Iniciando varredura... Hoje é ${diaHoje}, Hora atual: ${horaAtual}h`);

    // 2. Busca no Supabase os animes que batem com os filtros
    // Estamos usando a API direta (fetch) para não precisar instalar o supabase-js no robô
    const resposta = await fetch(`${SUPABASE_URL}/rest/v1/animes?select=*&status=eq.assistindo&notificacao_tipo=eq.discord&dia_semana=eq.${diaHoje}`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    const animes = await resposta.json();

    if (!animes || animes.length === 0) {
        console.log("Nenhum anime programado para hoje.");
        return;
    }

    // 3. Filtra apenas os animes que estão programados para a hora atual
    // Ex: se o anime está para 14:00 ou 14:30 e agora são 14h, ele manda.
    const animesDaHora = animes.filter(anime => anime.hora_notificacao.startsWith(horaAtual));

    if (animesDaHora.length === 0) {
        console.log("Animes encontrados, mas nenhum para este exato horário.");
        return;
    }

    // 4. Envia a notificação para cada anime encontrado no horário exato
    for (const anime of animesDaHora) {
        const mensagem = `🎬 **É hora de Anime!**\nChegou a hora de assistir **${anime.nome}**!\nEpisódios: ${anime.episodios_atuais} assistidos de ${anime.episodios_total || '?'}`;
        
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: mensagem,
                username: "AbyssNotifier", // Nome que vai aparecer na mensagem
                avatar_url: anime.foto_url || "https://i.imgur.com/8nLFCVP.png" // Foto do anime ou uma padrão
            })
        });
        console.log(`✅ Notificação enviada para: ${anime.nome}`);
    }
}

rodarRobo();