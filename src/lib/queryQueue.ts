/**
 * Query Queue Utility
 * Ensures database queries are executed sequentially to avoid race conditions
 * and reduce unnecessary load on the database
 */

type QueryTask<T> = () => Promise<T>;

class QueryQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  /**
   * Add a query to the queue
   * @param task The async function to execute
   * @returns Promise that resolves with the query result
   */
  async enqueue<T>(task: QueryTask<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued queries sequentially
   */
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          console.error('Query queue error:', error);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get current queue length
   */
  get length(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is currently processing
   */
  get processing(): boolean {
    return this.isProcessing;
  }
}

// Export singleton instance
export const queryQueue = new QueryQueue();

/**
 * Utility function to queue a database query
 * @param queryFn The query function to execute
 * @returns Promise with query result
 */
export async function queueQuery<T>(queryFn: QueryTask<T>): Promise<T> {
  return queryQueue.enqueue(queryFn);
}
