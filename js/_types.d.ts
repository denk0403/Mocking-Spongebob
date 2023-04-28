export {};

declare global {
	const MathJax: {
		tex2svgPromise(str: string, options: any): Promise<Document>;
	};

	interface MockType {
		id: string;
		name: string;
		apply: (str?: string) => string;
		htmlOption: HTMLOptionElement;
	}

	interface DrawState {
		mode: string;
		text: string;
		color: string;
		isErrored: boolean;
	}

	interface Demo {
		LoremIpsumText: string;
		isRunning(): void;
		stopTimer(): void;
		time(str: string): void;
		timeType(str: string): number;
		typeEach(str: string, time: number): number;
		typeIn(str: string, time: number): number;
		error(): void;
		createVideo(str: string, time: number): void;
	}

	interface MockingSpongeBobApp {
		drawn: DrawState;
		isDarkmode: boolean;
		toggleDarkmode: () => void;
		mockTypes: Record<string, MockType | undefined>;
		currentMock: MockType;
		/** Encodes an arbitrary string to be used in a shareable URL. */
		encodeText: (str: string) => string;
		/** Decodes an arbitrary string used in a shareable URL. */
		decodeText: (str: string) => string;
		clearFields: () => void;
		/** Resets mirror to the default image. */
		resetTemplate: () => void;
		/** Requests a repaint of the mirror image. */
		requestRepaint: () => void;
		/** Async method for awaiting the next repaint. */
		nextRepaint: (signal: AbortSignal?) => Promise<void>;
		cameraStop: (() => void)?;
		recognition: SpeechRecognition?;
		stopAsyncProcesses: () => void;
		demo: Demo;
	}

	const mockingSpongeBob: MockingSpongeBobApp;

	interface SpeechRecognition extends EventTarget {
		lang: string;
		continuous: boolean;
		interimResults: boolean;
		maxAlternatives: number;
		abort(): void;
		start(): void;
		stop(): void;
	}

	interface SpeechRecognitionEvent extends Event {
		resultIndex: number;
		results: SpeechRecognitionResultList;
	}
}
