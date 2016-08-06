/* Gear.js
KC3改 Equipment Object
*/
(function(){
	"use strict";

	window.KC3Gear = function( data ){
		// Default object properties incuded in stringifications
		this.itemId = 0;
		this.masterId = 0;
		this.stars = 0;
		this.lock = 0;
		this.ace = -1;

		// If specified with data, fill this object
		if(typeof data != "undefined"){
			// Initialized with raw data
			if(typeof data.api_id != "undefined"){
				this.itemId = data.api_id;
				this.masterId = data.api_slotitem_id;
				this.stars = data.api_level;
				this.lock = data.api_locked;

				// Plane Ace mechanism
				if(typeof data.api_alv != "undefined"){
					this.ace = data.api_alv;
				}

			// Initialized with formatted data
			}else{
				$.extend(this, data);
			}
		}
	};

	KC3Gear.prototype.master = function(){ return KC3Master.slotitem( this.masterId ); };
	KC3Gear.prototype.name = function(){ return KC3Meta.gearName( this.master().api_name ); };

	/* FIGHTER POWER
	Get fighter power of this equipment on a slot
	--------------------------------------------------------------*/
	KC3Gear.prototype.fighterPower = function(capacity){
		// Empty item means no fighter power
		if(this.itemId===0){ return 0; }

		// Check if this object is a fighter plane
		if( KC3GearManager.antiAirFighterType2Ids.indexOf( this.master().api_type[2] ) > -1){
			return Math.floor( Math.sqrt(capacity) * this.master().api_tyku );
		}

		// Equipment did not return on plane check, no fighter power
		return 0;
	};


	KC3Gear.prototype.AAStatImprovementBonous = function() {
		if (this.itemId !== 0) {
			var hasBeenImproved = typeof(this.stars) !== "undefined" && this.stars > 0;
			// reference 1:
			// http://wikiwiki.jp/kancolle/?%B2%FE%BD%A4%B9%A9%BE%B3#v63b3544
			// for carrier-based fighters,
			// every star grants +0.2 AA stat, which is added to the AA stat bonus
			// of the gear.
			if (this.master().api_type[2] === 6 && // is carrier-based fighter
				hasBeenImproved) {
				return 0.2 * this.stars;
			}
			// reference 2:
			// http://ja.kancolle.wikia.com/wiki/%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89:951#32
			// for fighter-bombers, every star grants +0.25 AA stat.
			// there's no distinction between bomber and fighter-bomber from KCAPI,
			// so let's just say the rule applies to all bombers.
			// (regular bombers cannot be improved anyway, for now...)
			if (this.master().api_type[2] === 7 && // is bomber
				hasBeenImproved) {
				return 0.25 * this.stars;
			}
		}
		return 0;
	};

	/* FIGHTER POWER: VETERAN
	Get fighter power of this equipment
	with added whole number proficiency bonus
	--------------------------------------------------------------*/
	KC3Gear.prototype.fighterVeteran = function(capacity){
		// Empty item means no fighter power
		if(this.itemId===0){ return 0; }

		// Check if this object is a fighter plane
		if( KC3GearManager.antiAirFighterType2Ids.indexOf( this.master().api_type[2] ) > -1){
			var typInd = String( this.master().api_type[2] );

			if (typeof ConfigManager.air_average[typInd] == 'undefined') {
				ConfigManager.resetValueOf('air_average');
			}
			var airAverageTable = ConfigManager.air_average[typInd];

			var veteranBonus;
			if(this.ace==-1){
				veteranBonus = airAverageTable[ 0 ];
			}else{
				veteranBonus = airAverageTable[ this.ace ];
			}
			var aaStat = this.master().api_tyku;
			aaStat += this.AAStatImprovementBonous();
			return Math.floor( Math.sqrt(capacity) * aaStat + veteranBonus );
		}

		// Equipment did not return on plane check, no fighter power
		return 0;
	};

	/* FIGHTER POWER: VETERAN withBOUNDS
	Get fighter power of this equipment
	as an array with lower and upper bound bonuses
	--------------------------------------------------------------*/
	KC3Gear.prototype.fighterBounds = function(capacity){
		// Empty item means no fighter power
		if(this.itemId===0){ return [0,0]; }

		// Check if this object is a fighter plane
		if( KC3GearManager.antiAirFighterType2Ids.indexOf( this.master().api_type[2] ) > -1){
			// console.log("this.ace", this.ace);

			var typInd = String( this.master().api_type[2] );
			if (typeof ConfigManager.air_bounds[typInd] == 'undefined') {
				ConfigManager.resetValueOf('air_bounds');
			}
			var airBoundTable = ConfigManager.air_bounds[typInd];
			var veteranBounds;
			if(this.ace==-1){
				veteranBounds = airBoundTable[ 0 ];
			}else{
				veteranBounds = airBoundTable[ this.ace ];
			}
			var aaStat = this.master().api_tyku;
			aaStat += this.AAStatImprovementBonous();

			// console.log("ConfigManager.air_bounds",ConfigManager.air_bounds);
			// console.log("veteranBounds", veteranBounds);
			return [
				Math.floor( Math.sqrt(capacity) * aaStat + veteranBounds[0] ),
				Math.floor( Math.sqrt(capacity) * aaStat + veteranBounds[1] ),
			];
		}

		// Equipment did not return on plane check, no fighter power
		return [0,0];
	};

	KC3Gear.prototype.supportPower = function(){
		// Empty item means no fighter power
		if(this.itemId===0){ return 0; }

		// 1.5 TP + 2.0 DV
		return (1.5 * Number(this.master().api_raig) )
			+(2.0 * Number(this.master().api_baku) );
	};

	KC3Gear.prototype.bauxiteCost = function(slotCurrent, slotMaxeq){
		if(this.itemId===0){ return 0; }
		if( KC3GearManager.antiAirFighterType2Ids.indexOf( this.master().api_type[2] ) > -1){
			return 5 * (slotMaxeq - slotCurrent);
		}
		return 0;
	};

})();
