"use strict";
(() => {
	mockingSpongebob.mockTypes = {
		cu: {
			id: "cu",
			name: "Custom Text",
			apply: (str = "") => str,
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
		},
		au: {
			id: "au",
			name: "All Upper",
			apply: (str = "") => str.toUpperCase(),
		},
		al: {
			id: "al",
			name: "All Lower",
			apply: (str = "") => str.toLowerCase(),
		},
		awsu: {
			id: "awsu",
			name: "Alternating: words start upper",
			apply: (str = "") => {
				return str
					.split(" ")
					.map((str) => mockingSpongebob.mockTypes.asu.apply(str))
					.join(" ");
			},
		},
		awsl: {
			id: "awsl",
			name: "Alternating: words start lower",
			apply: (str = "") => {
				return str
					.split(" ")
					.map((str) => mockingSpongebob.mockTypes.asl.apply(str))
					.join(" ");
			},
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
		},
		rwsu: {
			id: "rwsu",
			name: "Random: words start upper",
			apply: (str = "") => {
				return str
					.split(" ")
					.map((str) => {
						return mockingSpongebob.mockTypes.rsu.apply(str);
					})
					.join(" ");
			},
		},
		rwsl: {
			id: "rwsl",
			name: "Random: words start lower",
			apply: (str = "") => {
				return str
					.split(" ")
					.map((str) => mockingSpongebob.mockTypes.rsl.apply(str))
					.join(" ");
			},
		},
	};

	const mockSelector = document.getElementById("mockType-selector");

	mockSelector.innerHTML = "";

	Object.keys(mockingSpongebob.mockTypes)
		.map((key) => {
			const option = document.createElement("option");
			option.id = key;
			option.value = key;
			option.innerText = mockingSpongebob.mockTypes[key].name;
			return option;
		})
		.sort((opt1, opt2) => {
			const compare = opt1.innerText.length - opt2.innerText.length;
			return compare !== 0 ? compare : opt1.innerText.localeCompare(opt2.innerText);
		})
		.forEach((option) => mockSelector.appendChild(option));

	mockingSpongebob.currentMock = mockingSpongebob.mockTypes.asl;
	document.getElementById("asl").selected = true;

	mockSelector.addEventListener("input", (event) => {
		mockingSpongebob.currentMock = mockingSpongebob.mockTypes[event.currentTarget.value];
	});
})();
