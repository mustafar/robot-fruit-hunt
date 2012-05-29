var ThatFruityAndroid = {

   Moves : {
      NORTH : NORTH,
      SOUTH : SOUTH,
      EAST : EAST,
      WEST : WEST,
      TAKE : TAKE,
      PASS : PASS
   },
   Weights : {
      THEIR_FRUIT_COUNT_BIAS : 0.2,
      FRUIT_WEIGHT_TAKE_THRESHOLD : 5
   },


   newGame : function() {
   },
   getBoard : function() {
      this.board = get_board();
      return this.board;
   },
   getMyX : function() {
      return get_my_x();
   },
   getMyY : function() {
      return get_my_y();
   },
   getTheirX : function() {
      return get_opponent_x();
   },
   getTheirY : function() {
      return get_opponent_y();
   },
   getNumFruitTypes : function() {
      return get_number_of_item_types();
   },
   getFruitTypeCountMine : function(type) {
      return get_my_item_count(type);
   },
   getFruitTypeCountTheirs : function(type) {
      return get_opponent_item_count(type);
   },
   getFruitTypeCountTotal : function(type) {
      return get_total_item_count(type);
   },

   board : null,
   fruitWeights : null,
   milestone : null,
   path : null,


   setFruitWeights : function(){
      var numFruitTypes = this.getNumFruitTypes();
      var fruitWeights = new Array();
      for (var i=0; i < numFruitTypes; i++) {
         var fruitType = i + 1;
         var myCount = this.getFruitTypeCountMine(fruitType);
         var theirCount = this.getFruitTypeCountTheirs(fruitType);
         var totalCount = this.getFruitTypeCountTotal(fruitType);
         var remainingCount = totalCount - (myCount + theirCount);
         var winningCount = (totalCount / 2) + 0.5;
         var needMine = winningCount - myCount;
         var needTheirs = winningCount - theirCount;
         var weight = 0;
         if (needTheirs<=0 || needMine<=0) {
            weight = 0;
         } else {
            var myWeight = 100/needMine;
            var theirWeight = 100/needTheirs;
            weight = myWeight 
                   - (this.Weights.THEIR_FRUIT_COUNT_BIAS * theirWeight);
            if (weight < 0) {
               weight = 0;
            }
         }
         fruitWeights[fruitType] = weight;
      }
      this.fruitWeights = fruitWeights;
   },

   setMilestone : function(myX, myY) {
      var milestone = new Object();
      milestone.x = myX;
      milestone.y = myY;
      var maxDist = this.board.length + this.board[0].length;
      var maxScore = 0;
      for (var i=0; i<this.board.length; i++) {
         for (var j=0; j<this.board[0].length; j++) {
            if (!this.board[i][j]) {
               continue;
            }
            var distX = Math.abs(myX - i);
            var distY = Math.abs(myY - j);
            var dist = distX + distY;
            if (dist == 0) {
               dist = 1;
            }
            var fruitWeight = this.fruitWeights[this.board[i][j]];
            var score = fruitWeight / (dist*100/maxDist);
            if (score > maxScore) {
               maxScore = score;
               milestone.x = i;
               milestone.y = j;
            }
         }
      }
      return milestone;
   },

   setSprint : function(myX, myY) {
      var milestone = this.setMilestone(myX, myY);
      var path = this.chartPath(myX, myY, milestone.x, milestone.y);
      if (this.path) {
         this.path.length = 0;
      }
      this.path = path;
   },

   chartPath : function (srcX, srcY, destX, destY) {
      var goEast = (srcX <= destX)? true : false;
      var goSouth = (srcY <= destY)? true : false;
      var moves = new Array();
      if (srcX <= destX) {
         var minX = srcX;
         var maxX = destX;
      } else {
         var minX = destX;
         var maxX = srcX;
      }
      if (srcY <= destY) {
         var minY = srcY;
         var maxY = destY;
      } else {
         var minY = destY;
         var maxY = srcY;
      }

      xCounts = new Object();
      yCounts = new Object();
      for (var i=minX; i<=maxX; i++) {
         if (xCounts[i] === undefined) {
            xCounts[i] = 0;
         }
         for (var j=minY; j<=maxY; j++) {
            if (yCounts[j] === undefined) {
               yCounts[j] = 0;
            }
            if(this.board[i][j]) {
               xCounts[i] += this.fruitWeights[this.board[i][j]];
               yCounts[j] += this.fruitWeights[this.board[i][j]];
            }
         }
      }

      var pathComplete = false;
      while (!pathComplete) {
         if (srcX===destX && srcY===destY) {
            pathComplete = true;
            continue;
         }

         var lastPosX = srcX;
         var lastPosY = srcY;
         var move = null;

         // check north-south move first for easy move
         if (yCounts[srcY] === undefined || yCounts[srcY] === 0){
            if (goSouth) {
               srcY += 1;
               move = this.Moves.SOUTH;
            } else {
               srcY -= 1;
               move = this.Moves.NORTH;
            }

         // check east-west move for easy move
         } else if (xCounts[srcX] === undefined || xCounts[srcX] === 0) {
            if (goEast) {
               srcX += 1;
               move = this.Moves.EAST;
            } else {
               srcX -= 1;
               move = this.Moves.WEST;
            }

         // make the best move
         } else {
            if (yCounts[srcY] <= xCounts[srcX]) {
               if (goSouth) {
                  srcY += 1;
                  move = this.Moves.SOUTH;
               } else {
                  srcY -= 1;
                  move = this.Moves.NORTH;
               }
            } else {
               if (goEast) {
                  srcX += 1;
                  move = this.Moves.EAST;
               } else {
                  srcX -= 1;
                  move = this.Moves.WEST;
               }
            }
         }

         moves.push(move);

         if (lastPosX !== srcX) {
            xCounts[lastPosX] = undefined;
         } else if (lastPosY !== srcY) {
            yCounts[lastPosY] = undefined;
         }

         if ((srcX===destX) && (srcY===destY)) {
            pathComplete = true;
         }

         // final check - should not be needed
         if (srcX<0 || srcX>=this.board.length || 
               srcY<0 || srcY>=this.board[0].length) {
            pathComplete = true;
         }
      }
      return moves;
   },

   makeMove : function() {
      var board = this.getBoard();
      var myX = this.getMyX();
      var myY = this.getMyY();
      var theirX = this.getTheirX();
      var theirY = this.getTheirY();

      // set weights for individual fruit types.
      this.setFruitWeights();

      // set path to current milestone
      if (this.path === undefined || 
            this.path === null ||
            this.path.length === 0 ||
            (this.milestone 
               && board[this.milestone.x][this.milestone.y])) {
         this.setSprint(myX, myY);
      }

      // make decision to TAKE
      if (board[myX][myY] > 0) {
         if (this.fruitWeights[board[myX][myY]]
               > this.Weights.FRUIT_WEIGHT_TAKE_THRESHOLD) {
            return this.Moves.TAKE;
         }
      }

      var move = this.path.shift();
      if (move === undefined) {
         if (board[myX][myY] > 0) {
            move = this.Moves.TAKE;
         } else {
            move = this.Moves.PASS;
         }
      }

      //console.log("Move "+move);
      return move;
   }
}

function new_game() {
   ThatFruityAndroid.newGame();
}

function make_move() {
   return ThatFruityAndroid.makeMove();
}

