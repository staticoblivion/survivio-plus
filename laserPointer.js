window.laserPointer = function(obfuscate, game, variables) {

	var bullets = variables.bullets;
	var items = variables.items;
	var binded = false;
	var Laser = {
		draw: null,
		range: 0.0,
		direction: 0.0,
		angle: 0.0
	};
	var playerPosListCount = 4;
	var playerLastRelevantTime = 0.19;

	if(!!!bullets || !!!items) {
		console.log("Cannot init laserpointer");
		return;
	}

	var getDistance = function(p1, p2) {
		var dx = p2.x - p1.x, dy = p2.y - p1.y;
		return Math.sqrt(dx * dx + dy * dy);
	};

	var getSecondsElapsed = function(time) {
		return (window.performance.now() - time) / 1000;
	};

	var updateLaser = function() {
		var activePlayer;
		var draw = Laser.draw;
		
		if(!draw) {
			draw = new window.PIXI.Graphics();
			
			Laser.draw = draw;
			activePlayer = game.scope[obfuscate.activePlayer.main];
			activePlayer.container.addChild(draw);
			activePlayer.container.setChildIndex(draw, 0);
		}
		
		if(!draw.graphicsData)
			return;
		
		draw.clear();
		
		var center = {x: 0, y: 0};
		var radius = Laser.range;
		var angleFrom = Laser.direction - Laser.angle;
		var angleTo = Laser.direction + Laser.angle;
		
		angleFrom = angleFrom > Math.PI * 2 ? angleFrom - Math.PI * 2 : angleFrom < 0 ? angleFrom + Math.PI * 2 : angleFrom;
		angleTo = angleTo > Math.PI * 2 ? angleTo - Math.PI * 2 : angleTo < 0 ? angleTo + Math.PI * 2 : angleTo;
		
		draw.beginFill(0xFF5BDB, 0.1);
		draw.moveTo(center.x, center.y);
		draw.arc(center.x, center.y, radius, angleFrom, angleTo);
		draw.lineTo(center.x, center.y);
		draw.endFill();
	}

	var processPlayerSpeed = function(player, inertia) {
		if(!player)return;
		
		var curPosData = {
			pos: player.pos,
			time: window.performance.now(),
		};
		
		if(!player.posData || getSecondsElapsed(player.posData[0].time) > playerLastRelevantTime) {
			player.posData = [curPosData];
			player.prediction = {x:0.0, y:0.0};
			player.speed = 0.0;
			player.distance = 0.0;
			player.direction = null;
			
			return;
		}
		
		var lastPosData = player.posData[0];
		
		var distance = getDistance(curPosData.pos, lastPosData.pos);
		
		if(distance > 0.0001)
		{
			player.direction = {
				x: (curPosData.pos.x - lastPosData.pos.x) / distance,
				y: (curPosData.pos.y - lastPosData.pos.y) / distance
			}
		} else {
			player.direction = null;
		}
		
		var speed = distance / getSecondsElapsed(lastPosData.time);
		
		if(player.speed)speed = (speed * (1.0 - inertia)) + (player.speed * inertia);
		
		player.speed = speed;
		player.distance = distance;
		player.posData.push(curPosData);
		
		while(player.posData.length > playerPosListCount) {
			player.posData.shift();
		}
	};

	var resetLaser = function() {
		if(Laser.draw && game.scope.initialized) {
			Laser.draw.clear();
		}
	}

	var draw = function() {
		var activePlayer = game.scope[obfuscate.activePlayer.main];
		
		if(activePlayer.weapType) {
			var camera = game.scope[obfuscate.camera];
			var curWeapon = items[activePlayer.weapType];

			if(isset(curWeapon.shotSpread) &&
				isset(curWeapon.bulletType)) {

				processPlayerSpeed(activePlayer[obfuscate.activePlayer.netData], 0.1);

				Laser.range = bullets[curWeapon.bulletType].distance * camera.ppu;
				Laser.direction = Math.atan2(activePlayer[obfuscate.activePlayer.netData].dir.x, activePlayer.N.dir.y) - Math.PI / 2;
				Laser.angle = (curWeapon.shotSpread + (activePlayer[obfuscate.activePlayer.netData].speed > 0.01 ? curWeapon.moveSpread : 0.0)) * 0.01745329252 / 2;

				updateLaser();
			} else {
				resetLaser();
			}
		}

		if(binded) {
			setTimeout(draw);
		} else {
			resetLaser();
		}
	}

	var bind = function() {
		binded = true;
		
		setTimeout(function() {
			Laser.draw = null;
			resetLaser();
			draw();
		});
	}

	var unbind = function() {
		binded = false;
	}

	var isBinded = function() {
		return binded;
	}

	return {
		bind: bind,
		unbind: unbind,
		isBinded: isBinded
	}
}