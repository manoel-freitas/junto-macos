# Addendum Manu 19/11/2026 04:47 UTC-3 — IMPLEMENTAR AGORA

## Autostart + convites proativos
- Abrir no login via `tauri-plugin-autostart` (MacosLauncher::LaunchAgent; permissions `autostart:allow-enable` e `autostart:allow-is-enabled`). Ju no canto cochilando.
- MUDA regra anterior "só age em sessões que o Manu abre": agora ela convida.
- Primeiro convite ~2 min após o login. Depois: no primeiro unlock do dia, e após 15 min sem sessão — sempre só em horário de trabalho.
- Balão: "Bora começar? O que você vai terminar agora?" com Começar(1), Daqui a 15 min(2), Hoje não(3).
- Ignorar nunca é punido. Mín 45 min entre convites, máx 3/dia. Após 3 sem resposta → cochilo até o dia seguinte. "Hoje não" também silencia até o dia seguinte.
- Horário padrão: dias úteis 9–18, editável numa tela própria de ajustes. Fora do horário / reuniões / fullscreen / Focus → quieto.
- **Focus Plan B (decisão):** INFocusStatusCenter + Communication Notifications NÃO funciona de forma confiável em app pessoal ad-hoc/unsigned (capability exige perfil Apple Developer Program / Developer ID). NÃO implementar Plan A. Em vez disso: quieto usando detecção de apps de reunião + fullscreen; mute manual 1h. Documentar no README. (Calendário vem em issue futura.)
- Hotkey para silenciar Ju por 1 hora (cobre Focus não detectado). Sugestão: documentar atalho (ex. ⌥⌘M) no menu e README.

## NÃO implementar agora (só issues no GitHub, pt-BR, label enhancement):
1. Brown noise
2. Calendário Google/Apple
3. Todoist
4. Spotify

Manter: pet Ju, popover 8 telas, pin OLVT v1.2.1, PIVOT, testes. Commits Manoel Freitas <manoel.josefneto@gmail.com>. Push main.
