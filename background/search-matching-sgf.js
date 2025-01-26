function searchMatchingSgf(source, target) {
  // SGFとターゲットを";"で分割して有効な棋譜の動きだけを抽出
const sgfMoves = source.split(";").filter(move => move.includes("[") && move.includes("]"));
const targetMoves = target.split(";").filter(move => move.includes("[") && move.includes("]"));

// ターゲットが順序通りに含まれているかをチェック
let targetIndex = 0;
for (const move of sgfMoves) {
    if (move === targetMoves[targetIndex]) {
        targetIndex++;
        if (targetIndex === targetMoves.length) {
            return true; 
        }
    }
}
if (targetIndex < targetMoves.length) {
    window.alert("該当するSGFが見つかりませんでした");
    return false; 
}
}