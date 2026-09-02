# Processo de atualização dos dados

Sempre que for solicitada uma atualização do RANKING BG, usar exclusivamente a planilha oficial:

https://docs.google.com/spreadsheets/d/12WU3GH6SdVNiTok_I_TUcaMQWcHf3YYuD5qFHl9W_UE/htmlview

## Fluxo atualizado

1. Baixar a versão atual pelo endpoint de exportação XLSX:

   `https://docs.google.com/spreadsheets/d/12WU3GH6SdVNiTok_I_TUcaMQWcHf3YYuD5qFHl9W_UE/export?format=xlsx`

2. Salvar o arquivo em `/home/ubuntu/tenis-ranking/ranking.xlsx`.

3. Executar `pnpm run update:data` dentro do projeto. Esse comando roda `tools/generate_ranking_json.py`, lê a aba `3° CLASSE`, normaliza jogadores e confrontos e gera `public/data/ranking.json`.

4. O site carrega exclusivamente `data/ranking.json`. Os componentes visuais não devem conter placares ou jogadores hardcoded.

5. O JSON registra `updatedAt`, `sourceUrl`, `rounds` e `groups`. A data `updatedAt` é exibida no cabeçalho e no rodapé do site.

## Identificação do vencedor

A planilha não deve ser interpretada pela posição do nome antes ou depois do `×`. O extrator abre o XLSX com rich text habilitado e identifica o vencedor pela formatação verde e negrito. O Google Sheets pode exportar essa formatação de duas maneiras: diretamente no trecho do nome vencedor ou como um trecho verde/negrito em branco imediatamente antes do nome. O script trata os dois casos.

Diferenças evidentes de grafia são normalizadas, incluindo `BEY` para `BYE`, `Mathues Klaus` para `Matheus Klaus`, `Feilipe de Cont` para `Filipe de Conto`, `Marcelo da Siva Ros` para `Marcelo da Silva Ros`, `Leonardo Ravanelo` para `Leonardo Ravanello` e `Rafael Ravanello]` para `Rafael Ravanello`.

Uma partida só é finalizada quando há placar com algum valor diferente de zero e um vencedor identificado visualmente. Placares `0 x 0` permanecem pendentes; partidas com `BYE` são exibidas como folga. O extrator remove o `0 x 0` final usado como preenchimento quando existem sets reais e mantém os sets no formato consumido pelo site.

## Regras do ranking

A vitória vale 3 pontos. Os critérios de desempate, na ordem, são: saldo de vitórias; confronto direto; saldo de sets; saldo de games. O saldo de games é calculado como games ganhos menos games perdidos. O match tiebreak, identificado por um placar como `10 x 5` ou `10 x 8`, conta como 1 game para o saldo de games e não altera o saldo de sets.

## Publicação

Depois de gerar o JSON, executar `pnpm run build`, revisar o ranking e publicar a alteração na branch `master`. O workflow `Deploy RANKING BG` atualiza o GitHub Pages automaticamente. O bundle visual só precisa ser reconstruído quando houver mudança de código; atualizações futuras de dados alteram principalmente `public/data/ranking.json`.
