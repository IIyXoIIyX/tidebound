# Tidebound

**Play:** https://tidebound-strategy.frostysnow1026.chatgpt.site

A dependency-free, turn-based strategy game for **humans and HTTP agents in the same match**. Two to four captains, nineteen islands, eight rounds (16–32 moves). Browser players need no account or installation; agents use the same legal moves through JSON. Empty lobby seats can be filled with built-in bots.

## Rules

Take one action each turn: **sail** to an adjacent neutral island for 3 wind, **raid** an adjacent rival for 4 plus its fort level, **fortify** your island for 2 (maximum level 3), or **gather** 4 wind. At the beginning of your turn receive 2 wind plus 1 per grove you hold, capped at 14. At the end of every round each ordinary island scores 1 and the central beacon scores 3. After eight rounds the highest score wins; tied captains share victory. Public full-state information, shared rules and a rotating turn order apply to humans and agents alike. The beacon, economy, expansion and defence create competing priorities; balance has not been established by a large human playtest.

## Play

Choose a captain name and **Play against bots**, or create a multiplayer lobby and share its match link before starting. Join by the 12-character code. The host starts and may fill vacant seats with bots. Click an island and choose an available order. Wind and scores update after each move. Finished games have a replay slider and full voyage log. An active browser automatically skips an idle captain after 15 seconds; API clients can also call the timeout endpoint. The skipped captain gathers wind. With a browser connected and polling, a full four-seat match is bounded to roughly eight to ten minutes; a match without any connected client does not advance on its own. Inactive matches expire after 24 hours. Match codes expose public game state; player tokens are private capabilities saved in that browser's local storage. Do not share your token.

## Run locally

Node.js 20+; no dependencies:

```sh
node server.mjs
# open http://localhost:8787
node --test tests/game.test.mjs
```

The local adapter persists matches as JSON under `.local-games/` and serializes writes per match. It is intended for development; do not expose it directly as a production service. The hosted Cloudflare Worker uses an R2 bucket with conditional ETag writes, so racing moves cannot overwrite each other. The first successful state change wins; the other receives 409 and must re-read state. `/health` checks the handler and storage binding, not the entire storage service.

## Agent API

`GET /api/docs` gives the machine-readable contract. Amounts are integer wind/points. Responses are public state except create/join, which return a private token to the caller. JSON writes are bounded to 4096 characters. Errors are JSON. Send `Content-Type: application/json`.

1. `POST /api/games` with `{"name":"Agent","seats":2}` returns `{player,token,game}`; alternatively join an existing lobby with `POST /api/games/CODE/join` and `{"name":"Agent"}`.
2. Host only: `POST /api/games/CODE/start` with `{"version":CURRENT_VERSION,"fillBots":true}` and `Authorization: Bearer TOKEN`.
3. `GET /api/games/CODE` returns `phase`, `turn`, `version`, players, tiles, log, replay `history`, and `legalMoves` for the current captain. It contains no token/hash.
4. On your turn, `POST /api/games/CODE/move` with `{"version":CURRENT_VERSION,"move":{"type":"sail","tile":TILE_ID}}` and your Bearer token. Select from `legalMoves`; fortify/sail/raid require a numeric tile ID. Harvest is `{"type":"harvest"}`.
5. `409` indicates a stale state, out-of-turn request or race: fetch again and reconsider. `400` invalid move/input; `401` invalid token; `403` non-host start; `404` unknown match; `410` inactive expired match; `503` storage/service unavailable.
6. After 15 seconds without a move, authenticated players can `POST /api/games/CODE/tick` with the current version. This makes the inactive captain harvest and advances play. GET never advances the game.

Example external bot (Node 20+):

```sh
node examples/bot.mjs http://localhost:8787 YOUR_MATCH_CODE
```

It joins a lobby and waits for the host. It uses only public `legalMoves`, never privileged game state. You can create a four-seat lobby, join multiple HTTP bots, then fill remaining seats with built-in bots.

## Deployment

`worker/index.js` is a self-contained Cloudflare Worker ESM module. Bind an R2 bucket as `BUCKET`. No API keys, databases, assets, npm runtime packages or external services are required. The Workers API uses `onlyIf.etagMatches` on writes and `If-None-Match: *` on creation. Browser polling is every four seconds; this is a small-game prototype, not a large-scale service. Inactive objects are not automatically deleted: configure an R2 lifecycle retention policy when deploying your own instance. Production request rate limiting should be configured at the hosting layer.

The Sites build (`bash scripts/build.sh`, then `node scripts/validate-artifact.mjs`) embeds the complete client in the Worker. The local adapter and tests are not part of its deployment artifact.

## Validation and disclosure

Written with OpenAI Codex assistance. See the test suite for hex geometry, equal starting energy, legal/illegal actions, raid costs, scoring, immutable replay snapshots, complete 2/3/4-player matches, HTTP authorization, optimistic-concurrency races, malformed input, and a full HTTP match. Tests use a local R2 test double; they are not a substitute for hosted storage verification or human playtesting. No independent human code review or proven competitive balance is claimed.

## License

MIT. All source in this repository is original for this implementation. No third-party game art or music is included.
