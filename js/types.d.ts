export {};

declare global {
	interface MockType {
		id: string;
		name: string;
		apply: (str?: string) => string;
		htmlOption: HTMLOptionElement;
	}

	const mockingSpongebob: {
		isDarkmode: boolean;
		toggleDarkmode: () => void;
		mockTypes: Record<string, MockType | undefined>;
		currentMock: MockType;
		encodeText: (str: string) => string;
		decodeText: (str: string) => string;
		clearFields: () => void;
		clearImage: () => void;
		clear: () => void;
		repaint: () => void;
		cameraStop: () => void;
		recognition: SpeechRecognition?;
	};
}
