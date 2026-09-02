import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronRight, Activity, Medal } from 'lucide-react';
import './styles.css';

const avatarColors = ['#d8f36a', '#ffb86b', '#b7a1ff', '#7dd3c7', '#f19bc0', '#94bfff'];
const initials = (name) => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const formatUpdatedAt = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
};
const parseScore = (score = '') => clean(score).split('·').map((set) => set.trim()).filter(Boolean).map((set) => {
  const [a, b] = set.split('–').map(Number);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const isTiebreak = a >= 10 || b >= 10;
  return { a: isTiebreak ? (a > b ? 1 : 0) : a, b: isTiebreak ? (b > a ? 1 : 0) : b, isTiebreak };
}).filter(Boolean);

function buildRanking(groups) {
  const rows = [];
  groups.forEach((group) => {
    group.players.forEach((player) => rows.push({ name: player, group: group.name, wins: 0, losses: 0, points: 0, played: 0, setsWon: 0, setsLost: 0, gamesFor: 0, gamesAgainst: 0, gameDiff: 0, winDiff: 0, h2h: {} }));
    Object.values(group.matches || {}).forEach((matches) => matches.forEach((match) => {
      if (match.status !== 'final' || !match.winner || match.a === 'BYE' || match.b === 'BYE') return;
      const a = rows.find((row) => row.name === match.a);
      const b = rows.find((row) => row.name === match.b);
      if (!a || !b) return;
      const loser = match.winner === match.a ? b : a;
      const winner = match.winner === match.a ? a : b;
      winner.wins += 1; winner.points += 3; winner.played += 1;
      loser.losses += 1; loser.played += 1;
      parseScore(match.score).forEach(({ a: aGames, b: bGames, isTiebreak }) => {
        a.gamesFor += aGames; a.gamesAgainst += bGames;
        b.gamesFor += bGames; b.gamesAgainst += aGames;
        if (!isTiebreak) {
          if (aGames > bGames) { a.setsWon += 1; b.setsLost += 1; } else if (bGames > aGames) { b.setsWon += 1; a.setsLost += 1; }
        }
      });
      winner.h2h[loser.name] = (winner.h2h[loser.name] || 0) + 1;
    }));
  });
  rows.forEach((row) => { row.gameDiff = row.gamesFor - row.gamesAgainst; row.winDiff = row.wins - row.losses; });
  return rows.sort((a, b) => b.points - a.points || b.winDiff - a.winDiff || ((b.h2h[a.name] || 0) - (a.h2h[b.name] || 0)) || (b.setsWon - b.setsLost) - (a.setsWon - a.setsLost) || b.gameDiff - a.gameDiff || a.name.localeCompare(b.name));
}

function PlayerPill({ name, winner }) {
  if (name === 'BYE') return <span className="bye-pill">BYE</span>;
  return <span className={winner ? 'player-name winner' : 'player-name'}>{clean(name)}</span>;
}

function MatchCard({ match }) {
  const isFinal = match.status === 'final';
  const isBye = match.status === 'bye';
  return (
    <article className={`match-card ${isFinal ? 'is-final' : ''} ${isBye ? 'is-bye' : ''}`}>
      <div className="match-topline">
        <span className={`match-status ${isFinal ? 'final' : isBye ? 'bye' : 'scheduled'}`}>{isFinal ? 'Finalizado' : isBye ? 'Folga' : 'A definir'}</span>
        {isFinal && <span className="match-points">3 pts</span>}
      </div>
      <div className="players-row">
        <div className="player-side"><span className="mini-avatar">{initials(match.a)}</span><PlayerPill name={match.a} winner={match.winner === match.a} /></div>
        <span className="versus">×</span>
        <div className="player-side right"><PlayerPill name={match.b} winner={match.winner === match.b} /><span className="mini-avatar">{initials(match.b)}</span></div>
      </div>
      <div className={`score-line ${!match.score ? 'muted-score' : ''}`}>{match.score || 'Placar pendente'}</div>
    </article>
  );
}

function App() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [activeRound, setActiveRound] = useState(1);
  const [activeGroup, setActiveGroup] = useState('Todos');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/ranking.json`, { cache: 'no-store' })
      .then((response) => { if (!response.ok) throw new Error('Não foi possível carregar os dados.'); return response.json(); })
      .then(setData)
      .catch((error) => setLoadError(error.message));
  }, []);

  const ranking = useMemo(() => data ? buildRanking(data.groups) : [], [data]);
  if (loadError) return <div className="data-state error-state">Não foi possível carregar os dados do ranking. Tente novamente em instantes.</div>;
  if (!data) return <div className="data-state">Carregando dados do ranking…</div>;

  const rounds = data.rounds;
  const currentMatches = data.groups.flatMap((group) => (group.matches?.[String(activeRound)] || []).map((match) => ({ ...match, group: group.name })));
  const completedMatches = currentMatches.filter((match) => match.status === 'final').length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Activity size={19} strokeWidth={2.6} /></div><div><div className="brand-name">RANKING <span>BG</span></div><div className="brand-caption">2º semestre · 3ª classe</div></div></div>
        <nav className="main-nav"><a className="active" href="#ranking">Ranking</a><a href="#rodadas">Rodadas</a><a href="#ranking">Grupos</a></nav>
        <div className="season-badge"><span className="live-dot" />Temporada 2026 <ChevronRight size={15} /></div>
        <div className="updated-badge"><span>Dados atualizados</span><strong>{formatUpdatedAt(data.updatedAt)}</strong></div>
      </header>

      <main className="content">
        <section className="section-block ranking-section" id="ranking">
          <div className="section-heading"><div><div className="eyebrow dark"><span className="eyebrow-line" />RANKING GERAL</div><h2>Os melhores jogadores</h2></div></div>
          <div className="ranking-layout"><div className="ranking-table"><div className="table-head"><span>#</span><span>Jogador</span><span>Grupo</span><span>J</span><span>V</span><span>SALDO GAMES</span><span>Pts</span></div>{ranking.map((row, index) => <div className={`ranking-row ${index === 0 && activeGroup === 'Todos' ? 'top-row' : ''}`} key={row.name}><span className="rank-number">{String(index + 1).padStart(2, '0')}</span><div className="table-player"><span className="table-avatar" style={{ background: avatarColors[index % avatarColors.length] }}>{initials(row.name)}</span><strong>{row.name}</strong>{index === 0 && activeGroup === 'Todos' && <Medal className="medal" size={16} />}</div><span className="group-chip">{row.group.replace('Grupo ', 'G')}</span><span>{row.played}</span><span className="wins">{row.wins}</span><span className="game-diff">{row.gameDiff > 0 ? '+' : ''}{row.gameDiff}</span><strong className="points">{row.points}</strong></div>)}</div></div>
        </section>

        <section className="section-block" id="rodadas">
          <div className="section-heading"><div><div className="eyebrow dark"><span className="eyebrow-line" />CALENDÁRIO</div><h2>Rodadas da temporada</h2></div><div className="round-summary"><span className="summary-dot" />{completedMatches} resultados nesta rodada</div></div>
          <div className="round-tabs">{rounds.map((round) => <button key={round.id} className={activeRound === round.id ? 'round-tab active' : 'round-tab'} onClick={() => setActiveRound(round.id)}><span>{String(round.id).padStart(2, '0')}</span><b>{round.label}</b><small>{round.dates}</small></button>)}</div>
          <div className="matches-header"><div><span className="eyebrow dark"><span className="eyebrow-line" />CONFRONTOS</span><h3>{rounds[activeRound - 1].label} <span>· {rounds[activeRound - 1].dates}</span></h3></div><div className="filter-tabs"><button className={activeGroup === 'Todos' ? 'active' : ''} onClick={() => setActiveGroup('Todos')}>Todos</button><button className={activeGroup === 'Grupo 1' ? 'active' : ''} onClick={() => setActiveGroup('Grupo 1')}>Grupo 1</button><button className={activeGroup === 'Grupo 2' ? 'active' : ''} onClick={() => setActiveGroup('Grupo 2')}>Grupo 2</button></div></div>
          <div className="matches-grid">{currentMatches.filter((match) => activeGroup === 'Todos' || match.group === activeGroup).map((match, index) => <MatchCard match={match} key={`${match.a}-${match.b}-${index}`} />)}</div>
        </section>
        <section className="section-block method-section">
          <div className="rules-heading"><div><div className="eyebrow dark"><span className="eyebrow-line" />CRITÉRIOS</div><h2>Como o ranking é calculado</h2></div><span className="rules-caption">Critérios de desempate</span></div>
          <div className="method-note"><strong>Vitória = 3 pontos</strong><span>1. Saldo de vitórias</span><span>2. Confronto direto</span><span>3. Saldo de sets</span><span>4. Saldo de games</span><span>Match tiebreak = 1 game</span></div>
        </section>
      </main>
      <footer><span>RANKING BG</span><span>Dados da planilha oficial · Atualizado em {formatUpdatedAt(data.updatedAt)}</span><span>3ª classe</span></footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
