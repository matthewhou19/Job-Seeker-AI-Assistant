const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
const FEEDBACK_QUEUE_KEY = 'feedbackQueue';
const storage = { [FEEDBACK_QUEUE_KEY]: [] };

global.chrome = {
  storage: {
    local: {
      get: (_keys, cb) => cb({ [FEEDBACK_QUEUE_KEY]: storage[FEEDBACK_QUEUE_KEY] }),
      set: (obj, cb) => {
        storage[FEEDBACK_QUEUE_KEY] = obj[FEEDBACK_QUEUE_KEY];
        cb();
      },
    },
  },
  runtime: { onMessage: { addListener: () => {} } },
};

const {
  enqueueFeedback,
  processQueue,
  MAX_ATTEMPTS,
} = require('../src/chrome-extension-template/background.js');

test('processQueue retries and posts to /feedback', async () => {
  storage[FEEDBACK_QUEUE_KEY] = [];
  const payload = { foo: 'bar' };
  await enqueueFeedback(payload);

  const calls = [];
  let count = 0;
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    count++;
    if (count % 2 === 1) {
      return { ok: false, status: 500 };
    }
    return { ok: true, status: 200 };
  };

  await processQueue();
  assert.equal(storage[FEEDBACK_QUEUE_KEY].length, 1);
  assert.equal(storage[FEEDBACK_QUEUE_KEY][0].attempts, 1);

  storage[FEEDBACK_QUEUE_KEY][0].nextTryAt = 0;
  await processQueue();
  assert.deepEqual(storage[FEEDBACK_QUEUE_KEY], []);

  const second = calls[1];
  assert.equal(second.url, 'https://api.joblyzer.net/feedback');
  assert.equal(second.options.method, 'POST');
  assert.equal(second.options.headers['Content-Type'], 'application/json');
  assert.equal(second.options.body, JSON.stringify(payload));
});

test('processQueue drops item after MAX_ATTEMPTS failures', async () => {
  storage[FEEDBACK_QUEUE_KEY] = [{ payload: { id: 1 }, attempts: 0, nextTryAt: 0 }];
  global.fetch = async () => ({ ok: false, status: 500 });

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await processQueue();
    if (i < MAX_ATTEMPTS - 1) {
      assert.equal(storage[FEEDBACK_QUEUE_KEY].length, 1);
      assert.equal(storage[FEEDBACK_QUEUE_KEY][0].attempts, i + 1);
      storage[FEEDBACK_QUEUE_KEY][0].nextTryAt = 0;
    } else {
      assert.deepEqual(storage[FEEDBACK_QUEUE_KEY], []);
    }
  }
});
