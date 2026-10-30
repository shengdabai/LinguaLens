import assert from 'node:assert/strict';
import test from 'node:test';
import { componentHarness, button, text } from './helpers/component-harness.mjs';

const makeCards = () => ['甲', '乙', '丙'].map((chinese, id) => ({
  id: String(id), chinese, pinyin: 'test', english: 'fixture',
}));

test('grading a shrinking due queue reviews each original card once and completes safely', async () => {
  let cards = makeCards();
  const graded = [];
  const harness = await componentHarness('../../src/features/srs/SRSReview.tsx', 'SRSReview', {
    '../../utils/audio': { playBrowserTTS() {} },
  });
  const props = () => ({ cards, onGrade(id, grade) {
    graded.push([id, grade]);
    cards = cards.filter(card => card.id !== id);
  } });
  for (const [index, word] of ['甲', '乙', '丙'].entries()) {
    let tree = harness.render(props());
    assert.ok(text(tree).includes(word), `Card ${index + 1} must not be skipped`);
    button(tree, 'Reveal Answer')();
    tree = harness.render(props());
    button(tree, 'Good')();
  }
  const done = harness.render(props());
  assert.ok(text(done).includes('Session Complete!'));
  assert.ok(text(done).includes('Reviewed 3 cards'));
  assert.deepEqual(graded, [['0', 'good'], ['1', 'good'], ['2', 'good']]);
  button(done, 'Review Again')();
  assert.ok(text(harness.render(props())).includes('All Caught Up!'));
});

test('restart takes the current due queue and hides the answer', async () => {
  const cards = makeCards().slice(0, 1);
  const harness = await componentHarness('../../src/features/srs/SRSReview.tsx', 'SRSReview', {
    '../../utils/audio': { playBrowserTTS() {} },
  });
  const props = { cards, onGrade() {} };
  button(harness.render(props), 'Reveal Answer')();
  button(harness.render(props), 'Again')();
  const newProps = { ...props, cards: [makeCards()[1]] };
  button(harness.render(newProps), 'Review Again')();
  const tree = harness.render(newProps);
  assert.ok(text(tree).includes('乙'));
  assert.ok(text(tree).includes('Reveal Answer'));
});
