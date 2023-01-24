"use strict";
{
	// prettier-ignore
	/** @type {Object.<string, string | undefined>} */
	const cursedMap = {a:"aãåāàáâäąă",b:"bƄ",c:"cçĉ¢ċč",d:"dďđḍ",e:"eēêĕëėęèé",f:"fƒ",g:"gġĝğ",h:"hĥħ",i:"i!ìïĭįīîí",j:"jĵ",k:"ķk",l:"l",m:"m",n:"nñṅń",o:"oõōøòöôó",p:"p",q:"qǫ",r:"rṛŕŗř",s:"s$śṣšş",t:"tṭţŧ",u:"uūüũùûúůű",v:"v",w:"wŵω",x:"x×",y:"y¥ýÿŷ",z:"zƶžźžż",A:"AÃÅĀÀÁÂÄĂĄ",B:"BẞƁɃ",C:"CĆĈČÇĊÇ",D:"DĎḌÐ",E:"EƎĒÊĔËÈĘĖÉ£Ʃ",F:"ƑF",G:"GĠĜĢĞ",H:"HĤ",I:"IÌÏĪĬÎÍ",J:"JĴ",K:"KĶ",L:"LŁĿĽ",M:"M",N:"NÑŊŃƝ",O:"OÕŌØÒÖÔΘÓ0",P:"PƤ",Q:"QǬǪ",R:"RṚŔŖŘ",S:"S$ŚṢŠŞ",T:"TṬŤŦͲ",U:"UŪŨÜŮŰÙÛÚ",V:"V",W:"WŴƜ",X:"X",Y:"YÝŶŸ",Z:"ZƵŽŻŽŹ"};

	const mockTypes = {
		cu: {
			id: "cu",
			name: "Custom Text",
			apply: (str = "") => str,
			htmlOption: document.createElement("option"),
		},
		altsl: {
			id: "altsl",
			name: "Alternating: starting lower",
			apply: (str = "") => {
				let result = "";
				let lower = true;
				for (const ch of str) {
					result += lower ? ch.toLowerCase() : ch.toUpperCase();
					if (ch.match(/[a-z]/i)) lower = !lower;
				}
				return result;
			},
			htmlOption: document.createElement("option"),
		},
		altsu: {
			id: "altsu",
			name: "Alternating: starting upper",
			apply: (str = "") => {
				let result = "";
				let lower = false;
				for (const ch of str) {
					result += lower ? ch.toLowerCase() : ch.toUpperCase();
					if (ch.match(/[a-z]/i)) lower = !lower;
				}
				return result;
			},
			htmlOption: document.createElement("option"),
		},
		upper: {
			id: "upper",
			name: "All Upper",
			apply: (str = "") => str.toUpperCase(),
			htmlOption: document.createElement("option"),
		},
		lower: {
			id: "lower",
			name: "All Lower",
			apply: (str = "") => str.toLowerCase(),
			htmlOption: document.createElement("option"),
		},
		altwsu: {
			id: "altwsu",
			name: "Alternating: words start upper",
			apply: (str = "") => {
				return str
					.split(" ")
					.map((str) => mockTypes.altsu.apply(str))
					.join(" ");
			},
			htmlOption: document.createElement("option"),
		},
		altwsl: {
			id: "altwsl",
			name: "Alternating: words start lower",
			apply: (str = "") => {
				return str
					.split(" ")
					.map((str) => mockTypes.altsl.apply(str))
					.join(" ");
			},
			htmlOption: document.createElement("option"),
		},
		rand: {
			id: "rand",
			name: "Random",
			apply: (str = "") => {
				let result = "";
				for (const ch of str) {
					const lower = Math.random() < 0.5;
					result += lower ? ch.toLowerCase() : ch.toUpperCase();
				}
				return result;
			},
			htmlOption: document.createElement("option"),
		},
		randwsu: {
			id: "randwsu",
			name: "Random: words start upper",
			apply: (str = "") => {
				return str
					.split(" ")
					.map((str) => {
						let result = "";
						let lower = false;
						for (const ch of str) {
							result += lower ? ch.toLowerCase() : ch.toUpperCase();
							lower = Math.random() < 0.5;
						}
						return result;
					})
					.join(" ");
			},
			htmlOption: document.createElement("option"),
		},
		randwsl: {
			id: "randwsl",
			name: "Random: words start lower",
			apply: (str = "") => {
				return str
					.split(" ")
					.map((str) => {
						let result = "";
						let lower = true;
						for (const ch of str) {
							result += lower ? ch.toLowerCase() : ch.toUpperCase();
							lower = Math.random() < 0.5;
						}
						return result;
					})
					.join(" ");
			},
			htmlOption: document.createElement("option"),
		},
		cursed: {
			id: "cursed",
			name: "Cursed",
			apply: (str = "") => {
				let i = 0;
				const result = [];
				for (const ch of str) {
					const cursedValues = cursedMap[ch];
					if (cursedValues && cursedValues.length > 1) {
						result[i++] = cursedValues.charAt(i % cursedValues.length);
					} else {
						result[i++] = ch;
					}
				}
				return result.join("");
			},
			htmlOption: document.createElement("option"),
		},
		altcursed: {
			id: "altcursed",
			name: "Alternating: cursed",
			apply: (str = "") => {
				let lower = true;
				let i = 0;
				const result = [];
				for (const ch of str) {
					const altCh = lower ? ch.toLowerCase() : ch.toUpperCase();
					const cursedValues = cursedMap[altCh];
					if (cursedValues && cursedValues.length > 1) {
						result[i++] = cursedValues.charAt(i % cursedValues.length);
					} else {
						result[i++] = altCh;
					}

					if (ch.match(/[a-z]/i)) lower = !lower;
				}
				return result.join("");
			},
			htmlOption: document.createElement("option"),
		},
		randcursed: {
			id: "randcursed",
			name: "Random: cursed",
			apply: (str = "") => {
				let i = 0;
				const result = [];
				for (const ch of str) {
					const altCh = Math.random() < 0.5 ? ch.toLowerCase() : ch.toUpperCase();
					const cursedValues = cursedMap[altCh];
					if (cursedValues && cursedValues.length > 1) {
						result[i++] = cursedValues.charAt(i % cursedValues.length);
					} else {
						result[i++] = altCh;
					}
				}
				return result.join("");
			},
			htmlOption: document.createElement("option"),
		},
	};
	mockingSpongeBob.mockTypes = mockTypes;

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

	mockingSpongeBob.currentMock = mockTypes.altsl;
	mockTypes.altsl.htmlOption.selected = true;

	mockSelector.addEventListener("input", (event) => {
		mockingSpongeBob.currentMock = mockTypes[event.currentTarget.value];
	});
}
