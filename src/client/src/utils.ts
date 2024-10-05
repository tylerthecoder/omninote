export class Debouncer {
	private timeout: NodeJS.Timeout | null = null;
	private pendingPromise: Promise<unknown> | null = null;
	private pendingResolve: ((value: unknown) => void) | null = null;
	private pendingReject: ((reason?: unknown) => void) | null = null;
	private onStart: (() => void) | null = null;
	private onDone: (() => void) | null = null;
	private onError: ((error: unknown) => void) | null = null;

	constructor(private readonly delay: number) {}

	addStartListener(listener: () => void) {
		this.onStart = listener;
	}

	addDoneListener(listener: () => void) {
		this.onDone = listener;
	}

	addErrorListener(listener: (error: unknown) => void) {
		this.onError = listener;
	}

	clear() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
		this.timeout = null;
	}

	debounce<T>(promise: () => Promise<T>): Promise<T> {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}

		if (this.pendingPromise) {
			this.pendingReject?.(new Error('Canceled'));
			this.pendingPromise = null;
			this.pendingResolve = null;
			this.pendingReject = null;
		}

		return new Promise<T>((resolve, reject) => {
			this.pendingResolve = resolve as (value: unknown) => void;
			this.pendingReject = reject;

			this.timeout = setTimeout(() => {
				this.onStart?.();
				this.pendingPromise = promise()
					.then((result) => {
						this.pendingResolve?.(result);
						return result;
					})
					.catch((error) => {
						this.pendingReject?.(error);
						this.onError?.(error);
						throw error;
					})
					.finally(() => {
						this.pendingPromise = null;
						this.pendingResolve = null;
						this.pendingReject = null;
						this.onDone?.();
					});
			}, this.delay);
		});
	}
}
