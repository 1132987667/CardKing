import test from 'node:test'
import assert from 'node:assert/strict'

import RuleEvaluator from '../src/utils/RuleEvaluator.js'
import Card from '../src/utils/Card.js'
import { Suit } from '../src/utils/constants.js'

test('getThreeCardType should correctly parse face-card pair rank and kicker', () => {
  const result = RuleEvaluator.getThreeCardType(
    new Card('K', Suit.SPADES),
    new Card('K', Suit.HEARTS),
    new Card('9', Suit.CLUBS),
  )

  assert.equal(result.type, 'pair')
  assert.equal(result.mainRank, 13)
  assert.equal(result.kicker, 9)
})

test('compareThreeCards should compare pair hands by pair rank first', () => {
  const kPairVsQPair = RuleEvaluator.compareThreeCards(
    new Card('K', Suit.SPADES),
    new Card('K', Suit.HEARTS),
    new Card('2', Suit.CLUBS),
    new Card('Q', Suit.SPADES),
    new Card('Q', Suit.HEARTS),
    new Card('A', Suit.DIAMONDS),
  )

  assert.equal(kPairVsQPair, 1)
})

test('calculateGroupRank should place stronger pair ahead in threecard mode', () => {
  const ranks = RuleEvaluator.calculateGroupRank(
    [
      {
        playerId: 'player-k',
        cards: [new Card('K', Suit.SPADES), new Card('K', Suit.HEARTS), new Card('2', Suit.CLUBS)],
      },
      {
        playerId: 'player-q',
        cards: [new Card('Q', Suit.SPADES), new Card('Q', Suit.HEARTS), new Card('A', Suit.DIAMONDS)],
      },
    ],
    'threecard',
  )

  assert.deepEqual(ranks, [
    { playerId: 'player-k', rank: 0 },
    { playerId: 'player-q', rank: 1 },
  ])
})
