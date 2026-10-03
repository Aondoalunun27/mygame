# Game Design

## Core Loop

Every level is a 4×4 sliding photo puzzle. Fifteen buttons display cropped pieces of a football player's photograph; the sixteenth cell is visibly empty. A move slides one piece into that empty cell only when the two cells share an edge. The intact, uncropped reference photo and player's name stay above the board. The solved order reads left-to-right, top-to-bottom, with the empty cell in the lower-right corner.

The 100-level campaign uses a different player photo on every level, with no repeats. The local photo crops use numbered positions internally but do not print numbers over the image tiles.

## Guaranteed Solutions and Difficulty

`js/levelGenerator.js` starts from the solved board and applies a seeded series of legal slides. It records the previous empty-space locations, then reverses that sequence to create a valid solution and hint path. Thus every board is reachable from the goal; no arbitrary tile permutation or parity error can create an impossible puzzle. The grid remains 4×4 at every level. The 100-level campaign has three difficulty bands with longer scrambles: 3–8 moves (easy, levels 1–15), 9–16 (medium, levels 16–29), and 17–30 (hard, levels 30–100).

When a player makes a move outside the suggested solution path, the engine prepends its inverse move. The hints therefore remain valid after experimentation without running an expensive 15-puzzle search.

## Progress and Scoring

First completion unlocks the next level and gives 15 coins. Earning three stars for the first time gives a 10-coin bonus. Replays can improve the saved best score and stars but do not repeat completion coins. Scores start at 1000 plus a small level bonus and lose points for moves beyond par, elapsed time, and hints. Scores cannot be negative. Three stars require a near-par solution without hints; two stars allow some extra moves and up to two hints.

## Hints and Lives

Highlight (20 coins) identifies the next tile to slide. Reveal (30 coins) marks one piece and its correct board coordinate. Auto-slide (50 coins) performs the next move on the stored solution. A rewarded-ad hint is granted only when the AdMob rewarded callback confirms completion. Restarting consumes a life; lives regenerate every 30 minutes up to five. Leaving a puzzle does not consume a life.

## Daily Puzzle

The local calendar date seeds one daily photo puzzle. Completing it grants a once-per-date reward, with a local seven-day reward cycle. The player image and scramble are deterministic for that date. No backend or account is needed. The system clock is the source of the date and can be changed by the device owner.