import json
from pathlib import Path

path = Path(__file__).resolve().parent / 'public/data/ranking.json'
data = json.loads(path.read_text(encoding='utf-8'))
assert data['schemaVersion'] == 1
assert data['sourceUrl'].startswith('https://docs.google.com/spreadsheets/')
assert data['updatedAt']
assert len(data['rounds']) == 9
assert len(data['groups']) == 2

finals = []
for group in data['groups']:
    assert len(group['players']) == 9
    for round_id, matches in group['matches'].items():
        for match in matches:
            assert match['a'] and match['b']
            if match['status'] == 'final':
                assert match.get('winner') not in (None, 'BYE')
                assert match['a'] == match['winner']
                assert match.get('score')
                finals.append((group['name'], round_id, match['a'], match['b'], match['score'], match['winner']))
            elif match['status'] == 'scheduled':
                assert not match.get('winner')
            elif match['status'] == 'bye':
                assert 'BYE' in (match['a'], match['b'])

print(f"updatedAt={data['updatedAt']}")
print(f"groups={len(data['groups'])} players={sum(len(group['players']) for group in data['groups'])}")
print(f"final_matches={len(finals)}")
for item in finals:
    print(' | '.join(item))
