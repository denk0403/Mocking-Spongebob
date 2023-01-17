"use strict";
{
	const mockTypes = {
		cu: {
			id: "cu",
			name: "Custom Text",
			apply: (str = "") => str,
			htmlOption: document.createElement("option"),
		},
		asl: {
			id: "asl",
			name: "Alternating: starting lower",
			apply: (str = "") => {
				let result = "";
				let lower = true;
				for (let c of str) {
					result += lower ? c.toLowerCase() : c.toUpperCase();
					if (c.match(/[a-z]/i)) lower = !lower;
				}
				return result;
			},
			htmlOption: document.createElement("option"),
		},
		asu: {
			id: "asu",
			name: "Alternating: starting upper",
			apply: (str = "") => {
				let result = "";
				let lower = false;
				for (let c of str) {
					result += lower ? c.toLowerCase() : c.toUpperCase();
					if (c.match(/[a-z]/i)) lower = !lower;
				}
				return result;
			},
			htmlOption: document.createElement("option"),
		},
		au: {
			id: "au",
			name: "All Upper",
			apply: (str = "") => str.toUpperCase(),
			htmlOption: document.createElement("option"),
		},
		al: {
			id: "al",
			name: "All Lower",
			apply: (str = "") => str.toLowerCase(),
			htmlOption: document.createElement("option"),
		},
		awsu: {
			id: "awsu",
			name: "Alternating: words start upper",
			apply: (str = "") => {
				return str
					.split(" ")
					.map((str) => mockTypes.asu.apply(str))
					.join(" ");
			},
			htmlOption: document.createElement("option"),
		},
		awsl: {
			id: "awsl",
			name: "Alternating: words start lower",
			apply: (str = "") => {
				return str
					.split(" ")
					.map((str) => mockTypes.asl.apply(str))
					.join(" ");
			},
			htmlOption: document.createElement("option"),
		},
		ar: {
			id: "ar",
			name: "All Random",
			apply: (str = "") => {
				let result = "";
				let lower = Math.random() < 0.5;
				for (let c of str) {
					result += lower ? c.toLowerCase() : c.toUpperCase();
					if (c.match(/[a-z]/i)) lower = Math.random() < 0.5;
				}
				return result;
			},
			htmlOption: document.createElement("option"),
		},
		rsu: {
			id: "rsu",
			name: "Random: starting upper",
			apply: (str = "") => {
				let result = "";
				let lower = false;
				for (let c of str) {
					result += lower ? c.toLowerCase() : c.toUpperCase();
					if (c.match(/[a-z]/i)) lower = Math.random() < 0.5;
				}
				return result;
			},
			htmlOption: document.createElement("option"),
		},
		rsl: {
			id: "rsl",
			name: "Random: starting lower",
			apply: (str = "") => {
				let result = "";
				let lower = true;
				for (let c of str) {
					result += lower ? c.toLowerCase() : c.toUpperCase();
					if (c.match(/[a-z]/i)) lower = Math.random() < 0.5;
				}
				return result;
			},
			htmlOption: document.createElement("option"),
		},
		rwsu: {
			id: "rwsu",
			name: "Random: words start upper",
			apply: (str = "") => {
				return str
					.split(" ")
					.map((str) => {
						return mockTypes.rsu.apply(str);
					})
					.join(" ");
			},
			htmlOption: document.createElement("option"),
		},
		rwsl: {
			id: "rwsl",
			name: "Random: words start lower",
			apply: (str = "") => {
				return str
					.split(" ")
					.map((str) => mockTypes.rsl.apply(str))
					.join(" ");
			},
			htmlOption: document.createElement("option"),
		},
	};
	mockingSpongebob.mockTypes = mockTypes;

	const mockSelector = document.getElementById("mockType-selector");
	mockSelector.innerHTML = "";

	Object.entries(mockTypes).forEach(([key, mockType]) => {
		const option = mockType.htmlOption;
		option.id = key;
		option.value = key;
		option.innerText = mockType.name;
	});

	Object.values(mockTypes)
		.sort((mock1, mock2) => mock1.name.localeCompare(mock2.name))
		.forEach((mock) => mockSelector.appendChild(mock.htmlOption));

	mockingSpongebob.currentMock = mockTypes.asl;
	mockTypes.asl.htmlOption.selected = true;

	mockSelector.addEventListener("input", (event) => {
		mockingSpongebob.currentMock = mockTypes[event.currentTarget.value];
	});
}
