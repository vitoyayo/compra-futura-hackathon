const maxQueue = Infinity;
let maxConcurrentTasks = 10;
let pendingTasks = 0;
const queue = [];

const processQueue = function () {
  if (pendingTasks >= maxConcurrentTasks) {
    return false;
  }

  const queueItem = queue.shift();
  if (!queueItem) {
    return false;
  }

  pendingTasks++;

  queueItem
    .task()
    .then((result) => {
      pendingTasks--;
      queueItem.resolve(result);
      processQueue();
    })
    .catch((err) => {
      pendingTasks--;
      queueItem.reject(err);
      processQueue();
    });
  return true;
};

module.exports = {
  setMaxConcurrentTasks(amount) {
    if (pendingTasks === 0) maxConcurrentTasks = amount;
  },
  addTask(task) {
    return new Promise(
      /* eslint-disable consistent-return */
      (resolve, reject) => {
        if (queue.length >= maxQueue) {
          return reject(new Error('Queue limit reached'));
        }

        queue.push({
          task: task,
          resolve: resolve,
          reject: reject,
        });

        processQueue();
      }
    );
    /* eslint-enable consistent-return */
  },
  getTotalQueueLength() {
    return pendingTasks + queue.length;
  },
};
