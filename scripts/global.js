var ViewModel;

$(document).ready(function() {
	$(".button__generate").click(function() {
		ViewModel.NewPlaySet();
	});
	$(".cardsets, .options__items").on("change", "input",  function() {
		// Chack to get out of the Chaning state.
		setTimeout(function() {
		var data = {
			CardSets: ViewModel.CardSets.map(function(item) {
				return {
					Name: item.Name,
					InCollection: item.InCollection
				};
			}),
			Options: ViewModel.Options
		};
		$.cookie('config', ko.toJSON(data), { expires: 365 });
		
		console.log("Saved config to 'config' cookie.");
		}, 10); 
	});
	$(".menu__item").click(function() {
		ViewModel.View($(this).find("h2").text());
	})
});

$.getJSON('./data.json', function(results) {
	data = results;
	
	ViewModel = new SetsViewModel(data);
	ko.applyBindings(ViewModel);
	
	$(".panel__body").removeClass('hidden');
	
	ViewModel.NewPlaySet();
});

function SetsViewModel(data) {
	var self = this;
	
	this.View = ko.observable("Generate Play Set");
	
	var cache = $.cookie('config') ? JSON.parse($.cookie('config')) : { CardSets: [], Options: {}};
	
	this.CardSets = data.CardSets;
	this.CardSets.forEach(function(item) {
		var cacheItem = cache.CardSets.filter(onProperty('Name', item.Name)).pop();
		item.InCollection = ko.observable(cacheItem === undefined ? true : cacheItem.InCollection);
	});
	
	this.Options = {
		GroupItemsByType: ko.observable(cache.Options.GroupItemsByType === undefined ? false : cache.Options.GroupItemsByType),
		IgnoreMonsterLevel: ko.observable(cache.Options.IgnoreMonsterLevel === undefined ? false : cache.Options.IgnoreMonsterLevel),
		IgnoreDungeonLevel: ko.observable(cache.Options.IgnoreDungeonLevel === undefined ? false : cache.Options.IgnoreDungeonLevel)
	};
	
	this.PlaySet = {
		Guardian: ko.observable(""),
		Monster1: ko.observable(""),
		Monster2: ko.observable(""),
		Monster3: ko.observable(""),
		Dungeon1a: ko.observable(""),
                Dungeon1b: ko.observable(""),
		Dungeon2a: ko.observable(""),
                Dungeon2b: ko.observable(""),
		Dungeon3a: ko.observable(""),
                Dungeon3b: ko.observable(""),
		ClericHero: ko.observable(""),
		FighterHero: ko.observable(""),
		RogueHero: ko.observable(""),
		WizardHero: ko.observable(""),
		Cards: ko.observableArray(),
		Items: ko.observableArray(),
		Spells: ko.observableArray(),
		Weapons: ko.observableArray()
	}
	
	this.CardSetsAsString = JSON.stringify(this.CardSets, null, '  ')
		.replace(/",\n *"(Level|Type)/g, '", "$1')
		.replace(/\{\n *([^\n]+)\n *\}/g, "{$1}")
		.replace(/\n *"(Rogue|Cleric|Fighter|Wizard)"/g, ' "$1"')
	.replace(/"(Rogue|Cleric|Fighter|Wizard)"\n *\]/g, '"$1" ]');
	
	this.CardSetsOwned = function() {
		return self.CardSets.filter(function (item) {
			return item.InCollection();
		})
	}
	
	this.Guardians = function() {
		return self.CardSetsOwned().map(property('Guardians')).reduce(flatten, []);
	}
	this.Monsters = function() {
		return self.CardSetsOwned().map(property('Monsters')).reduce(flatten, []);
	}
	this.Dungeons = function() {
		return self.CardSetsOwned().map(property('Dungeons')).reduce(flatten, []);
	}
	this.Heros = function() {
		return self.CardSetsOwned().map(property('Heros')).reduce(flatten, []);
	}
	this.Items = function() {
		return self.CardSetsOwned().map(property('Items')).reduce(flatten, []);
	}
	
	this.NewPlaySet = function() {
		var guardians = shuffleArray(self.Guardians());
		self.PlaySet.Guardian(guardians.pop());
		
		// Get Monsters
		if(self.Options.IgnoreMonsterLevel()) {
			var monsters = shuffleArray(self.Monsters());
			self.PlaySet.Monster1(monsters.pop());
			self.PlaySet.Monster2(monsters.pop());
			self.PlaySet.Monster3(monsters.pop());
		} else {
			var monsters1 = shuffleArray(self.Monsters().filter(onProperty('Level', '1')));
			var monsters2 = shuffleArray(self.Monsters().filter(onProperty('Level', '2')));
			var monsters3 = shuffleArray(self.Monsters().filter(onProperty('Level', '3')));
			self.PlaySet.Monster1(monsters1.pop());
			self.PlaySet.Monster2(monsters2.pop());
			self.PlaySet.Monster3(monsters3.pop());
		}
		
		// Get Dungeons
		if(self.Options.IgnoreDungeonLevel()) {
			var dungeons = shuffleArray(self.Dungeons());
			self.PlaySet.Dungeon1a(dungeons.pop());
			self.PlaySet.Dungeon1b(dungeons.pop());
			self.PlaySet.Dungeon2a(dungeons.pop());
			self.PlaySet.Dungeon2b(dungeons.pop());
			self.PlaySet.Dungeon3a(dungeons.pop());
			self.PlaySet.Dungeon3b(dungeons.pop());
		} else {
			var dungeons1 = shuffleArray(self.Dungeons().filter(onProperty('Level', '1')));
			var dungeons2 = shuffleArray(self.Dungeons().filter(onProperty('Level', '2')));
			var dungeons3 = shuffleArray(self.Dungeons().filter(onProperty('Level', '3')));
			self.PlaySet.Dungeon1a(dungeons1.pop());
			self.PlaySet.Dungeon1b(dungeons1.pop());
			self.PlaySet.Dungeon2a(dungeons2.pop());
			self.PlaySet.Dungeon2b(dungeons2.pop());
			self.PlaySet.Dungeon3a(dungeons3.pop());
			self.PlaySet.Dungeon3b(dungeons3.pop());
		}
		
		// Get Items
		var items = shuffleArray(self.Items().filter(onProperty('Type', 'Item')));
		var weapons = shuffleArray(self.Items().filter(onProperty('Type', 'Weapon')));
		var spells = shuffleArray(self.Items().filter(onProperty('Type', 'Spell')));
		
		var deck = [];
		deck.push(items.pop());
		deck.push(items.pop());
		deck.push(weapons.pop());
		deck.push(weapons.pop());
		deck.push(spells.pop());
		deck.push(spells.pop());
		
		var remainingCards = shuffleArray($(self.Items()).not(deck).toArray());
		deck.push(remainingCards.pop());
		deck.push(remainingCards.pop());
		deck = deck.sort(sortBy("Name"))
		
		if(self.Options.GroupItemsByType()) {
			self.PlaySet.Items.removeAll();
			self.PlaySet.Weapons.removeAll();
			self.PlaySet.Spells.removeAll();
			deck.forEach(function(item) {
				if(item.Type == "Weapon")
					self.PlaySet.Weapons.push(item);
				if(item.Type == "Item")
					self.PlaySet.Items.push(item);
				if(item.Type == "Spell")
					self.PlaySet.Spells.push(item);
			});
		} else {
			self.PlaySet.Cards.removeAll();
			deck.forEach(function(item) {
				self.PlaySet.Cards.push(item);
			});
		}
		
		// Get Heros
		var Class = shuffleArray(['Cleric', 'Rogue', 'Fighter', 'Wizard']);
		var heros = shuffleArray(self.Heros());
		
		// Custom code in the base set there is only one cleric.
		if(heros.filter(onProperty('Class', 'Cleric')).length == 1) {
			self.PlaySet.ClericHero(heros.filter(onProperty('Class', 'Cleric')).pop());
			heros = heros.filter(except(self.PlaySet.ClericHero()));
			Class = Class.filter(except('Cleric'));
		}
		
		Class.forEach(function (item) {
			var classHeros = heros.filter(onProperty('Class', item));
			var hero = classHeros.pop();
			heros = heros.filter(except(hero));
			switch(item) {
				case 'Cleric':
					self.PlaySet.ClericHero(hero);
					break;
				case 'Rogue':
					self.PlaySet.RogueHero(hero);
					break;
				case 'Fighter':
					self.PlaySet.FighterHero(hero);
					break;
				case 'Wizard':
					self.PlaySet.WizardHero(hero);
					break;
			}
		})
		
		self.View("Generate Play Set");
	}
}

function property(key) { 
	return function(x) {
		return x[key];
	}
}
function flatten(a, b) { 
	return a.concat(b);
}
function onProperty(key, value) {
	return function(x) {
		return x[key] instanceof Array ? x[key].includes(value) : x[key] == value;
	}
}
function except(item) {
	return function(x) {
		return x !== item;
	}
}
function selectMany(f){ 
    return function (acc,b) {
        return acc.concat(f(b))
    }
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // eslint-disable-line no-param-reassign
    }
	return array;
}
function sortBy(key) {
	return function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    };
}
