# Processo de atualização dos dados

Sempre que for solicitada uma atualização do RANKING BG, usar exclusivamente a planilha oficial:

https://docs.google.com/spreadsheets/d/12WU3GH6SdVNiTok_I_TUcaMQWcHf3YYuD5qFHl9W_UE/htmlview

## Etapas

1. Baixar a versão atual pelo endpoint de exportação XLSX do mesmo identificador:

   `https://docs.google.com/spreadsheets/d/12WU3GH6SdVNiTok_I_TUcaMQWcHf3YYuD5qFHl9W_UE/export?format=xlsx`

2. Salvar o arquivo em `/home/ubuntu/tenis-ranking/ranking.xlsx`.

3. Executar os scripts existentes `inspect_sheet.py` e `extract_cells.py` para gerar `sheet_report.txt` e `cells_report.txt`.

4. Ler as células preenchidas da aba `3° CLASSE`, identificar os grupos, jogadores, rodadas, confrontos, placares, BYEs e partidas pendentes.

5. Atualizar o array `rawGroups` em `src/main.jsx`, preservando os dados reais. Normalizar somente diferenças evidentes de grafia, como `Mathues Klaus` para `Matheus Klaus`, `Feilipe de Cont` para `Filipe de Conto`, `Marcelo da Siva Ros` para `Marcelo da Silva Ros` e `Leonardo Ravanelo` para `Leonardo Ravanello`.

6. Considerar uma partida como finalizada somente quando houver placar preenchido e vencedor definido. Placar `0 x 0` sem vencedor permanece pendente; BYE sem resultado permanece como folga.

7. Executar `pnpm run build`, revisar o ranking e publicar a alteração na branch `master`. O workflow `Deploy RANKING BG` atualiza o GitHub Pages automaticamente.

## Regras do ranking

A vitória vale 3 pontos. Os critérios de desempate, na ordem, são: saldo de vitórias; confronto direto; saldo de sets; saldo de games. O saldo de games é calculado como games ganhos menos games perdidos. O match tiebreak, identificado por um placar como `10 x 5` ou `10 x 8`, conta como 1 game para o saldo de games e não altera o saldo de sets.
