import { addGlobalEventProcessor, getCurrentHub } from '@sentry/core';
import { Integration, SentryEvent, StackFrame } from '@sentry/types';

/** Add node transaction to the event */
export class Transaction implements Integration {
  /**
   * @inheritDoc
   */
  public name: string = Transaction.id;
  /**
   * @inheritDoc
   */
  public static id: string = 'Transaction';

  /**
   * @inheritDoc
   */
  public setupOnce(): void {
    addGlobalEventProcessor(async event => {
      const self = getCurrentHub().getIntegration(Transaction);
      if (self) {
        return self.process(event);
      }
      return event;
    });
  }

  /**
   * @inheritDoc
   */
  public async process(event: SentryEvent): Promise<SentryEvent> {
    const frames = this.getFramesFromEvent(event);

    // use for loop so we don't have to reverse whole frames array
    for (let i = frames.length - 1; i >= 0; i--) {
      const frame = frames[i];

      if (frame.in_app === true) {
        event.transaction = this.getTransaction(frame);
        break;
      }
    }

    return event;
  }

  /** JSDoc */
  private getFramesFromEvent(event: SentryEvent): StackFrame[] {
    const exception = event.exception && event.exception.values && event.exception.values[0];
    return (exception && exception.stacktrace && exception.stacktrace.frames) || [];
  }

  /** JSDoc */
  private getTransaction(frame: StackFrame): string {
    return frame.module || frame.function ? `${frame.module || '?'}/${frame.function || '?'}` : '<unknown>';
  }
}
