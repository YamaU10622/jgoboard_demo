// 外部jsインポート
var el = document.createElement("script");
el.src = "./background/search-matching-sgf.js";
document.body.appendChild(el);

var updateCaptures = function (node) {
  document.getElementById('black-captures').innerText = node.info.captures[JGO.BLACK];
  document.getElementById('white-captures').innerText = node.info.captures[JGO.WHITE];
};
var jrecord = new JGO.Record(19);
var jboard = jrecord.jboard;
var jsetup = new JGO.Setup(jboard, JGO.BOARD.largeWalnut);
var player = JGO.BLACK; // next player
var ko = false, lastMove = false; // ko coordinate and last move coordinate
var lastHover = false, lastX = -1, lastY = -1; // hover helper vars

document.getElementById('show-sgf-btn').addEventListener('click', function() {
  var targetsgf = exportToSGF(jrecord);
  const fs = require('fs');
  const json = fs.readFileSync("./background/data/test_sgf.json", 'utf-8');
  const sourcedata = JSON.parse(json);
  var sourcesgf = sourcedata[0].sgf;
  var isFound = searchMatchingSgf(sourcesgf,targetsgf);
  
  if(isFound){
    var matchsgfarray = [sourcesgf];
    var serializedarray = JSON.stringify(matchsgfarray);
    localStorage.setItem("matchsgfarray", serializedarray);
    window.location.href = "matchingsgf.html";
  }
});

var exportToSGF = function(record) {
  var sgf = "(;FF[4]GM[1]SZ[" + record.jboard.width + "]"; // 初期設定(碁盤の大きさの情報追加)
  var node = record.root;
  
  while (node) {
    if (node.info && node.info.lastMove) {  // lastMoveプロパティをチェック
      sgf += ";";
      var coord = node.info.lastMove;
      var color = node.info.lastPlayer == JGO.BLACK ? "B" : "W";
      sgf += color + "[" + String.fromCharCode(97 + coord.i) + String.fromCharCode(97 + coord.j) + "]";
    }
    // console.log(node);
    node = node.children[0];
  }
  sgf += ")";
  return sgf;
};

jsetup.setOptions({stars: {points:5}});
jsetup.create('input-board', function(canvas) {
  canvas.addListener('click', function(coord, ev) {
    var opponent = (player == JGO.BLACK) ? JGO.WHITE : JGO.BLACK;

    if(ev.shiftKey) { // on shift do edit
      if(jboard.getMark(coord) == JGO.MARK.NONE)
        jboard.setMark(coord, JGO.MARK.SELECTED);
      else
        jboard.setMark(coord, JGO.MARK.NONE);

      return;
    }


    if(lastHover)
      jboard.setType(new JGO.Coordinate(lastX, lastY), JGO.CLEAR);

    lastHover = false;

    var play = jboard.playMove(coord, player, ko);

    if(play.success) {
      node = jrecord.createNode(true);
      node.info.captures[player] += play.captures.length;
      
      // この部分を修正
      node.info.lastMove = coord;  // 着手座標を保存
      node.info.lastPlayer = player;  // 着手したプレイヤーを保存
      
      node.setType(coord, player);
      node.setType(play.captures, JGO.CLEAR);
      if(lastMove)
        node.setMark(lastMove, JGO.MARK.NONE);
      if(ko)
        node.setMark(ko, JGO.MARK.NONE);
      node.setMark(coord, JGO.MARK.CIRCLE);
      lastMove = coord;
      
      if(play.ko)
        node.setMark(play.ko, JGO.MARK.CIRCLE);
      ko = play.ko;
      
      player = opponent;
      updateCaptures(node);
    } else alert('Illegal move: ' + play.errorMsg);
  });

  canvas.addListener('mousemove', function(coord, ev) {
    if(coord.i == -1 || coord.j == -1 || (coord.i == lastX && coord.j == lastY))
      return;
    if(lastHover)
      jboard.setType(new JGO.Coordinate(lastX, lastY), JGO.CLEAR);
    
    lastX = coord.i;
    lastY = coord.j;
    
    if(jboard.getType(coord) == JGO.CLEAR && jboard.getMark(coord) == JGO.MARK.NONE) {
      jboard.setType(coord, player == JGO.WHITE ? JGO.DIM_WHITE : JGO.DIM_BLACK);
      lastHover = true;
    } else
      lastHover = false;
  });

  canvas.addListener('mouseout', function(ev) {
    if(lastHover)
      jboard.setType(new JGO.Coordinate(lastX, lastY), JGO.CLEAR);
    
    lastHover = false;
  });
});