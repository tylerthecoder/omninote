export type DebouncerStatus = 'not-synced' | 'synced' | 'syncing' | 'error';

type StatusChangeListener = (status: DebouncerStatus) => void;

export class Debouncer {
	private timeouts: Map<string, NodeJS.Timeout> = new Map();
	private promises: Map<string, Promise<unknown>> = new Map();
	private status: DebouncerStatus = 'synced';
	private statusChangeListeners: StatusChangeListener[] = [];

	constructor(private readonly delay: number) { }

	addStatusChangeListener(listener: StatusChangeListener) {
		this.statusChangeListeners.push(listener);
	}

	private setStatus(newStatus: DebouncerStatus) {
		if (this.status !== newStatus) {
			this.status = newStatus;
			this.statusChangeListeners.forEach(listener => listener(newStatus));
		}
	}

	private updateStatus() {
		if (this.promises.size > 0) {
			this.setStatus('syncing');
		} else {
			this.setStatus('synced');
		}
	}

	debounce<T>(key: string, promiseFactory: () => Promise<T>): Promise<T> {
		this.setStatus('not-synced');

		// Clear existing timeout for this key
		if (this.timeouts.has(key)) {
			clearTimeout(this.timeouts.get(key)!);
		}

		// Create a new promise for this key
		const promise = new Promise<T>((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.updateStatus();
				promiseFactory()
					.then(result => {
						resolve(result);
					})
					.catch(error => {
						this.setStatus('error');
						reject(error);
					})
					.finally(() => {
						this.timeouts.delete(key);
						this.promises.delete(key);
						this.updateStatus();
					});
			}, this.delay);

			this.timeouts.set(key, timeout);
		});

		this.promises.set(key, promise);
		this.updateStatus();

		return promise as Promise<T>;
	}

	getStatus(): DebouncerStatus {
		return this.status;
	}

	clear() {
		this.timeouts.forEach(clearTimeout);
		this.timeouts.clear();
		this.promises.clear();
		this.setStatus('synced');
	}
}
