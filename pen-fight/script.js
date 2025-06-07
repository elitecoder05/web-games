class PenFightGame {
    constructor() {
        this.gameBoard = document.getElementById('gameBoard');
        this.bluePen = document.getElementById('bluePen');
        this.redPen = document.getElementById('redPen');
        this.aimLine = document.getElementById('aimLine');
        this.playerTurnEl = document.getElementById('playerTurn');
        this.score1El = document.getElementById('score1');
        this.score2El = document.getElementById('score2');
        
        this.currentPlayer = 1; // 1 for blue, 2 for red
        this.score = [0, 0];
        this.isAiming = false;
        this.isDragging = false;
        this.startPos = { x: 0, y: 0 };
        this.currentPen = null;
        this.animationId = null;
        
        // Physics constants
        this.friction = 0.98;
        this.minVelocity = 0.5;
        this.maxForce = 25; // Increased max force
        this.collisionDamping = 0.7;
        
        // Power meter system
        this.powerMeter = null;
        this.powerIndicator = null;
        this.meterPosition = 0; // 0 to 100
        this.meterDirection = 1; // 1 for right, -1 for left
        this.baseMeterSpeed = 2; // Base speed of indicator movement
        this.meterInterval = null;
        this.isDragging = false;
        
        // Progressive difficulty system
        this.baseMaxForce = 15; // Starting max force
        this.initialGreenZoneSize = 15; // Initial green zone size - reduced for more challenge
        this.minGreenZoneSize = 8; // Minimum green zone size
        this.totalShots = 0; // Track total shots in the game
        
        this.initializeGame();
        this.setupEventListeners();
    }
    
    initializeGame() {
        this.updateTurnDisplay();
        this.setActivePen();
        this.resetPenPositions();
        this.createPowerMeter();
    }
    
    createPowerMeter() {
        // Create power meter container
        this.powerMeter = document.createElement('div');
        this.powerMeter.style.cssText = `
            position: absolute;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            width: 300px;
            height: 30px;
            background: linear-gradient(90deg, 
                #ff4444 0%, #ff4444 15%, 
                #ff8800 15%, #ff8800 35%, 
                #44ff44 35%, #44ff44 65%, 
                #ff8800 65%, #ff8800 85%, 
                #ff4444 85%, #ff4444 100%);
            border: 3px solid #fff;
            border-radius: 15px;
            display: none;
            z-index: 150;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        
        // Create moving indicator
        this.powerIndicator = document.createElement('div');
        this.powerIndicator.style.cssText = `
            position: absolute;
            top: -2px;
            left: 0%;
            width: 6px;
            height: 34px;
            background: #fff;
            border: 2px solid #000;
            border-radius: 4px;
            box-shadow: 0 0 10px rgba(255,255,255,0.8);
            transition: none;
        `;
        
        this.powerMeter.appendChild(this.powerIndicator);
        this.gameBoard.appendChild(this.powerMeter);
    }
    
    getCurrentMaxForce() {
        // Increase max force every 4 shots (2 shots per player)
        const forceIncrease = Math.floor(this.totalShots / 4) * 3;
        return this.baseMaxForce + forceIncrease;
    }
    
    getCurrentGreenZoneSize() {
        // Decrease green zone size every 6 shots, but don't go below minimum
        const sizeDecrease = Math.floor(this.totalShots / 6) * 3;
        return Math.max(this.minGreenZoneSize, this.initialGreenZoneSize - sizeDecrease);
    }
    
    getCurrentMeterSpeed() {
        // Increase meter speed every 5 shots to make timing more challenging
        const speedIncrease = Math.floor(this.totalShots / 5) * 0.5;
        return this.baseMeterSpeed + speedIncrease;
    }
    
    updatePowerMeterDifficulty() {
        const greenZoneSize = this.getCurrentGreenZoneSize();
        const greenStart = (100 - greenZoneSize) / 2;
        const greenEnd = greenStart + greenZoneSize;
        const orangeZone1End = greenStart;
        const orangeZone2Start = greenEnd;
        
        // Update the power meter background with new zone sizes
        this.powerMeter.style.background = `linear-gradient(90deg, 
            #ff4444 0%, #ff4444 15%, 
            #ff8800 15%, #ff8800 ${orangeZone1End}%, 
            #44ff44 ${orangeZone1End}%, #44ff44 ${orangeZone2Start}%, 
            #ff8800 ${orangeZone2Start}%, #ff8800 85%, 
            #ff4444 85%, #ff4444 100%)`;
    }
    
    showPowerMeter() {
        this.powerMeter.style.display = 'block';
        this.meterPosition = 0;
        this.meterDirection = 1;
        
        // Update difficulty based on current game progress
        this.updatePowerMeterDifficulty();
        
        // Show difficulty info
        this.showDifficultyInfo();
    }
    
    hidePowerMeter() {
        this.powerMeter.style.display = 'none';
        this.stopMeterAnimation();
    }
    
    startMeterAnimation() {
        this.meterInterval = setInterval(() => {
            const currentSpeed = this.getCurrentMeterSpeed();
            this.meterPosition += this.meterDirection * currentSpeed;
            
            // Bounce at ends
            if (this.meterPosition >= 100) {
                this.meterPosition = 100;
                this.meterDirection = -1;
            } else if (this.meterPosition <= 0) {
                this.meterPosition = 0;
                this.meterDirection = 1;
            }
            
            // Update indicator position
            this.powerIndicator.style.left = this.meterPosition + '%';
        }, 16); // ~60fps
    }
    
    stopMeterAnimation() {
        if (this.meterInterval) {
            clearInterval(this.meterInterval);
            this.meterInterval = null;
        }
    }
    
    getPowerFromMeter() {
        // Use dynamic green zone size based on game progress
        const greenZoneSize = this.getCurrentGreenZoneSize();
        const greenStart = (100 - greenZoneSize) / 2;
        const greenEnd = greenStart + greenZoneSize;
        const orangeZone1End = greenStart;
        const orangeZone2Start = greenEnd;
        
        if (this.meterPosition >= greenStart && this.meterPosition <= greenEnd) {
            return 1.0; // Green zone - max power
        } else if ((this.meterPosition >= 15 && this.meterPosition < orangeZone1End) || 
                   (this.meterPosition > orangeZone2Start && this.meterPosition <= 85)) {
            return 0.6; // Orange zone - medium power
        } else {
            return 0.3; // Red zone - low power
        }
    }
    
    showDifficultyInfo() {
        const currentForce = this.getCurrentMaxForce();
        const greenZoneSize = this.getCurrentGreenZoneSize();
        const currentSpeed = this.getCurrentMeterSpeed();
        
        const difficultyEl = document.createElement('div');
        difficultyEl.textContent = `Force: ${currentForce} | Perfect Zone: ${greenZoneSize}% | Speed: ${currentSpeed.toFixed(1)}x`;
        difficultyEl.style.cssText = `
            position: absolute;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: #fff;
            padding: 5px 15px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            z-index: 160;
            white-space: nowrap;
        `;
        
        this.gameBoard.appendChild(difficultyEl);
        
        setTimeout(() => {
            if (difficultyEl.parentNode) {
                difficultyEl.parentNode.removeChild(difficultyEl);
            }
        }, 2000);
    }
    
    resetPenPositions() {
        const boardRect = this.gameBoard.getBoundingClientRect();
        const penSize = 120;
        
        // Position blue pen (player 1) - top left area
        this.bluePen.style.left = (boardRect.width * 0.2 - penSize/2) + 'px';
        this.bluePen.style.top = (boardRect.height * 0.3 - penSize/2) + 'px';
        
        // Position red pen (player 2) - bottom right area
        this.redPen.style.left = (boardRect.width * 0.8 - penSize/2) + 'px';
        this.redPen.style.top = (boardRect.height * 0.7 - penSize/2) + 'px';
        
        // Reset velocities
        this.bluePen.velocity = { x: 0, y: 0 };
        this.redPen.velocity = { x: 0, y: 0 };
    }
    
    setupEventListeners() {
        // Touch events for mobile
        this.bluePen.addEventListener('touchstart', (e) => this.handleStart(e, this.bluePen, 1));
        this.redPen.addEventListener('touchstart', (e) => this.handleStart(e, this.redPen, 2));
        
        // Mouse events for desktop testing
        this.bluePen.addEventListener('mousedown', (e) => this.handleStart(e, this.bluePen, 1));
        this.redPen.addEventListener('mousedown', (e) => this.handleStart(e, this.redPen, 2));
        
        // Global move and end events
        document.addEventListener('touchmove', (e) => this.handleMove(e));
        document.addEventListener('touchend', (e) => this.handleEnd(e));
        document.addEventListener('mousemove', (e) => this.handleMove(e));
        document.addEventListener('mouseup', (e) => this.handleEnd(e));
        
        // Prevent default touch behaviors
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resetPenPositions(), 100);
        });
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.resetPenPositions();
        });
    }
    
    handleStart(e, pen, player) {
        e.preventDefault();
        
        if (this.currentPlayer !== player || this.isMoving()) {
            return;
        }
        
        this.isDragging = true;
        this.currentPen = pen;
        this.isAiming = true;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        this.startPos = { x: clientX, y: clientY };
        
        pen.classList.add('active');
        
        // Show power meter and start indicator movement
        this.showPowerMeter();
        this.startMeterAnimation();
    }
    
    handleMove(e) {
        if (!this.isDragging || !this.currentPen) return;
        
        e.preventDefault();
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        this.updateAimLine(clientX, clientY);
    }
    
    handleEnd(e) {
        if (!this.isDragging || !this.currentPen) return;
        
        e.preventDefault();
        
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        
        // Hide power meter and get current power level
        this.hidePowerMeter();
        
        this.shootPen(clientX, clientY);
        this.hideAimLine();
        
        this.currentPen.classList.remove('active');
        this.isDragging = false;
        this.isAiming = false;
        this.currentPen = null;
    }
    
    updateAimLine(currentX, currentY) {
        const penRect = this.currentPen.getBoundingClientRect();
        const penCenterX = penRect.left + penRect.width / 2;
        const penCenterY = penRect.top + penRect.height / 2;
        
        const deltaX = currentX - this.startPos.x;
        const deltaY = currentY - this.startPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX);
        
        if (distance > 10) { // Minimum drag distance
            this.aimLine.style.left = penCenterX + 'px';
            this.aimLine.style.top = penCenterY + 'px';
            // Remove the distance limit to show full drag length
            this.aimLine.style.width = Math.min(distance, 250) + 'px'; // Increased max visual length
            this.aimLine.style.transform = `rotate(${angle}rad)`;
            this.aimLine.classList.add('visible');
        } else {
            this.aimLine.classList.remove('visible');
        }
    }
    
    shootPen(endX, endY) {
        const deltaX = endX - this.startPos.x;
        const deltaY = endY - this.startPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance < 10) return; // Too small movement
        
        // Get power from meter timing and use dynamic max force
        const powerMultiplier = this.getPowerFromMeter();
        const currentMaxForce = this.getCurrentMaxForce();
        const force = currentMaxForce * powerMultiplier;
        const angle = Math.atan2(deltaY, deltaX);
        
        // Apply velocity to pen
        this.currentPen.velocity = {
            x: Math.cos(angle) * force,
            y: Math.sin(angle) * force
        };
        
        // Increment shot counter for progressive difficulty
        this.totalShots++;
        
        // Show power feedback
        this.showPowerFeedback(powerMultiplier, currentMaxForce);
        
        this.currentPen.classList.add('moving');
        this.startPenMovement();
        this.switchPlayer();
    }
    
    showPowerFeedback(powerMultiplier, currentMaxForce) {
        let message = '';
        let color = '';
        
        if (powerMultiplier === 1.0) {
            message = `PERFECT HIT! (${Math.round(currentMaxForce)} Force)`;
            color = '#44ff44';
        } else if (powerMultiplier === 0.6) {
            message = `Good Hit! (${Math.round(currentMaxForce * 0.6)} Force)`;
            color = '#ff8800';
        } else {
            message = `Weak Hit (${Math.round(currentMaxForce * 0.3)} Force)`;
            color = '#ff4444';
        }
        
        const feedbackEl = document.createElement('div');
        feedbackEl.textContent = message;
        feedbackEl.style.cssText = `
            position: absolute;
            top: 120px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: ${color};
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            z-index: 200;
            animation: fadeInOut 1.5s ease-in-out;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        
        this.gameBoard.appendChild(feedbackEl);
        
        setTimeout(() => {
            if (feedbackEl.parentNode) {
                feedbackEl.parentNode.removeChild(feedbackEl);
            }
        }, 1500);
    }
    
    startPenMovement() {
        const animate = () => {
            let stillMoving = false;
            
            [this.bluePen, this.redPen].forEach(pen => {
                if (pen.velocity && (Math.abs(pen.velocity.x) > this.minVelocity || Math.abs(pen.velocity.y) > this.minVelocity)) {
                    stillMoving = true;
                    this.movePen(pen);
                }
            });
            
            this.checkCollisions();
            
            if (stillMoving) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.stopAllMovement();
            }
        };
        
        if (!this.animationId) {
            animate();
        }
    }
    
    movePen(pen) {
        const currentLeft = parseFloat(pen.style.left) || 0;
        const currentTop = parseFloat(pen.style.top) || 0;
        
        // Update position
        const newLeft = currentLeft + pen.velocity.x;
        const newTop = currentTop + pen.velocity.y;
        
        // Board boundaries - get actual board dimensions
        const boardRect = this.gameBoard.getBoundingClientRect();
        const penSize = 120; // Consistent pen size
        
        // Check if pen falls off the board (award points)
        if (newLeft < -penSize || newLeft > boardRect.width || 
            newTop < -penSize || newTop > boardRect.height) {
            this.handlePenFallOff(pen);
            return;
        }
        
        // Update pen position (no wall bouncing - pens can fall off)
        pen.style.left = newLeft + 'px';
        pen.style.top = newTop + 'px';
        
        // Apply friction
        pen.velocity.x *= this.friction;
        pen.velocity.y *= this.friction;
    }
    
    checkCollisions() {
        const blueRect = this.bluePen.getBoundingClientRect();
        const redRect = this.redPen.getBoundingClientRect();
        
        // Check if pens are colliding
        if (this.isColliding(blueRect, redRect)) {
            this.handlePenCollision();
        }
    }
    
    isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                 rect1.left > rect2.right || 
                 rect1.bottom < rect2.top || 
                 rect1.top > rect2.bottom);
    }
    
    handlePenCollision() {
        // Add collision effect
        this.bluePen.classList.add('collision');
        this.redPen.classList.add('collision');
        
        setTimeout(() => {
            this.bluePen.classList.remove('collision');
            this.redPen.classList.remove('collision');
        }, 300);
        
        // Exchange velocities (simplified collision physics)
        const tempVelocity = { ...this.bluePen.velocity };
        this.bluePen.velocity = { ...this.redPen.velocity };
        this.redPen.velocity = tempVelocity;
        
        // Apply collision damping
        this.bluePen.velocity.x *= this.collisionDamping;
        this.bluePen.velocity.y *= this.collisionDamping;
        this.redPen.velocity.x *= this.collisionDamping;
        this.redPen.velocity.y *= this.collisionDamping;
        
        // Separate pens to avoid overlap
        this.separatePens();
    }
    
    handlePenFallOff(fallenPen) {
        // Stop the fallen pen
        fallenPen.velocity = { x: 0, y: 0 };
        fallenPen.classList.remove('moving');
        
        // Award point to the player who caused the fall
        if (fallenPen === this.bluePen) {
            // Blue pen fell off, red player (player 2) gets the point
            this.score[1]++;
            this.showFallOffMessage('Blue pen fell off! Player 2 scores!');
        } else {
            // Red pen fell off, blue player (player 1) gets the point  
            this.score[0]++;
            this.showFallOffMessage('Red pen fell off! Player 1 scores!');
        }
        
        this.updateScoreDisplay();
        
        // Reset pen positions after a short delay
        setTimeout(() => {
            this.resetPenPositions();
            this.stopAllMovement();
        }, 1000);
        
        // Check for win condition
        if (this.score[0] >= 5 || this.score[1] >= 5) {
            this.endGame();
        }
    }
    
    showFallOffMessage(message) {
        // Create and show temporary message
        const messageEl = document.createElement('div');
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            z-index: 200;
            animation: fadeInOut 2s ease-in-out;
        `;
        
        this.gameBoard.appendChild(messageEl);
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 2000);
    }
    
    separatePens() {
        const blueRect = this.bluePen.getBoundingClientRect();
        const redRect = this.redPen.getBoundingClientRect();
        
        const centerX1 = blueRect.left + blueRect.width / 2;
        const centerY1 = blueRect.top + blueRect.height / 2;
        const centerX2 = redRect.left + redRect.width / 2;
        const centerY2 = redRect.top + redRect.height / 2;
        
        const deltaX = centerX2 - centerX1;
        const deltaY = centerY2 - centerY1;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance < 120) { // Minimum separation distance
            const separationForce = (120 - distance) / 2;
            const normalX = deltaX / distance;
            const normalY = deltaY / distance;
            
            this.bluePen.style.left = (parseFloat(this.bluePen.style.left) - normalX * separationForce) + 'px';
            this.bluePen.style.top = (parseFloat(this.bluePen.style.top) - normalY * separationForce) + 'px';
            this.redPen.style.left = (parseFloat(this.redPen.style.left) + normalX * separationForce) + 'px';
            this.redPen.style.top = (parseFloat(this.redPen.style.top) + normalY * separationForce) + 'px';
        }
    }
    
    updateScore() {
        // This method is now only used for display updates
        this.updateScoreDisplay();
    }
    
    updateScoreDisplay() {
        this.score1El.textContent = this.score[0];
        this.score2El.textContent = this.score[1];
    }
    
    endGame() {
        const winner = this.score[0] >= 5 ? 'Player 1' : 'Player 2';
        setTimeout(() => {
            alert(`${winner} wins!`);
            this.resetGame();
        }, 500);
    }
    
    resetGame() {
        this.score = [0, 0];
        this.updateScoreDisplay();
        this.currentPlayer = 1;
        this.totalShots = 0; // Reset shot counter for new game
        this.resetPenPositions();
        this.updateTurnDisplay();
        this.setActivePen();
    }
    
    stopAllMovement() {
        this.bluePen.classList.remove('moving');
        this.redPen.classList.remove('moving');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Reset velocities
        this.bluePen.velocity = { x: 0, y: 0 };
        this.redPen.velocity = { x: 0, y: 0 };
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateTurnDisplay();
        this.setActivePen();
    }
    
    updateTurnDisplay() {
        this.playerTurnEl.textContent = `Player ${this.currentPlayer}'s Turn`;
        this.playerTurnEl.style.color = this.currentPlayer === 1 ? '#3498db' : '#e74c3c';
    }
    
    setActivePen() {
        this.bluePen.classList.remove('active-turn');
        this.redPen.classList.remove('active-turn');
        
        if (this.currentPlayer === 1) {
            this.bluePen.classList.add('active-turn');
        } else {
            this.redPen.classList.add('active-turn');
        }
    }
    
    hideAimLine() {
        this.aimLine.classList.remove('visible');
    }
    
    isMoving() {
        return this.bluePen.classList.contains('moving') || this.redPen.classList.contains('moving');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PenFightGame();
});

// Prevent zoom on double tap
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);