// Production cocktail catalog — FROZEN (v17). 80 entries, approved by the user + Jamong on 2026-09-30.
// Source priority: tipsy-app.com → Masileng → a credible fallback; one complete recipe from one page per entry.
// Change entries only as a reviewed batch. The renderer never reads this file: Random Cocktail copies
// an entry into ordinary editable state once (one undo step).
export const CATALOG_FROZEN = true;
export const CATALOG = [
{
"id": "pink-lady",
"name": "Pink Lady",
"nameKo": "핑크 레이디",
"colorFamilies": [
"pink"
],
"recipe": {
"ingredients": [
{
"name": "Gin",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Applejack",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Grenadine",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Egg White",
"qty": 1,
"unit": "egg"
}
],
"garnish": [
"Brandied Cherries"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#E9A4B3",
"pos": 0.0
},
{
"color": "#F7E7E8",
"pos": 0.5
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍒",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/pink-lady"
},
{
"id": "cosmopolitan",
"name": "Cosmopolitan",
"nameKo": "코스모폴리탄",
"colorFamilies": [
"pink",
"red"
],
"recipe": {
"ingredients": [
{
"name": "Citrus Vodka",
"qty": 2,
"unit": "oz"
},
{
"name": "Cointreau",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Unsweetened Cranberry Juice",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.5,
"unit": "oz"
}
],
"garnish": [
"Lime Wheel"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#C94C67",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/cosmopolitan"
},
{
"id": "paloma",
"name": "Paloma",
"nameKo": "팔로마",
"colorFamilies": [
"pink"
],
"recipe": {
"ingredients": [
{
"name": "Reposado Tequila",
"qty": 2,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Grapefruit Soda",
"qty": 2,
"unit": "oz"
}
],
"garnish": [
"Grapefruit Half-Wheel"
]
},
"visual": {
"glass": {
"preset": "collins",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#F2B5AD",
"pos": 0.0
},
{
"color": "#F7D0C9",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "salt",
"coverage": "full"
},
"garnish": [
{
"char": "🍊",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/paloma"
},
{
"id": "singapore-sling",
"name": "Singapore Sling",
"nameKo": "싱가포르 슬링",
"colorFamilies": [
"pink",
"red"
],
"recipe": {
"ingredients": [
{
"name": "Gin",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Cherry Heering",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Cointreau",
"qty": 0.25,
"unit": "oz"
},
{
"name": "Bénédictine",
"qty": 0.25,
"unit": "oz"
},
{
"name": "Pineapple Juice",
"qty": 2,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Angostura Bitters",
"qty": 1,
"unit": "dash"
},
{
"name": "Club Soda",
"qty": 2,
"unit": "oz"
}
],
"garnish": [
"Orange Wedge",
"Brandied Cherries"
]
},
"visual": {
"glass": {
"preset": "highball",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#D85B62",
"pos": 0.0
},
{
"color": "#EE8C83",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍊",
"u": 0.8,
"size": "M",
"rotation": -15
},
{
"char": "🍒",
"u": 0.22,
"size": "S",
"rotation": 15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/singapore-sling"
},
{
"id": "rainbow-in-paradise",
"name": "Rainbow in Paradise",
"nameKo": "레인보우 인 파라다이스",
"colorFamilies": [
"pink",
"blue",
"yellow"
],
"recipe": {
"ingredients": [
{
"name": "Coconut Rum",
"qty": 1,
"unit": "part"
},
{
"name": "Blue Curaçao",
"qty": 1,
"unit": "part"
},
{
"name": "Pineapple Juice",
"qty": 1,
"unit": "part"
},
{
"name": "Grenadine",
"qty": 1,
"unit": "part"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "highball",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "layers",
"stops": [
{
"color": "#D52F52",
"pos": 0.0
},
{
"color": "#F0C84B",
"pos": 0.33
},
{
"color": "#2E9ED1",
"pos": 0.67
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://www.dekuyperusa.com/recipe/rainbow-paradise"
},
{
"id": "blue-hawaiian-sunrise-cocktail",
"name": "Blue Hawaiian Sunrise",
"nameKo": "블루 하와이안 선라이즈",
"colorFamilies": [
"pink",
"blue",
"orange"
],
"recipe": {
"ingredients": [
{
"name": "Grenadine",
"qty": 1,
"unit": "oz"
},
{
"name": "Pineapple Rum",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Pineapple Juice",
"qty": 2,
"unit": "oz"
},
{
"name": "Sweet & Sour",
"qty": 1,
"unit": "oz"
},
{
"name": "Blue Curaçao",
"qty": 1,
"unit": "oz"
},
{
"name": "Guava Juice",
"qty": 2,
"unit": "oz"
}
],
"garnish": [
"Pineapple wedge",
"Maraschino cherries"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "layers",
"stops": [
{
"color": "#E85A62",
"pos": 0.0
},
{
"color": "#F19A5B",
"pos": 0.33
},
{
"color": "#2B9ED0",
"pos": 0.67
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍍",
"u": 0.8,
"size": "M",
"rotation": -15
},
{
"char": "🍒",
"u": 0.22,
"size": "S",
"rotation": 15
}
]
},
"memo": "",
"source": "https://thesoccermomblog.com/blue-hawaiian-sunrise/"
},
{
"id": "shirley-temple",
"name": "Shirley Temple",
"nameKo": "셜리 템플",
"colorFamilies": [
"red",
"pink"
],
"recipe": {
"ingredients": [
{
"name": "Ginger Ale",
"qty": 8,
"unit": "oz"
},
{
"name": "Grenadine",
"qty": 1,
"unit": "oz"
}
],
"garnish": [
"Maraschino Cherries"
]
},
"visual": {
"glass": {
"preset": "highball",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#D62F4B",
"pos": 0.0
},
{
"color": "#E85A69",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍒",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/shirley-temple"
},
{
"id": "sex-on-the-beach",
"name": "Sex on the Beach",
"nameKo": "섹스 온 더 비치",
"colorFamilies": [
"red",
"orange"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Peach Schnapps",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Chambord",
"qty": 0.25,
"unit": "oz"
},
{
"name": "Cranberry Juice Cocktail",
"qty": 2,
"unit": "oz"
},
{
"name": "Orange Juice",
"qty": 1,
"unit": "oz"
},
{
"name": "Grapefruit Juice",
"qty": 1,
"unit": "oz"
}
],
"garnish": [
"Brandied Cherries",
"Lemon Wheel",
"Orange Wheel"
]
},
"visual": {
"glass": {
"preset": "highball",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#DB5540",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍒",
"u": 0.8,
"size": "M",
"rotation": -15
},
{
"char": "🍋",
"u": 0.22,
"size": "S",
"rotation": 15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/sex-on-the-beach"
},
{
"id": "sea-breeze",
"name": "Sea Breeze",
"nameKo": "씨 브리즈",
"colorFamilies": [
"red",
"pink"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Grapefruit Juice",
"qty": 3,
"unit": "oz"
},
{
"name": "Cranberry Juice Cocktail",
"qty": 3,
"unit": "oz"
}
],
"garnish": [
"Lime Wedge"
]
},
"visual": {
"glass": {
"preset": "highball",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#C53A4E",
"pos": 0.0
},
{
"color": "#DF6572",
"pos": 0.5
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/sea-breeze"
},
{
"id": "ruby",
"name": "Ruby",
"nameKo": "루비",
"colorFamilies": [
"red",
"pink"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Elderflower Liqueur",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Bittersweet Orange-Red Aperitivo",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Ruby Red Grapefruit Juice",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Egg White",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Grapefruit Bitters",
"qty": 6,
"unit": "drop"
},
{
"name": "Saline Solution",
"qty": 2,
"unit": "drop"
}
],
"garnish": [
"Grapefruit zest twist"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#C83D52",
"pos": 0.0
},
{
"color": "#F5E4E0",
"pos": 0.5
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍊",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://www.diffordsguide.com/cocktails/recipe/6392/ruby"
},
{
"id": "shark-bite",
"name": "Shark Bite",
"nameKo": "샤크 바이트",
"colorFamilies": [
"blue",
"red"
],
"recipe": {
"ingredients": [
{
"name": "Spiced Rum",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Light Rum",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Blue Curaçao",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Sweet & Sour Mix",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Grenadine",
"qty": 3,
"unit": "drop"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "oldFashioned",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "smooth",
"stops": [
{
"color": "#B71935",
"pos": 0
},
{
"color": "#1598C7",
"pos": 0.35
}
]
},
"ice": {
"type": "cubes",
"count": 2
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/shark-bite"
},
{
"id": "bob-marley",
"name": "Bob Marley",
"nameKo": "밥 말리",
"colorFamilies": [
"red",
"yellow",
"green"
],
"recipe": {
"ingredients": [
{
"name": "Grenadine",
"qty": 1,
"unit": "oz"
},
{
"name": "Banana Liqueur",
"qty": 1,
"unit": "oz"
},
{
"name": "Pineapple Juice",
"qty": 1,
"unit": "oz"
},
{
"name": "Overproof Rum",
"qty": 1,
"unit": "oz"
},
{
"name": "Blue Curaçao",
"qty": 1,
"unit": "oz"
}
],
"garnish": [
"Pineapple Wedge",
"Pineapple Leaves",
"Maraschino Cherries"
]
},
"visual": {
"glass": {
"preset": "tulip",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "layers",
"stops": [
{
"color": "#C92D36",
"pos": 0
},
{
"color": "#E9C52F",
"pos": 0.4
},
{
"color": "#2D8D50",
"pos": 0.75
}
]
},
"ice": {
"type": "cubes",
"count": 4
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍍",
"u": 0.8,
"size": "M",
"rotation": -15
},
{
"char": "🍒",
"u": 0.22,
"size": "S",
"rotation": 15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/bob-marley"
},
{
"id": "bramble",
"name": "Bramble",
"nameKo": "브램블",
"colorFamilies": [
"purple",
"red"
],
"recipe": {
"ingredients": [
{
"name": "Gin",
"qty": 2,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Crème de Mûre",
"qty": 0.5,
"unit": "oz"
}
],
"garnish": [
"Blackberries",
"Lemon Wheel"
]
},
"visual": {
"glass": {
"preset": "rocks",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "smooth",
"stops": [
{
"color": "#7A1F45",
"pos": 0
},
{
"color": "#E9C4CF",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 4
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🫐",
"u": 0.8,
"size": "M",
"rotation": -15
},
{
"char": "🍋",
"u": 0.22,
"size": "S",
"rotation": 15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/bramble"
},
{
"id": "cinderella",
"name": "Cinderella",
"nameKo": "신데렐라",
"colorFamilies": [
"yellow",
"orange"
],
"recipe": {
"ingredients": [
{
"name": "Orange Juice",
"qty": 2,
"unit": "oz"
},
{
"name": "Pineapple Juice",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Grenadine Syrup",
"qty": 0.167,
"unit": "oz"
},
{
"name": "Angostura Aromatic Bitters",
"qty": 3,
"unit": "dash"
},
{
"name": "Soda Water",
"qty": null,
"unit": "top"
}
],
"garnish": [
"Lemon slice wheel"
]
},
"visual": {
"glass": {
"preset": "collins",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#F2B04A",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://www.diffordsguide.com/cocktails/recipe/435/cinderella"
},
{
"id": "tequila-sunrise",
"name": "Tequila Sunrise",
"nameKo": "데킬라 선라이즈",
"colorFamilies": [
"orange",
"red"
],
"recipe": {
"ingredients": [
{
"name": "Blanco Tequila",
"qty": 2,
"unit": "oz"
},
{
"name": "Orange Juice",
"qty": 4,
"unit": "oz"
},
{
"name": "Grenadine",
"qty": 0.25,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 0.25,
"unit": "oz"
}
],
"garnish": [
"Orange Half-Wheel",
"Lime Wedge"
]
},
"visual": {
"glass": {
"preset": "highball",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#D9373E",
"pos": 0.0
},
{
"color": "#F2A13B",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍊",
"u": 0.8,
"size": "M",
"rotation": -15
},
{
"char": "🍋",
"u": 0.22,
"size": "S",
"rotation": 15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/tequila-sunrise"
},
{
"id": "garibaldi",
"name": "Garibaldi",
"nameKo": "가리발디",
"colorFamilies": [
"orange"
],
"recipe": {
"ingredients": [
{
"name": "Campari",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Orange Juice",
"qty": 4,
"unit": "oz"
}
],
"garnish": [
"Orange Wedge"
]
},
"visual": {
"glass": {
"preset": "highball",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#E45A25",
"pos": 0.0
},
{
"color": "#F59A3D",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍊",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/garibaldi"
},
{
"id": "harvey-wallbanger",
"name": "Harvey Wallbanger",
"nameKo": "하비 월뱅거",
"colorFamilies": [
"orange"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Galliano L'Autentico",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Orange Juice",
"qty": 3,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.5,
"unit": "oz"
}
],
"garnish": [
"Orange Half-Wheel"
]
},
"visual": {
"glass": {
"preset": "highball",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#E89A35",
"pos": 0.0
},
{
"color": "#F3B14A",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍊",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/harvey-wallbanger"
},
{
"id": "naked-and-famous",
"name": "Naked and Famous",
"nameKo": "네이키드 앤 페이머스",
"colorFamilies": [
"orange"
],
"recipe": {
"ingredients": [
{
"name": "Mezcal",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Aperol",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Yellow Chartreuse",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 0.75,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#DF6C43",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/naked-and-famous"
},
{
"id": "screwdriver",
"name": "Screwdriver",
"nameKo": "스크루드라이버",
"colorFamilies": [
"orange",
"yellow"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Orange Juice",
"qty": 5,
"unit": "oz"
}
],
"garnish": [
"Orange Wedge"
]
},
"visual": {
"glass": {
"preset": "highball",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#F2A52E",
"pos": 0
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍊",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/screwdriver"
},
{
"id": "penicillin",
"name": "Penicillin",
"nameKo": "페니실린",
"colorFamilies": [
"yellow"
],
"recipe": {
"ingredients": [
{
"name": "Scotch",
"qty": 2,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Honey Syrup",
"qty": 0.3,
"unit": "oz"
},
{
"name": "Ginger Syrup",
"qty": 0.3,
"unit": "oz"
},
{
"name": "Peated Islay Scotch",
"qty": 3,
"unit": "spray"
}
],
"garnish": [
"Candied Ginger"
]
},
"visual": {
"glass": {
"preset": "rocks",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "smooth",
"stops": [
{
"color": "#D9A64B",
"pos": 0.0
},
{
"color": "#E6BE67",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 2
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/penicillin"
},
{
"id": "spicy-fifty",
"name": "Spicy Fifty",
"nameKo": "스파이시 피프티",
"colorFamilies": [
"yellow"
],
"recipe": {
"ingredients": [
{
"name": "Vanilla Vodka",
"qty": 1.67,
"unit": "oz"
},
{
"name": "Elderflower Syrup",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Honey Syrup",
"qty": 0.33,
"unit": "oz"
},
{
"name": "Red Chili Pepper",
"qty": 2,
"unit": "piece"
}
],
"garnish": [
"Red Chili Pepper"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#E6D17A",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🌶",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/spicy-fifty"
},
{
"id": "old-cuban",
"name": "Old Cuban",
"nameKo": "올드 쿠반",
"colorFamilies": [
"yellow"
],
"recipe": {
"ingredients": [
{
"name": "Aged Rum",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Mint",
"qty": 6,
"unit": "leaves"
},
{
"name": "Champagne",
"qty": 2,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Angostura Bitters",
"qty": 2,
"unit": "dash"
},
{
"name": "Simple Syrup",
"qty": 1,
"unit": "oz"
}
],
"garnish": [
"Mint Leaf"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#CFA85A",
"pos": 0.0
},
{
"color": "#E6D38A",
"pos": 0.5
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🌿",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/old-cuban"
},
{
"id": "bee-s-knees",
"name": "Bee's Knees",
"nameKo": "비즈 니즈",
"colorFamilies": [
"yellow"
],
"recipe": {
"ingredients": [
{
"name": "Gin",
"qty": 2,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Honey Syrup",
"qty": 0.75,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#E6C44D",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/bees-knees"
},
{
"id": "pi-a-colada",
"name": "Piña Colada",
"nameKo": "피냐 콜라다",
"colorFamilies": [
"yellow",
"white"
],
"recipe": {
"ingredients": [
{
"name": "Light Rum",
"qty": 2,
"unit": "oz"
},
{
"name": "Pineapple Juice",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Cream of Coconut",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Blackstrap Rum",
"qty": 0.5,
"unit": "oz"
}
],
"garnish": [
"Pineapple Wedge",
"Brandied Cherries"
]
},
"visual": {
"glass": {
"preset": "tulip",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#EFE3A5",
"pos": 0.0
},
{
"color": "#F6EDC6",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 4
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍍",
"u": 0.8,
"size": "M",
"rotation": -15
},
{
"char": "🍒",
"u": 0.22,
"size": "S",
"rotation": 15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/pi-a-colada"
},
{
"id": "new-york-sour",
"name": "New York Sour",
"nameKo": "뉴욕 사워",
"colorFamilies": [
"yellow",
"red",
"brown"
],
"recipe": {
"ingredients": [
{
"name": "Bourbon",
"qty": 2,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 1,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Egg White",
"qty": 1,
"unit": "egg"
},
{
"name": "Red Wine",
"qty": 0.5,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "oldFashioned",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "layers",
"stops": [
{
"color": "#D9B35B",
"pos": 0.0
},
{
"color": "#F3E8D6",
"pos": 0.33
},
{
"color": "#7D2638",
"pos": 0.67
}
]
},
"ice": {
"type": "cubes",
"count": 2
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/new-york-sour"
},
{
"id": "painkiller",
"name": "Painkiller",
"nameKo": "페인킬러",
"colorFamilies": [
"yellow",
"white"
],
"recipe": {
"ingredients": [
{
"name": "Rum",
"qty": 2,
"unit": "oz"
},
{
"name": "Cream of Coconut",
"qty": 1,
"unit": "oz"
},
{
"name": "Pineapple Juice",
"qty": 2,
"unit": "oz"
},
{
"name": "Orange Juice",
"qty": 1,
"unit": "oz"
}
],
"garnish": [
"Nutmeg"
]
},
"visual": {
"glass": {
"preset": "highball",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#E8C36D",
"pos": 0.0
},
{
"color": "#F1DCA0",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/painkiller"
},
{
"id": "moscow-mule",
"name": "Moscow Mule",
"nameKo": "모스코 뮬",
"colorFamilies": [
"yellow",
"white"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Ginger Beer",
"qty": 4.5,
"unit": "oz"
}
],
"garnish": [
"Lime Wedge"
]
},
"visual": {
"glass": {
"preset": "rocks",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "smooth",
"stops": [
{
"color": "#EEE2AE",
"pos": 0
}
]
},
"ice": {
"type": "cubes",
"count": 2
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/moscow-mule"
},
{
"id": "june-bug",
"name": "June Bug",
"nameKo": "준 벅",
"colorFamilies": [
"green"
],
"recipe": {
"ingredients": [
{
"name": "Midori",
"qty": 1,
"unit": "oz"
},
{
"name": "Coconut Rum",
"qty": 1,
"unit": "oz"
},
{
"name": "Banana Liqueur",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Sweet & Sour Mix",
"qty": 1,
"unit": "oz"
},
{
"name": "Pineapple Juice",
"qty": 2,
"unit": "oz"
}
],
"garnish": [
"Pineapple Wedge"
]
},
"visual": {
"glass": {
"preset": "collins",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#55B84E",
"pos": 0.0
},
{
"color": "#77CA58",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍍",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/june-bug"
},
{
"id": "midori-sour",
"name": "Midori Sour",
"nameKo": "미도리 사워",
"colorFamilies": [
"green"
],
"recipe": {
"ingredients": [
{
"name": "Midori",
"qty": 1,
"unit": "oz"
},
{
"name": "Vodka",
"qty": 1,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Club Soda",
"qty": null,
"unit": "splash"
}
],
"garnish": [
"Lemon Wheel"
]
},
"visual": {
"glass": {
"preset": "collins",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#79D33F",
"pos": 0
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/midori-sour"
},
{
"id": "mojito",
"name": "Mojito",
"nameKo": "모히토",
"colorFamilies": [
"green",
"white"
],
"recipe": {
"ingredients": [
{
"name": "Light Rum",
"qty": 2,
"unit": "oz"
},
{
"name": "Club Soda",
"qty": 1,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 1,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Mint",
"qty": null,
"unit": "asNeeded"
}
],
"garnish": [
"mint sprig"
]
},
"visual": {
"glass": {
"preset": "collins",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#D9E9C0",
"pos": 0.0
},
{
"color": "#EDF2D9",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🌿",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/mojito"
},
{
"id": "grasshopper",
"name": "Grasshopper",
"nameKo": "그래스호퍼",
"colorFamilies": [
"green"
],
"recipe": {
"ingredients": [
{
"name": "Mint Leaves",
"qty": 8,
"unit": "leaves"
},
{
"name": "Crème de Menthe",
"qty": 1,
"unit": "oz"
},
{
"name": "Crème de Cacao",
"qty": 1,
"unit": "oz"
},
{
"name": "Heavy Cream",
"qty": 1,
"unit": "oz"
}
],
"garnish": [
"Mint Leaf"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#B7DDB5",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🌿",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/grasshopper"
},
{
"id": "appletini",
"name": "Appletini",
"nameKo": "애플티니",
"colorFamilies": [
"green"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 1.25,
"unit": "oz"
},
{
"name": "Sour Apple Liqueur",
"qty": 1,
"unit": "oz"
},
{
"name": "Apple Juice",
"qty": 1.25,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.25,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.25,
"unit": "oz"
}
],
"garnish": [
"Apple Slices"
]
},
"visual": {
"glass": {
"preset": "martini",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#8CCB4A",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍏",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/appletini"
},
{
"id": "japanese-slipper",
"name": "Japanese Slipper",
"nameKo": "재패니즈 슬리퍼",
"colorFamilies": [
"green"
],
"recipe": {
"ingredients": [
{
"name": "Midori",
"qty": 1,
"unit": "oz"
},
{
"name": "Cointreau",
"qty": 1,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 1,
"unit": "oz"
}
],
"garnish": [
"Maraschino Cherries"
]
},
"visual": {
"glass": {
"preset": "martini",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#A7D94F",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍒",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/japanese-slipper"
},
{
"id": "last-word",
"name": "Last Word",
"nameKo": "라스트 워드",
"colorFamilies": [
"green",
"yellow"
],
"recipe": {
"ingredients": [
{
"name": "Gin",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Green Chartreuse",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Maraschino Liqueur",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 0.75,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#C4D86A",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/last-word"
},
{
"id": "caipirinha",
"name": "Caipirinha",
"nameKo": "카이피리냐",
"colorFamilies": [
"green"
],
"recipe": {
"ingredients": [
{
"name": "Lime Wedges",
"qty": 6,
"unit": "wedge"
},
{
"name": "Simple Syrup",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Sugar Cube",
"qty": 1,
"unit": "piece"
},
{
"name": "Cachaça",
"qty": 2,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "rocks",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "smooth",
"stops": [
{
"color": "#DCE9B7",
"pos": 0.0
},
{
"color": "#C7DE91",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 2
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/caipirinha"
},
{
"id": "blue-hawaii",
"name": "Blue Hawaii",
"nameKo": "블루 하와이",
"colorFamilies": [
"lightBlue",
"blue"
],
"recipe": {
"ingredients": [
{
"name": "Light Rum",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Vodka",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Blue Curaçao",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Pineapple Juice",
"qty": 3,
"unit": "oz"
},
{
"name": "Sweet & Sour Mix",
"qty": 1,
"unit": "oz"
}
],
"garnish": [
"Pineapple Wedge"
]
},
"visual": {
"glass": {
"preset": "tulip",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#45BFD0",
"pos": 0
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍍",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/blue-hawaii"
},
{
"id": "blue-ocean",
"name": "Blue Ocean",
"nameKo": "블루 오션",
"colorFamilies": [
"lightBlue"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 1,
"unit": "oz"
},
{
"name": "Blue Curaçao",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Sugar Syrup",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Grapefruit Juice",
"qty": 1,
"unit": "oz"
}
],
"garnish": [
"오렌지 1slice"
]
},
"visual": {
"glass": {
"preset": "rocks",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "smooth",
"stops": [
{
"color": "#6BC8D5",
"pos": 0
}
]
},
"ice": {
"type": "cubes",
"count": 2
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://www.masileng.com/cocktail/10"
},
{
"id": "blue-kamikaze",
"name": "Blue Kamikaze",
"nameKo": "블루 카미카제",
"colorFamilies": [
"lightBlue",
"blue"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Blue Curaçao",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 0.5,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "shot",
"height": 1.0
},
"liquid": {
"level": 0.85,
"blend": "smooth",
"stops": [
{
"color": "#38B8D5",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/blue-kamikaze"
},
{
"id": "swimming-pool",
"name": "Swimming Pool",
"nameKo": "스위밍 풀",
"colorFamilies": [
"lightBlue"
],
"recipe": {
"ingredients": [
{
"name": "Light Rum",
"qty": 1.33,
"unit": "oz"
},
{
"name": "Vodka",
"qty": 0.67,
"unit": "oz"
},
{
"name": "Cream of Coconut",
"qty": 0.67,
"unit": "oz"
},
{
"name": "Pineapple Juice",
"qty": 1.33,
"unit": "oz"
},
{
"name": "Heavy Cream",
"qty": 0.33,
"unit": "oz"
},
{
"name": "Blue Curaçao",
"qty": 0.33,
"unit": "oz"
}
],
"garnish": [
"Pineapple Wedge",
"Maraschino Cherries"
]
},
"visual": {
"glass": {
"preset": "tulip",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#7CCDD0",
"pos": 0.0
},
{
"color": "#A8E0DE",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 4
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍍",
"u": 0.8,
"size": "M",
"rotation": -15
},
{
"char": "🍒",
"u": 0.22,
"size": "S",
"rotation": 15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/swimming-pool"
},
{
"id": "tipsy-mermaid",
"name": "Tipsy Mermaid",
"nameKo": "팁시 머메이드",
"colorFamilies": [
"lightBlue",
"green"
],
"recipe": {
"ingredients": [
{
"name": "Rum",
"qty": 1,
"unit": "oz"
},
{
"name": "Midori",
"qty": 1,
"unit": "oz"
},
{
"name": "Pineapple Juice",
"qty": 2,
"unit": "oz"
},
{
"name": "Blue Curaçao",
"qty": 1,
"unit": "oz"
}
],
"garnish": [
"Lime Wheel"
]
},
"visual": {
"glass": {
"preset": "highball",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#2B8FC8",
"pos": 0
},
{
"color": "#8CCB52",
"pos": 0.45
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/tipsy-mermaid"
},
{
"id": "alexander-s-big-brother",
"name": "Alexander's Big Brother",
"nameKo": "알렉산더스 빅 브라더",
"colorFamilies": [
"lightBlue"
],
"recipe": {
"ingredients": [
{
"name": "London Dry Gin",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Cointreau",
"qty": 0.25,
"unit": "oz"
},
{
"name": "Blue Curaçao",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Whipping Cream",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Rich Sugar Syrup",
"qty": 0.17,
"unit": "oz"
},
{
"name": "Egg White (optional)",
"qty": 0.25,
"unit": "oz"
}
],
"garnish": [
"Physalis (cape gooseberry) on rim"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#8ECED2",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://www.diffordsguide.com/cocktails/recipe/37/alexanders-big-brother"
},
{
"id": "blue-lagoon",
"name": "Blue Lagoon",
"nameKo": "블루 라군",
"colorFamilies": [
"blue"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 1,
"unit": "oz"
},
{
"name": "Blue Curaçao",
"qty": 1,
"unit": "oz"
},
{
"name": "Lemonade",
"qty": 4,
"unit": "oz"
}
],
"garnish": [
"Lemon Wheel",
"Maraschino Cherries"
]
},
"visual": {
"glass": {
"preset": "tulip",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#178DCE",
"pos": 0.0
},
{
"color": "#2AA7DD",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
},
{
"char": "🍒",
"u": 0.22,
"size": "S",
"rotation": 15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/blue-lagoon"
},
{
"id": "fruit-tingle",
"name": "Fruit Tingle",
"nameKo": "프루트 팅글",
"colorFamilies": [
"blue",
"lightBlue"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Blue Curaçao",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Lemonade",
"qty": 6,
"unit": "oz"
},
{
"name": "Raspberry Syrup",
"qty": null,
"unit": "splash"
}
],
"garnish": [
"Pineapple Wedge",
"Maraschino Cherry"
]
},
"visual": {
"glass": {
"preset": "tulip",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#6E56C7",
"pos": 0
},
{
"color": "#198FD2",
"pos": 0.55
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍍",
"u": 0.8,
"size": "M",
"rotation": -15
},
{
"char": "🍒",
"u": 0.22,
"size": "S",
"rotation": 15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/fruit-tingle"
},
{
"id": "jellyfish-shot",
"name": "Jellyfish Shot",
"nameKo": "젤리피시",
"colorFamilies": [
"brown",
"white"
],
"recipe": {
"ingredients": [
{
"name": "Crème de Cacao",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Amaretto",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Irish Cream",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Grenadine",
"qty": 3,
"unit": "drop"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "shot",
"height": 1.0
},
"liquid": {
"level": 0.85,
"blend": "layers",
"stops": [
{
"color": "#F1EDE4",
"pos": 0
},
{
"color": "#C98A3A",
"pos": 0.35
},
{
"color": "#E8DCC6",
"pos": 0.7
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/jellyfish-shot"
},
{
"id": "aviation",
"name": "Aviation",
"nameKo": "에비에이션",
"colorFamilies": [
"purple"
],
"recipe": {
"ingredients": [
{
"name": "Gin",
"qty": 2,
"unit": "oz"
},
{
"name": "Crème de Violette",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Maraschino Liqueur",
"qty": 1,
"unit": "tsp"
},
{
"name": "Lemon Juice",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.5,
"unit": "oz"
}
],
"garnish": [
"Brandied Cherries"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#B8A7D5",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍒",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/aviation"
},
{
"id": "blue-moon",
"name": "Blue Moon",
"nameKo": "블루 문",
"colorFamilies": [
"purple",
"blue"
],
"recipe": {
"ingredients": [
{
"name": "Gin",
"qty": 2,
"unit": "oz"
},
{
"name": "Crème de Violette",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.5,
"unit": "oz"
}
],
"garnish": [
"Lemon Twist"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#9B91CC",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/blue-moon"
},
{
"id": "purple-hooter",
"name": "Purple Hooter",
"nameKo": "퍼플 후터",
"colorFamilies": [
"purple",
"pink"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 2,
"unit": "oz"
},
{
"name": "Chambord (Black Raspberry Liqueur)",
"qty": 1,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 1,
"unit": "oz"
},
{
"name": "Club Soda",
"qty": null,
"unit": "top"
}
],
"garnish": [
"Lime Wedge"
]
},
"visual": {
"glass": {
"preset": "collins",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#9B3D91",
"pos": 0.0
},
{
"color": "#B34D9E",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/purple-hooter"
},
{
"id": "witch-s-heart",
"name": "Witch's Heart",
"nameKo": "위치스 하트",
"colorFamilies": [
"purple",
"red"
],
"recipe": {
"ingredients": [
{
"name": "Crème de Mûre",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Apple Juice",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.38,
"unit": "oz"
},
{
"name": "Edible Glitter",
"qty": null,
"unit": "pinch"
},
{
"name": "Grenadine",
"qty": 1,
"unit": "tsp"
},
{
"name": "Dry Ice",
"qty": null,
"unit": "asNeeded"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "martini",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#8B2D52",
"pos": 0
},
{
"color": "#59315F",
"pos": 0.4
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/witch-s-heart"
},
{
"id": "purple-rain",
"name": "Purple Rain",
"nameKo": "퍼플 레인",
"colorFamilies": [
"purple",
"pink"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Blue Curaçao",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 1,
"unit": "oz"
},
{
"name": "Grenadine",
"qty": 0.25,
"unit": "oz"
},
{
"name": "Lemon-Lime Soda",
"qty": 4,
"unit": "oz"
}
],
"garnish": [
"Lemon Wedge"
]
},
"visual": {
"glass": {
"preset": "highball",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#8457A6",
"pos": 0
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/purple-rain"
},
{
"id": "liquorice-shot",
"name": "Licorice Shot",
"nameKo": "감초 샷",
"colorFamilies": [
"purple",
"black"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Sambuca",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Crème de Cassis",
"qty": 0.3,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "shot",
"height": 1.0
},
"liquid": {
"level": 0.85,
"blend": "smooth",
"stops": [
{
"color": "#35203F",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/liquorice-shot"
},
{
"id": "espresso-martini",
"name": "Espresso Martini",
"nameKo": "에스프레소 마티니",
"colorFamilies": [
"brown",
"black"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 2,
"unit": "oz"
},
{
"name": "Espresso",
"qty": 1,
"unit": "oz"
},
{
"name": "Coffee Liqueur",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.25,
"unit": "oz"
}
],
"garnish": [
"Coffee Beans"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#3B241D",
"pos": 0.0
},
{
"color": "#9B725A",
"pos": 0.5
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/espresso-martini"
},
{
"id": "brandy-alexander",
"name": "Brandy Alexander",
"nameKo": "브랜디 알렉산더",
"colorFamilies": [
"brown",
"white"
],
"recipe": {
"ingredients": [
{
"name": "Cognac",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Crème de Cacao",
"qty": 1,
"unit": "oz"
},
{
"name": "Heavy Cream",
"qty": 1,
"unit": "oz"
}
],
"garnish": [
"Nutmeg"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#C8AD91",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/brandy-alexander"
},
{
"id": "duck-fart-shot",
"name": "Duck Fart Shot",
"nameKo": "덕 파트 샷",
"colorFamilies": [
"brown",
"white"
],
"recipe": {
"ingredients": [
{
"name": "Coffee Liqueur",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Irish Cream",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Canadian Whisky",
"qty": 0.5,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "shot",
"height": 1.0
},
"liquid": {
"level": 0.85,
"blend": "layers",
"stops": [
{
"color": "#4A2D21",
"pos": 0.0
},
{
"color": "#D7C0A0",
"pos": 0.33
},
{
"color": "#B8793E",
"pos": 0.67
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/duck-fart-shot"
},
{
"id": "b-52",
"name": "B-52",
"nameKo": "B-52",
"colorFamilies": [
"brown",
"orange",
"white"
],
"recipe": {
"ingredients": [
{
"name": "Coffee Liqueur",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Baileys (Irish Cream)",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Grand Marnier",
"qty": 0.75,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "shot",
"height": 1.0
},
"liquid": {
"level": 0.85,
"blend": "layers",
"stops": [
{
"color": "#42291F",
"pos": 0.0
},
{
"color": "#D7C4A7",
"pos": 0.33
},
{
"color": "#C87B35",
"pos": 0.67
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/b-52"
},
{
"id": "sombrero",
"name": "Sombrero",
"nameKo": "솜브레로",
"colorFamilies": [
"brown",
"white"
],
"recipe": {
"ingredients": [
{
"name": "Coffee Liqueur",
"qty": 2,
"unit": "oz"
},
{
"name": "Heavy Cream",
"qty": 1,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "oldFashioned",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "layers",
"stops": [
{
"color": "#3B261E",
"pos": 0.0
},
{
"color": "#EEE1CD",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 2
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/sombrero-cocktail"
},
{
"id": "angostura-colada",
"name": "Angostura Colada",
"nameKo": "앙고스투라 콜라다",
"colorFamilies": [
"brown"
],
"recipe": {
"ingredients": [
{
"name": "Angostura Bitters",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Overproof Rum",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Pineapple Juice",
"qty": 2,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 1,
"unit": "oz"
},
{
"name": "Cream of Coconut",
"qty": 1.5,
"unit": "oz"
}
],
"garnish": [
"Nutmeg",
"Pineapple Leaves"
]
},
"visual": {
"glass": {
"preset": "tulip",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#9B553D",
"pos": 0.0
},
{
"color": "#B97857",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 4
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍍",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/angostura-colada"
},
{
"id": "mai-tai",
"name": "Mai Tai",
"nameKo": "마이 타이",
"colorFamilies": [
"brown",
"orange"
],
"recipe": {
"ingredients": [
{
"name": "Jamaican Rum",
"qty": 1,
"unit": "oz"
},
{
"name": "Rhum Agricole",
"qty": 1,
"unit": "oz"
},
{
"name": "Grand Marnier",
"qty": 0.25,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 1,
"unit": "oz"
},
{
"name": "Orgeat",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.25,
"unit": "oz"
},
{
"name": "Angostura Bitters",
"qty": 1,
"unit": "dash"
}
],
"garnish": [
"Mint Sprig Bouquet"
]
},
"visual": {
"glass": {
"preset": "rocks",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "smooth",
"stops": [
{
"color": "#B77942",
"pos": 0.0
},
{
"color": "#C9955C",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 4
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🌿",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/mai-tai"
},
{
"id": "butterball-shot",
"name": "Butterball Shot",
"nameKo": "버터볼 샷",
"colorFamilies": [
"brown",
"white"
],
"recipe": {
"ingredients": [
{
"name": "Butterscotch Schnapps",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Irish Cream",
"qty": 0.75,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "shot",
"height": 1.0
},
"liquid": {
"level": 0.85,
"blend": "layers",
"stops": [
{
"color": "#C28A45",
"pos": 0.0
},
{
"color": "#E1C8A7",
"pos": 0.5
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/butterball-shot"
},
{
"id": "black-and-tan",
"name": "Black and Tan",
"nameKo": "블랙 앤 탠",
"colorFamilies": [
"brown",
"black"
],
"recipe": {
"ingredients": [
{
"name": "Lager",
"qty": 6,
"unit": "oz"
},
{
"name": "Guinness Draught",
"qty": 6,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "pint",
"height": 1.0
},
"liquid": {
"level": 0.9,
"blend": "layers",
"stops": [
{
"color": "#D9A441",
"pos": 0
},
{
"color": "#2A211E",
"pos": 0.5
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/black-and-tan"
},
{
"id": "barraquito",
"name": "Barraquito",
"nameKo": "바라키토",
"colorFamilies": [
"brown",
"white",
"orange"
],
"recipe": {
"ingredients": [
{
"name": "Sweetened Condensed Milk",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Licor 43",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Espresso",
"qty": 1,
"unit": "oz"
},
{
"name": "Milk (frothed)",
"qty": 3.5,
"unit": "oz"
}
],
"garnish": [
"Lemon Twist",
"Cinnamon"
]
},
"visual": {
"glass": {
"preset": "oldFashioned",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "layers",
"stops": [
{
"color": "#F0E1BD",
"pos": 0.0
},
{
"color": "#D79A3B",
"pos": 0.2
},
{
"color": "#3B251E",
"pos": 0.4
},
{
"color": "#E8DDC8",
"pos": 0.6
},
{
"color": "#F5F0E6",
"pos": 0.8
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/barraquito"
},
{
"id": "canchanchara",
"name": "Canchánchara",
"nameKo": "칸찬차라",
"colorFamilies": [
"brown",
"yellow"
],
"recipe": {
"ingredients": [
{
"name": "Cuban Aguardiente",
"qty": 2,
"unit": "oz"
},
{
"name": "Fresh Lime Juice",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Raw Honey",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Water",
"qty": 1.667,
"unit": "oz"
}
],
"garnish": [
"Lime wedge"
]
},
"visual": {
"glass": {
"preset": "rocks",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "smooth",
"stops": [
{
"color": "#C79A5A",
"pos": 0
}
]
},
"ice": {
"type": "cubes",
"count": 4
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://iba-world.com/canchanchara/"
},
{
"id": "black-velvet",
"name": "Black Velvet",
"nameKo": "블랙 벨벳",
"colorFamilies": [
"black",
"brown"
],
"recipe": {
"ingredients": [
{
"name": "Guinness Draught",
"qty": 4,
"unit": "oz"
},
{
"name": "Champagne",
"qty": 4,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "flute",
"height": 1.0
},
"liquid": {
"level": 0.85,
"blend": "layers",
"stops": [
{
"color": "#E9D9A6",
"pos": 0
},
{
"color": "#2A211E",
"pos": 0.45
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/black-velvet"
},
{
"id": "black-russian",
"name": "Black Russian",
"nameKo": "블랙 러시안",
"colorFamilies": [
"brown",
"black"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Kahlúa (Coffee Liqueur)",
"qty": 1.5,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "rocks",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "smooth",
"stops": [
{
"color": "#2D211D",
"pos": 0
}
]
},
"ice": {
"type": "cubes",
"count": 2
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/black-russian"
},
{
"id": "black-manhattan",
"name": "Black Manhattan",
"nameKo": "블랙 맨해튼",
"colorFamilies": [
"black",
"brown"
],
"recipe": {
"ingredients": [
{
"name": "Rye Whiskey",
"qty": 2,
"unit": "oz"
},
{
"name": "Amaro Averna",
"qty": 1,
"unit": "oz"
},
{
"name": "Angostura Bitters",
"qty": 1,
"unit": "dash"
},
{
"name": "Orange Bitters",
"qty": 1,
"unit": "dash"
}
],
"garnish": [
"Brandied Cherries"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#30221E",
"pos": 0.0
},
{
"color": "#4B2C26",
"pos": 0.5
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍒",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/black-manhattan"
},
{
"id": "revolver",
"name": "Revolver",
"nameKo": "리볼버",
"colorFamilies": [
"black",
"brown"
],
"recipe": {
"ingredients": [
{
"name": "Bourbon",
"qty": 2,
"unit": "oz"
},
{
"name": "Coffee Liqueur",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Orange Bitters",
"qty": 1,
"unit": "dash"
}
],
"garnish": [
"Flamed Orange Peel"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#33241E",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/revolver"
},
{
"id": "ramos-gin-fizz",
"name": "Ramos Gin Fizz",
"nameKo": "라모스 진 피즈",
"colorFamilies": [
"gray",
"white"
],
"recipe": {
"ingredients": [
{
"name": "Gin",
"qty": 2,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Heavy Cream",
"qty": 1,
"unit": "oz"
},
{
"name": "Egg White",
"qty": 1,
"unit": "egg"
},
{
"name": "Orange Flower Water",
"qty": 3,
"unit": "dash"
},
{
"name": "Sparkling Water",
"qty": 2,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "pint",
"height": 1.0
},
"liquid": {
"level": 0.9,
"blend": "smooth",
"stops": [
{
"color": "#E5E4DE",
"pos": 0.0
},
{
"color": "#F7F5EF",
"pos": 0.5
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/ramos-gin-fizz"
},
{
"id": "silver-fizz",
"name": "Silver Fizz",
"nameKo": "실버 피즈",
"colorFamilies": [
"gray",
"yellow"
],
"recipe": {
"ingredients": [
{
"name": "Gin",
"qty": 2,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Egg White",
"qty": 1,
"unit": "egg"
},
{
"name": "Sparkling Water",
"qty": 2,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "highball",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#E1DED0",
"pos": 0.0
},
{
"color": "#F3F1E8",
"pos": 0.5
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/silver-fizz"
},
{
"id": "earl-grey-marteani",
"name": "Earl Grey Marteani",
"nameKo": "얼 그레이 마르테아니",
"colorFamilies": [
"gray",
"brown"
],
"recipe": {
"ingredients": [
{
"name": "Lemon Juice",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 1,
"unit": "oz"
},
{
"name": "Earl Grey Tea-Infused Gin",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Egg White",
"qty": 1,
"unit": "egg"
}
],
"garnish": [
"Lemon twist"
]
},
"visual": {
"glass": {
"preset": "martini",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#B6A991",
"pos": 0.0
},
{
"color": "#E9E2D6",
"pos": 0.5
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "sugar",
"coverage": "half"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://punchdrink.com/recipes/earl-grey-marteani/"
},
{
"id": "devil-s-margarita",
"name": "Devil's Margarita",
"nameKo": "데빌스 마가리타",
"colorFamilies": [
"gray",
"red"
],
"recipe": {
"ingredients": [
{
"name": "Blanco Tequila",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 1,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Red Wine",
"qty": 0.5,
"unit": "oz"
}
],
"garnish": [
"Lime Wheel"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "layers",
"stops": [
{
"color": "#DDD9C9",
"pos": 0.0
},
{
"color": "#762C3B",
"pos": 0.5
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/devil-s-margarita"
},
{
"id": "pisco-sour",
"name": "Pisco Sour",
"nameKo": "피스코 사워",
"colorFamilies": [
"gray",
"yellow"
],
"recipe": {
"ingredients": [
{
"name": "Pisco",
"qty": 2,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Egg White",
"qty": 1,
"unit": "egg"
},
{
"name": "Angostura Bitters",
"qty": null,
"unit": "drop"
}
],
"garnish": [
"Angostura bitters"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#DED9C5",
"pos": 0.0
},
{
"color": "#F2EFE6",
"pos": 0.5
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/pisco-sour"
},
{
"id": "vodka-martini",
"name": "Vodka Martini",
"nameKo": "보드카 마티니",
"colorFamilies": [
"white"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 2.5,
"unit": "oz"
},
{
"name": "Dry Vermouth",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Lemon Twist",
"qty": null,
"unit": "piece"
}
],
"garnish": [
"Lemon Twist"
]
},
"visual": {
"glass": {
"preset": "nickNora",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#F6F7F4",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/vodka-martini"
},
{
"id": "gin-rickey",
"name": "Gin Rickey",
"nameKo": "진 리키",
"colorFamilies": [
"white"
],
"recipe": {
"ingredients": [
{
"name": "Gin",
"qty": 2,
"unit": "oz"
},
{
"name": "Lime Juice",
"qty": 1,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Club Soda",
"qty": null,
"unit": "top"
}
],
"garnish": [
"Lime Wedge"
]
},
"visual": {
"glass": {
"preset": "highball",
"height": 1.0
},
"liquid": {
"level": 0.8,
"blend": "smooth",
"stops": [
{
"color": "#F1F4EA",
"pos": 0.0
},
{
"color": "#F8F9F5",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 3
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/gin-rickey"
},
{
"id": "lychee-martini",
"name": "Lychee Martini",
"nameKo": "리치 마티니",
"colorFamilies": [
"white"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Lychee Liqueur",
"qty": 1,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.5,
"unit": "oz"
}
],
"garnish": [
"Lychee (on cocktail pick)"
]
},
"visual": {
"glass": {
"preset": "martini",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#F1EEE7",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/lychee-martini"
},
{
"id": "white-lady",
"name": "White Lady",
"nameKo": "화이트 레이디",
"colorFamilies": [
"white"
],
"recipe": {
"ingredients": [
{
"name": "Gin",
"qty": 2,
"unit": "oz"
},
{
"name": "Cointreau",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Lemon Juice",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Egg White",
"qty": 1,
"unit": "egg"
},
{
"name": "Simple Syrup",
"qty": 0.25,
"unit": "oz"
},
{
"name": "Lemon Twist",
"qty": null,
"unit": "piece"
}
],
"garnish": [
"Lemon Twist"
]
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#F1E8D8",
"pos": 0.0
},
{
"color": "#FAF7EF",
"pos": 0.5
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": [
{
"char": "🍋",
"u": 0.8,
"size": "M",
"rotation": -15
}
]
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/white-lady"
},
{
"id": "milk-punch",
"name": "Milk Punch",
"nameKo": "밀크 펀치",
"colorFamilies": [
"white"
],
"recipe": {
"ingredients": [
{
"name": "Milk",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Cognac",
"qty": 1,
"unit": "oz"
},
{
"name": "Dark Rum",
"qty": 1,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.75,
"unit": "oz"
},
{
"name": "Nutmeg",
"qty": null,
"unit": "asNeeded"
}
],
"garnish": [
"Nutmeg"
]
},
"visual": {
"glass": {
"preset": "oldFashioned",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "smooth",
"stops": [
{
"color": "#EEE4D1",
"pos": 0
}
]
},
"ice": {
"type": "cubes",
"count": 2
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/milk-punch"
},
{
"id": "batida-de-coco",
"name": "Batida de Coco",
"nameKo": "바티다 데 코코",
"colorFamilies": [
"white"
],
"recipe": {
"ingredients": [
{
"name": "Cachaça",
"qty": 2,
"unit": "oz"
},
{
"name": "Coconut Milk",
"qty": 3,
"unit": "oz"
},
{
"name": "Simple Syrup",
"qty": 0.75,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "martini",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#F3EFE2",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/batida-de-coco"
},
{
"id": "kahlua-milk",
"name": "Kahlúa Milk",
"nameKo": "깔루아 밀크",
"colorFamilies": [
"white",
"brown"
],
"recipe": {
"ingredients": [
{
"name": "Milk",
"qty": 3,
"unit": "oz"
},
{
"name": "Kahlúa",
"qty": 1,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "rocks",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "smooth",
"stops": [
{
"color": "#D8C4A8",
"pos": 0
}
]
},
"ice": {
"type": "cubes",
"count": 2
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://www.masileng.com/challenge/149"
},
{
"id": "white-russian",
"name": "White Russian",
"nameKo": "화이트 러시안",
"colorFamilies": [
"white",
"brown"
],
"recipe": {
"ingredients": [
{
"name": "Vodka",
"qty": 1.5,
"unit": "oz"
},
{
"name": "Coffee Liqueur",
"qty": 1,
"unit": "oz"
},
{
"name": "Half-and-Half",
"qty": 1,
"unit": "oz"
}
],
"garnish": [
"Coffee Beans"
]
},
"visual": {
"glass": {
"preset": "rocks",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "layers",
"stops": [
{
"color": "#3A281F",
"pos": 0.0
},
{
"color": "#EFE4D1",
"pos": 0.5
}
]
},
"ice": {
"type": "cubes",
"count": 2
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://tipsy-app.com/cocktails/white-russian"
},
{
"id": "donghae",
"name": "Donghae",
"nameKo": "동해",
"colorFamilies": [
"blue"
],
"recipe": {
"ingredients": [
{
"name": "Blue Curaçao",
"qty": 1,
"unit": "oz"
},
{
"name": "Peach Liqueur",
"qty": 0.5,
"unit": "oz"
},
{
"name": "Sugar Syrup",
"qty": 1,
"unit": "oz"
},
{
"name": "Sweet & Sour Mix",
"qty": 1,
"unit": "oz"
},
{
"name": "Apple Juice",
"qty": 2,
"unit": "oz"
}
],
"garnish": []
},
"visual": {
"glass": {
"preset": "coupe",
"height": 1.0
},
"liquid": {
"level": 0.75,
"blend": "smooth",
"stops": [
{
"color": "#2F7FC8",
"pos": 0
}
]
},
"ice": {
"type": "none"
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://www.masileng.com/challenge/344"
},
{
"id": "turqs-cocos",
"name": "Turqs & Cocos",
"nameKo": "터크스 앤 코코스",
"colorFamilies": [
"lightBlue",
"white"
],
"recipe": {
"ingredients": [
{
"name": "Blue Curaçao",
"qty": 0.5,
"unit": "part"
},
{
"name": "White Rum",
"qty": 1,
"unit": "part"
},
{
"name": "Egg White",
"qty": 1,
"unit": "part"
},
{
"name": "Coconut Cream",
"qty": 1,
"unit": "part"
},
{
"name": "Lemon Juice",
"qty": 1,
"unit": "part"
},
{
"name": "Simple Syrup",
"qty": 0.5,
"unit": "part"
}
],
"garnish": [
"Crushed ice & mint leaf"
]
},
"visual": {
"glass": {
"preset": "rocks",
"height": 1.0
},
"liquid": {
"level": 0.7,
"blend": "smooth",
"stops": [
{
"color": "#9FDCD4",
"pos": 0
},
{
"color": "#F4FBFA",
"pos": 0.7
}
]
},
"ice": {
"type": "cubes",
"count": 2
},
"rim": {
"type": "none"
},
"garnish": []
},
"memo": "",
"source": "https://www.curacaoliqueur.com/cocktails/turqs-cocos"
}
];
