const test = require('node:test');
const assert = require('node:assert/strict');
const { detectLanguage, localize } = require('./language');

test('detects Portuguese text', () => {
  assert.equal(detectLanguage('Este é um projeto para a comunidade, com uma documentação que também está em português.'), 'pt');
});

test('detects English text', () => {
  assert.equal(detectLanguage('This is a project for the community and it is written in Go with a guide for you.'), 'en');
});

test('keeps short or mixed text unknown', () => {
  assert.equal(detectLanguage('Add project'), null);
  assert.equal(detectLanguage('the job of the company para uma vaga com'), null);
  assert.equal(detectLanguage(undefined), null);
});

test('renders one language when known, Portuguese with English folded when unknown', () => {
  const render = language => `text-${language}`;

  assert.equal(localize('en', render), 'text-en');
  assert.match(localize(null, render), /^text-pt\n\n<details><summary>English<\/summary>\n\ntext-en\n\n<\/details>$/);
});
