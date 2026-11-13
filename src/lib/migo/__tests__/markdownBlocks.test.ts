import { test, expect } from 'vitest';
import { parseMarkdown, plainTitle } from '../markdownBlocks';

const diet = `[METER:8/10:Diet Quality Score]

| Meal | Items (qty) | Calories | Protein |
| :--- | :--- | :--- | :--- |
| Breakfast | Paneer bhurji with 1 whole wheat roti, Side cucumber-tomato salad | 350 | 18g |
| Lunch | Moong dal tadka (1 bowl), Brown rice (1 cup) | 450 | 20g |

Totals: 1400kcal | 92g protein | 150g carbs | 45g fat`;

test('diet plan: meter, table rows and totals become structured blocks', () => {
  const blocks = parseMarkdown(diet);
  expect(blocks[0]).toEqual({ kind: 'meter', value: 8, max: 10, label: 'Diet Quality Score' });
  const table = blocks.find(b => b.kind === 'table');
  expect(table).toEqual({
    kind: 'table',
    headers: ['Meal', 'Items (qty)', 'Calories', 'Protein'],
    rows: [
      ['Breakfast', 'Paneer bhurji with 1 whole wheat roti, Side cucumber-tomato salad', '350', '18g'],
      ['Lunch', 'Moong dal tadka (1 bowl), Brown rice (1 cup)', '450', '20g'],
    ],
  });
  expect(blocks[blocks.length - 1]).toEqual({ kind: 'stats', label: 'Totals', items: ['1400kcal', '92g protein', '150g carbs', '45g fat'] });
  expect(JSON.stringify(blocks)).not.toContain(':---');
});

test('images, headings, lists and plain paragraphs', () => {
  const blocks = parseMarkdown('## Warm up\n- Arm circles\n2. Squats\n![Squat](https://x.dev/squat.gif)\nKeep your back straight.');
  expect(blocks.map(b => b.kind)).toEqual(['heading', 'bullet', 'bullet', 'image', 'paragraph']);
  expect(blocks[3]).toEqual({ kind: 'image', alt: 'Squat', url: 'https://x.dev/squat.gif' });
});

test('a meter inline with text keeps the text', () => {
  expect(parseMarkdown('[METER:7/10:Workout Intensity] **Full body**')).toEqual([
    { kind: 'meter', value: 7, max: 10, label: 'Workout Intensity' },
    { kind: 'paragraph', text: '**Full body**' },
  ]);
});

test('plan titles never show table headers or meter tags', () => {
  expect(plainTitle('| Meal | Items (qty) | Calories | Protein |')).toBeNull();
  expect(plainTitle('[METER:7/10:Workout Intensity]\n**Full Body Fat-Loss Starter - 25 min**')).toBe('Full Body Fat-Loss Starter - 25 min');
  expect(plainTitle('Leg day')).toBe('Leg day');
});

test('quote lines become one quote block', () => {
  expect(parseMarkdown('> Keep 1–2 reps in reserve\n> on every set.\nDone')).toEqual([
    { kind: 'quote', text: 'Keep 1–2 reps in reserve on every set.' },
    { kind: 'paragraph', text: 'Done' },
  ]);
});
