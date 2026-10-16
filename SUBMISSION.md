# Tidebound — strategy for human and AI captains

**Play:** https://tidebound-strategy.frostysnow1026.chatgpt.site

**Public source:** https://github.com/IIyXoIIyX/tidebound

**API reference:** https://tidebound-strategy.frostysnow1026.chatgpt.site/api/docs

## Pitch

Tidebound is a nineteen-island strategy game where human captains and HTTP agents can share the same two-to-four-player match. Spend scarce wind to expand, raid, defend or harvest; the central beacon is lucrative but exposed, and groves trade immediate territory for future wind. Eight rounds, persistent multiplayer lobbies, automatic empty-seat bots and a full replay keep the scope small and the decisions visible.

## Rules

One action per turn: sail to an adjacent neutral island for 3 wind; raid an adjacent enemy for 4 plus its fort level; fortify your island for 2 (up to level3); or harvest4 wind. Your turn starts with2 wind plus1 per owned grove, capped at14. At each round end, the beacon scores3 and all other owned islands1. Highest score after8 rounds wins; ties share victory. Idle turns gather wind after15 seconds when a connected browser or API client calls the timeout endpoint. With browser polling, a match is designed to fit roughly8-10 minutes, usually less; a match with no connected client does not advance itself.

## Play-test against a bot

1. Open the public URL without signing in.
2. Choose2-4 captains and click **Play against bots**.
3. Select an adjacent island on the board, then choose an available order in Captain's orders. Gather wind whenever you need resources.
4. Continue for8 rounds; use the replay slider after the result.

For human multiplayer, create a lobby, copy its link, let others join, then start. Remaining vacant seats become bots. Anyone knowing the match code can read the board; only each player's private Bearer token can make their moves.

## Agent entry

Create a lobby in the browser. In Node20+:

```sh
git clone https://github.com/IIyXoIIyX/tidebound.git
cd tidebound
node examples/bot.mjs https://tidebound-strategy.frostysnow1026.chatgpt.site MATCH_CODE
```

The example bot joins and waits for the browser host to start. It reads public state and legalMoves through GET, then submits JSON using its private player token. There are no privileged bot-only APIs. See README and `/api/docs` for the complete HTTP contract.

## Verification actually performed

- Node24.19.0: `node --test tests/game.test.mjs`:11 passing tests.
- Complete2/3/4-player engine matches, scoring, start-energy equality, illegal-move rejection, immutable replay, HTTP authorization, out-of-turn and stale-version protection, concurrent write conflict, malformed input, 15-second timeout, and a complete HTTP match.
- Hosted Worker `/health` returned `{ok:true,game:"Tidebound",storage:true}`.
- A real hosted four-seat R2-backed match completed: code `FC29C9F6161C`,8 human turns,33 replay positions, finished state, version33. Public output contained no player token hashes.
- Browser client JavaScript parsed with `node --check`; deployment artifact validated as Worker ESM.

No independent human review, rendered-browser QA or large-scale balance testing is claimed. The built-in bot uses an openly documented heuristic. This is a small original game, not a proven competitive ruleset. The public repository is MIT-licensed and was written with OpenAI Codex assistance. No third-party art, music or runtime dependencies are included.
