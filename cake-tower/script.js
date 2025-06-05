document.addEventListener('DOMContentLoaded', () => {
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const tapButton = document.getElementById('tapButton');
    const scoreDisplay = document.getElementById('score');
    const gameContainer = document.querySelector('.game-container'); // Get game container for perfect message

    
    let score = 0;
    let gameOver = false;
    let animationId;
    let direction = 1; 
    let speed = 2; 
    let blockHeight = 30; 
    let currentStackHeight = 0; 
    let gameStarted = false;
      const cakeFlavors = [
        { 
            name: 'strawberry', 
            mainColor: '#FF9AA2',
            gradientColor: '#FF5A67',
            frostingColor: '#FFFFFF',
            dotColor: '#FF0033'
        },
        { 
            name: 'blueberry', 
            mainColor: '#A0C4FF',
            gradientColor: '#4A86E8',
            frostingColor: '#E6F0FF',
            dotColor: '#0047AB'
        },
        { 
            name: 'lemon', 
            mainColor: '#FDFFB6',
            gradientColor: '#FFEE58',
            frostingColor: '#FFFDE7',
            dotColor: '#FFD700'
        },
        { 
            name: 'matcha', 
            mainColor: '#CAFFBF',
            gradientColor: '#66BB6A',
            frostingColor: '#F1F8E9',
            dotColor: '#2E7D32'
        },
        { 
            name: 'chocolate', 
            mainColor: '#A68064',
            gradientColor: '#6D4C41',
            frostingColor: '#D7CCC8',
            dotColor: '#3E2723'
        },
        { 
            name: 'watermelon', 
            mainColor: '#FFB7D5',
            gradientColor: '#FF4081',
            frostingColor: '#FCE4EC',
            dotColor: '#2E7D32'
        },
        { 
            name: 'vanilla', 
            mainColor: '#FFF5E1',
            gradientColor: '#FFE0B2',
            frostingColor: '#FFFFFF',
            dotColor: '#FFD54F'
        }
    ];

     class Block {
        constructor(y, width, height, isBase = false) {
            this.width = width;
            this.height = height;
            this.y = y;
            
            if (isBase) {
                 this.x = canvas.width / 2 - width / 2;
                this.isBase = true;
                 this.basePlate = true;
            } else {
                 this.x = direction > 0 ? -width : canvas.width;
                 this.flavor = cakeFlavors[Math.floor(Math.random() * cakeFlavors.length)];
                this.isBase = false;
            }
            
            this.moving = !isBase;
        }

        draw() {
            if (this.isBase && this.basePlate) {
                 const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
                gradient.addColorStop(0, '#8B4513');
                gradient.addColorStop(0.5, '#A0522D');
                gradient.addColorStop(1, '#8B4513');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                 ctx.strokeStyle = '#6B3E26';
                ctx.lineWidth = 0.5;
                for (let i = 0; i < this.width; i += 10) {
                    ctx.beginPath();
                    ctx.moveTo(this.x + i, this.y);
                    ctx.lineTo(this.x + i, this.y + this.height);
                    ctx.stroke();
                }
            } else if (!this.isBase) {
                 const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
                gradient.addColorStop(0, this.flavor.mainColor);
                gradient.addColorStop(1, this.flavor.gradientColor);
                
                ctx.fillStyle = gradient;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                 ctx.fillStyle = this.flavor.frostingColor;
                ctx.globalAlpha = 0.85;
                ctx.fillRect(this.x, this.y, this.width, 3);
                ctx.globalAlpha = 1.0;
                
                 const dotsCount = Math.floor(this.width / 20);
                ctx.fillStyle = this.flavor.dotColor;
                
                for (let i = 0; i < dotsCount; i++) {
                    ctx.beginPath();
                    ctx.arc(this.x + 10 + (i * 20), this.y + this.height/2, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                 ctx.strokeStyle = this.flavor.gradientColor;
                ctx.lineWidth = 0.5;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            }
        }

        update() {
            if (this.moving) {
                this.x += speed * direction;
                
                 if (this.x + this.width > canvas.width) {
                    direction = -1;
                } else if (this.x < 0) {
                    direction = 1;
                }
            }
        }
    }
    
     class FallingPiece {
        constructor(x, y, width, height, flavor) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.flavor = flavor;
            



//falling speed settings
//             // (reduce these values to make pieces fall slower)
            this.velocityY = 0.5 + Math.random() * 1; // Was: 1 + Math.random() * 2
            
            // (how much pieces move sideways while falling)
            this.velocityX = (Math.random() - 0.5) * 1.5; // Was: (Math.random() - 0.5) * 3
            
            // Rotation properties
            this.rotation = 0;
            this.rotationSpeed = (Math.random() - 0.5) * 0.1; // Was: 0.2 (slower rotation)
            
            // (how quickly pieces speed up while falling)
            this.gravity = 0.1 + Math.random() * 0.05; // Was: 0.2 + Math.random() * 0.1
        }
        
        update() {
            
            this.velocityY += this.gravity;
            
            
            this.y += this.velocityY;
            this.x += this.velocityX;
            
            
            this.rotation += this.rotationSpeed;
            
            
            return this.y < canvas.height + 100;
        }
        
        draw() {
            
            ctx.save();
            
            
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(this.rotation);
            
            
            const gradient = ctx.createLinearGradient(-this.width/2, -this.height/2, -this.width/2, this.height/2);
            gradient.addColorStop(0, this.flavor.mainColor);
            gradient.addColorStop(1, this.flavor.gradientColor);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            
            
            ctx.fillStyle = this.flavor.frostingColor;
            ctx.globalAlpha = 0.85;
            ctx.fillRect(-this.width/2, -this.height/2, this.width, 3);
            ctx.globalAlpha = 1.0;
            
            
            if (this.width > 15) {
                ctx.fillStyle = this.flavor.dotColor;
                ctx.beginPath();
                ctx.arc(0, 0, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            
            ctx.restore();
        }
    }

    
    const blocks = [];
    const fallingPieces = [];

    
    // Resize canvas function with mobile optimization
    function resizeCanvas() {
        // Get the actual container dimensions
        const container = canvas.parentElement;
        
        // For mobile devices, calculate precise dimensions
        if (window.innerWidth <= 480) {
            const header = document.querySelector('.game-header');
            const controls = document.querySelector('.game-controls');
            
            canvas.width = window.innerWidth;
            
            // Calculate available height precisely with extra padding considerations
            const headerHeight = header.offsetHeight;
            const controlsHeight = controls.offsetHeight;
            const availableHeight = window.innerHeight - headerHeight - controlsHeight;
            
            // Account for safe areas and extra padding, minimum 200px height
            canvas.height = Math.max(availableHeight - 20, 200); 
        } else {
            // Desktop sizing
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }
        
        // Redraw game state
        if (blocks.length > 0) {
            redrawBlocks();
        } else {
            initGame();
        }
    }

    
    function initGame() {
        
        blocks.length = 0;
        fallingPieces.length = 0;
        score = 0;
        scoreDisplay.textContent = score;
        gameOver = false;
        currentStackHeight = 0;
        gameStarted = false;
        
        
        const baseHeight = blockHeight;
        const baseWidth = canvas.width * 0.4;
        const baseY = canvas.height - baseHeight;
        
        const baseBlock = new Block(baseY, baseWidth, baseHeight, true);
        blocks.push(baseBlock);
        
        
        currentStackHeight = baseHeight;
        createNewBlock();
        
        
        animate();
    }

    
    function restartGame() {
        
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        
        tapButton.textContent = "TAP TO DROP CAKE";
        
        
        speed = 2;
        direction = 1;
        
        
        initGame();
    }

    
    function createNewBlock() {
        const prevBlock = blocks[blocks.length - 1];
        const newY = canvas.height - currentStackHeight - blockHeight;
        const newBlock = new Block(newY, prevBlock.width, blockHeight);
        blocks.push(newBlock);
    }

    
    function placeBlock() {
        if (gameOver) {
            
            restartGame();
            return;
        }
        
        
        if (!gameStarted) {
            gameStarted = true;
        }
        
        const currentBlock = blocks[blocks.length - 1];
        const prevBlock = blocks[blocks.length - 2];
        
        currentBlock.moving = false;
        
        
        let newWidth = currentBlock.width;
        let offset = 0;
        let perfectPlacement = false; // Flag for perfect placement

        
        if (currentBlock.x + currentBlock.width < prevBlock.x || 
            currentBlock.x > prevBlock.x + prevBlock.width) {
            gameOver = true;
            tapButton.textContent = "GAME OVER - TAP TO RESTART";
            return;
        }

        // Check for perfect placement (within a small tolerance)
        if (Math.abs(currentBlock.x - prevBlock.x) < 0.5 && 
            Math.abs(currentBlock.width - prevBlock.width) < 0.5) {
            perfectPlacement = true;
            // Keep currentBlock.x and currentBlock.width as is, but align to prevBlock for perfect stack
            currentBlock.x = prevBlock.x;
            currentBlock.width = prevBlock.width; 
            showPerfectMessage();
        } else {
            if (currentBlock.x < prevBlock.x) {
                const overhang = prevBlock.x - currentBlock.x;
                
                
                const fallingPiece = new FallingPiece(
                    currentBlock.x,
                    currentBlock.y,
                    overhang,
                    blockHeight,
                    currentBlock.flavor
                );
                fallingPieces.push(fallingPiece);
                
                
                newWidth = currentBlock.width - overhang;
                offset = overhang;
            } 
            
            if (currentBlock.x + currentBlock.width > prevBlock.x + prevBlock.width) {
                const rightOverhangWidth = currentBlock.x + currentBlock.width - (prevBlock.x + prevBlock.width);
                const rightOverhangX = prevBlock.x + prevBlock.width;
                
                
                const fallingPiece = new FallingPiece(
                    rightOverhangX,
                    currentBlock.y,
                    rightOverhangWidth,
                    blockHeight,
                    currentBlock.flavor
                );
                fallingPieces.push(fallingPiece);
                
                
                if (offset === 0) { 
                    newWidth = prevBlock.x + prevBlock.width - currentBlock.x;
                } else {
                    
                    newWidth = prevBlock.width;
                }
            }
            currentBlock.width = newWidth;
            currentBlock.x += offset;
        }

        
        score++;
        scoreDisplay.textContent = score;
        
        
        currentStackHeight += blockHeight;
        
        
        if (currentStackHeight > canvas.height * 0.6) {
            scrollBlocks();
        } else {
            createNewBlock();
        }
        
        
        if (score % 5 === 0 && speed < 5) {
            speed += 0.5;
        }
    }

    
    function scrollBlocks() {
        const scrollAmount = blockHeight;
        blocks.forEach(block => {
            block.y += scrollAmount;
        });
        currentStackHeight -= scrollAmount;
        createNewBlock();
    }

    
    function redrawBlocks() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        blocks.forEach(block => block.draw());
    }

    // Function to show perfect placement message
    function showPerfectMessage() {
        let perfectMsg = document.querySelector('.perfect-message');
        if (!perfectMsg) {
            perfectMsg = document.createElement('div');
            perfectMsg.classList.add('perfect-message');
            gameContainer.appendChild(perfectMsg);
        }
        perfectMsg.textContent = "Perfect!";
        perfectMsg.classList.add('show');
        setTimeout(() => {
            perfectMsg.classList.remove('show');
        }, 1000); // Message visible for 1 second
    }

    
    function animate() {
        animationId = requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        
        blocks.forEach(block => {
            block.draw();
            block.update();
        });
        
        
        for (let i = fallingPieces.length - 1; i >= 0; i--) {
            fallingPieces[i].draw();
            const stillVisible = fallingPieces[i].update();
            
            if (!stillVisible) {
                fallingPieces.splice(i, 1);
            }
        }
        
        if (gameOver) {
            cancelAnimationFrame(animationId);
        }
    }

    
    tapButton.addEventListener('click', placeBlock);
    window.addEventListener('resize', resizeCanvas);
    
    
    // Enhanced touch handling for mobile
    document.addEventListener('touchstart', function(e) {
        if (e.target === canvas || e.target === tapButton) {
            e.preventDefault();
            placeBlock();
        }
    }, {passive: false});
    
    // Prevent zoom on double tap
    document.addEventListener('touchend', function(e) {
        e.preventDefault();
    }, {passive: false});
    
    // Handle orientation changes
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            resizeCanvas();
        }, 200); // Increased delay to ensure proper orientation change
    });
    
    // Add load event listener for better mobile compatibility
    window.addEventListener('load', function() {
        setTimeout(resizeCanvas, 100);
    });
    
    
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            placeBlock();
        }
    });
    
    // Initial resize
    resizeCanvas();
});