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
	}

	interface MockingSpongeBobApp {
		drawn: DrawState;
		isDarkmode: boolean;
		toggleDarkmode: () => void;
		mockTypes: Record<string, MockType | undefined>;
		currentMock: MockType;
		encodeText: (str: string) => string;
		decodeText: (str: string) => string;
		clearFields: () => void;
		resetTemplate: () => void;
		repaint: () => void;
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
